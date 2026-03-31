// Azure Storage Configuration
const AZURE_CONFIG = {
  accountName: 'stocompnuvem2p1',
  sasToken: 'sv=2024-11-04&ss=bt&srt=sco&sp=rwdlacuiytfx&se=2026-04-20T06:27:11Z&st=2026-03-30T22:12:11Z&spr=https&sig=7cD%2Fck%2BAQOAuUVgfTttGvZYPjA2GarxNhuOD2avf18w%3D',
  blobEndpoint: 'https://stocompnuvem2p1.blob.core.windows.net',
  tableEndpoint: 'https://stocompnuvem2p1.table.core.windows.net',
  containerName: 'julia-imagens',
};

// ── TABLE STORAGE API ──────────────────────────────────────────────────────────

async function tableRequest(table, method = 'GET', body = null, rowKey = null, partitionKey = null) {
  let url = `${AZURE_CONFIG.tableEndpoint}/${table}`;
  if (partitionKey && rowKey) {
    url += `(PartitionKey='${encodeURIComponent(partitionKey)}',RowKey='${encodeURIComponent(rowKey)}')`;
  } else if (rowKey) {
    url += `(RowKey='${encodeURIComponent(rowKey)}')`;
  }
  url += `?${AZURE_CONFIG.sasToken}`;

  const headers = {
    'Accept': 'application/json;odata=nometadata',
    'Content-Type': 'application/json',
    'x-ms-version': '2020-12-06',
    'x-ms-date': new Date().toUTCString(),
    'DataServiceVersion': '3.0',
  };

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  if (!res.ok && res.status !== 204) {
    const err = await res.text();
    throw new Error(`Table ${method} ${table}: ${res.status} - ${err}`);
  }
  if (res.status === 204 || res.headers.get('content-length') === '0') return null;
  return res.json();
}

async function tableQuery(table, filter = '') {
  let url = `${AZURE_CONFIG.tableEndpoint}/${table}?${AZURE_CONFIG.sasToken}`;
  if (filter) url += `&$filter=${encodeURIComponent(filter)}`;
  url += '&$top=1000';
  const headers = {
    'Accept': 'application/json;odata=nometadata',
    'x-ms-version': '2020-12-06',
    'x-ms-date': new Date().toUTCString(),
    'DataServiceVersion': '3.0',
  };
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Query ${table}: ${res.status}`);
  const data = await res.json();
  return data.value || [];
}

async function ensureTableExists(tableName) {
  const url = `${AZURE_CONFIG.tableEndpoint}/Tables?${AZURE_CONFIG.sasToken}`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json;odata=nometadata',
        'Content-Type': 'application/json',
        'x-ms-version': '2020-12-06',
        'x-ms-date': new Date().toUTCString(),
      },
      body: JSON.stringify({ TableName: tableName }),
    });
  } catch (_) { /* table may already exist */ }
}

// ── BLOB STORAGE API ───────────────────────────────────────────────────────────

async function ensureContainer() {
  const url = `${AZURE_CONFIG.blobEndpoint}/${AZURE_CONFIG.containerName}?restype=container&${AZURE_CONFIG.sasToken}`;
  try {
    await fetch(url, { method: 'PUT', headers: { 'x-ms-version': '2020-12-06', 'x-ms-blob-public-access': 'blob' } });
  } catch (_) {}
}

async function uploadBlob(file, blobName) {
  await ensureContainer();
  const url = `${AZURE_CONFIG.blobEndpoint}/${AZURE_CONFIG.containerName}/${blobName}?${AZURE_CONFIG.sasToken}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'x-ms-blob-type': 'BlockBlob',
      'Content-Type': file.type,
      'x-ms-version': '2020-12-06',
    },
    body: file,
  });
  if (!res.ok) throw new Error(`Upload blob: ${res.status}`);
  return `${AZURE_CONFIG.blobEndpoint}/${AZURE_CONFIG.containerName}/${blobName}`;
}

function getBlobUrl(blobName) {
  if (!blobName) return null;
  if (blobName.startsWith('http')) return blobName;
  return `${AZURE_CONFIG.blobEndpoint}/${AZURE_CONFIG.containerName}/${blobName}`;
}

// ── INIT ───────────────────────────────────────────────────────────────────────

async function initStorage() {
  await Promise.all([
    ensureTableExists('JuliaProdutos'),
    ensureTableExists('JuliaClientes'),
    ensureTableExists('JuliaPedidos'),
    ensureContainer(),
  ]);
}
