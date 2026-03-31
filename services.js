// ── PRODUTOS ───────────────────────────────────────────────────────────────────

const ProdutosService = {
  async listar(filtros = {}) {
    let rows = await tableQuery("Produtos");
    if (filtros.marca)
      rows = rows.filter((r) =>
        r.Marca?.toLowerCase().includes(filtros.marca.toLowerCase()),
      );
    if (filtros.modelo)
      rows = rows.filter((r) =>
        r.Modelo?.toLowerCase().includes(filtros.modelo.toLowerCase()),
      );
    if (filtros.precoMin)
      rows = rows.filter(
        (r) => parseFloat(r.Valor) >= parseFloat(filtros.precoMin),
      );
    if (filtros.precoMax)
      rows = rows.filter(
        (r) => parseFloat(r.Valor) <= parseFloat(filtros.precoMax),
      );
    return rows;
  },

  async buscarPorId(id) {
    const rows = await tableQuery("Produtos", `RowKey eq '${id}'`);
    return rows[0] || null;
  },

  async salvar(produto, imagemFile = null) {
    const id =
      produto.id ||
      `prod_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    let imagemUrl = produto.imagemUrl || "";

    if (imagemFile) {
      const ext = imagemFile.name.split(".").pop();
      const blobName = `${id}.${ext}`;
      imagemUrl = await uploadBlob(imagemFile, blobName);
    }

    const entity = {
      PartitionKey: "Produto",
      RowKey: id,
      Marca: produto.marca || "",
      Modelo: produto.modelo || "",
      Valor: parseFloat(produto.valor) || 0,
      Quantidade: parseInt(produto.quantidade) || 0,
      Descricao: produto.descricao || "",
      ImagemUrl: imagemUrl,
      VendedorId: produto.vendedorId || "",
      VendedorNome: produto.vendedorNome || "",
      Ativo: true,
    };

    await tableRequest("Produtos", "POST", entity);
    return entity;
  },

  async atualizar(id, produto, imagemFile = null) {
    let imagemUrl = produto.imagemUrl || "";
    if (imagemFile) {
      const ext = imagemFile.name.split(".").pop();
      const blobName = `${id}_${Date.now()}.${ext}`;
      imagemUrl = await uploadBlob(imagemFile, blobName);
    }

    const entity = {
      PartitionKey: "Produto",
      RowKey: id,
      Marca: produto.marca || "",
      Modelo: produto.modelo || "",
      Valor: parseFloat(produto.valor) || 0,
      Quantidade: parseInt(produto.quantidade) || 0,
      Descricao: produto.descricao || "",
      ImagemUrl: imagemUrl || produto.imagemUrl || "",
      VendedorId: produto.vendedorId || "",
      VendedorNome: produto.vendedorNome || "",
      Ativo: produto.ativo !== undefined ? produto.ativo : true,
    };

    const url = `${AZURE_CONFIG.tableEndpoint}/Produtos(PartitionKey='Produto',RowKey='${encodeURIComponent(id)}')?${AZURE_CONFIG.sasToken}`;
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Accept: "application/json;odata=nometadata",
        "Content-Type": "application/json",
        "x-ms-version": "2020-12-06",
        "x-ms-date": new Date().toUTCString(),
        "If-Match": "*",
      },
      body: JSON.stringify(entity),
    });
    if (!res.ok && res.status !== 204)
      throw new Error(`Atualizar produto: ${res.status}`);
    return entity;
  },
  
  async excluir(id) {
    const prod = await this.buscarPorId(id);
    if (!prod) throw new Error("Produto não encontrado");

    const url = `${AZURE_CONFIG.tableEndpoint}/Produtos(PartitionKey='${encodeURIComponent(prod.PartitionKey)}',RowKey='${encodeURIComponent(id)}')?${AZURE_CONFIG.sasToken}`;

    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        "x-ms-version": "2020-12-06",
        "x-ms-date": new Date().toUTCString(),
        "If-Match": "*",
      },
    });

    if (!res.ok && res.status !== 204) {
      const err = await res.text();
      throw new Error(`Delete falhou: ${res.status} - ${err}`);
    }
  },

  async atualizarQuantidade(id, delta) {
    const prod = await this.buscarPorId(id);
    if (!prod) throw new Error("Produto não encontrado");
    prod.Quantidade = (parseInt(prod.Quantidade) || 0) + delta;
    await this.atualizar(id, {
      marca: prod.Marca,
      modelo: prod.Modelo,
      valor: prod.Valor,
      quantidade: prod.Quantidade,
      descricao: prod.Descricao,
      imagemUrl: prod.ImagemUrl,
      ativo: prod.Ativo,
    });
    return prod;
  },
};

// ── CLIENTES ──────────────────────────────────────────────────────────────────

const ClientesService = {
  async listar() {
    return tableQuery("Clientes");
  },

  async buscarPorId(id) {
    const rows = await tableQuery("Clientes", `RowKey eq '${id}'`);
    return rows[0] || null;
  },

  async salvar(cliente) {
    const id = `cli_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const entity = {
      PartitionKey: "Cliente",
      RowKey: id,
      Nome: cliente.nome || "",
      Email: cliente.email || "",
      Telefone: cliente.telefone || "",
      CPF: cliente.cpf || "",
      Endereco: cliente.endereco || "",
      Cidade: cliente.cidade || "",
      CEP: cliente.cep || "",
      DataCadastro: new Date().toISOString(),
      IsSeller: false,
    };
    await tableRequest("Clientes", "POST", entity);
    return entity;
  },

  async atualizar(id, cliente) {
    const existing = await this.buscarPorId(id);
    const entity = {
      PartitionKey: "Cliente",
      RowKey: id,
      Nome: cliente.nome || existing?.Nome || "",
      Email: cliente.email || existing?.Email || "",
      Telefone: cliente.telefone || existing?.Telefone || "",
      CPF: cliente.cpf || existing?.CPF || "",
      Endereco: cliente.endereco || existing?.Endereco || "",
      Cidade: cliente.cidade || existing?.Cidade || "",
      CEP: cliente.cep || existing?.CEP || "",
      DataCadastro: existing?.DataCadastro || new Date().toISOString(),
      IsSeller:
        cliente.isSeller !== undefined
          ? cliente.isSeller
          : existing?.IsSeller || false,
    };
    const url = `${AZURE_CONFIG.tableEndpoint}/Clientes(PartitionKey='Cliente',RowKey='${encodeURIComponent(id)}')?${AZURE_CONFIG.sasToken}`;
    await fetch(url, {
      method: "PUT",
      headers: {
        Accept: "application/json;odata=nometadata",
        "Content-Type": "application/json",
        "x-ms-version": "2020-12-06",
        "x-ms-date": new Date().toUTCString(),
        "If-Match": "*",
      },
      body: JSON.stringify(entity),
    });
    return entity;
  },

  async excluir(id) {
    const url = `${AZURE_CONFIG.tableEndpoint}/Clientes(PartitionKey='Cliente',RowKey='${encodeURIComponent(id)}')?${AZURE_CONFIG.sasToken}`;
    await fetch(url, {
      method: "DELETE",
      headers: {
        "x-ms-version": "2020-12-06",
        "x-ms-date": new Date().toUTCString(),
        "If-Match": "*",
      },
    });
  },

  async historicoPedidos(clienteId) {
    return tableQuery("Pedidos", `ClienteId eq '${clienteId}'`);
  },
};

// ── PEDIDOS ───────────────────────────────────────────────────────────────────

const PedidosService = {
  async listar() {
    return tableQuery("Pedidos");
  },

  async buscarPorId(id) {
    const rows = await tableQuery("Pedidos", `RowKey eq '${id}'`);
    return rows[0] || null;
  },

  async criar(pedido) {
    const id = `ped_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    // Validate stock
    for (const item of pedido.itens) {
      const prod = await ProdutosService.buscarPorId(item.produtoId);
      if (!prod) throw new Error(`Produto ${item.produtoId} não encontrado`);
      if (parseInt(prod.Quantidade) < item.quantidade)
        throw new Error(
          `Estoque insuficiente para ${prod.Modelo}: disponível ${prod.Quantidade}, solicitado ${item.quantidade}`,
        );
    }

    const entity = {
      PartitionKey: "Pedido",
      RowKey: id,
      ClienteId: pedido.clienteId || "",
      ClienteNome: pedido.clienteNome || "",
      Itens: JSON.stringify(pedido.itens),
      Total: parseFloat(pedido.total) || 0,
      MetodoPagamento: pedido.metodoPagamento || "",
      MetodoEntrega: pedido.metodoEntrega || "",
      Status: "Confirmado",
      DataPedido: new Date().toISOString(),
      Endereco: pedido.endereco || "",
    };

    await tableRequest("Pedidos", "POST", entity);

    // Deduct stock
    for (const item of pedido.itens) {
      await ProdutosService.atualizarQuantidade(
        item.produtoId,
        -item.quantidade,
      );
    }

    return entity;
  },
};

// ── CART (localStorage) ───────────────────────────────────────────────────────

const CartService = {
  get() {
    try {
      return JSON.parse(localStorage.getItem("cart") || "[]");
    } catch {
      return [];
    }
  },
  save(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
  },
  add(produto, quantidade = 1) {
    const cart = this.get();
    const idx = cart.findIndex((i) => i.produtoId === produto.RowKey);
    if (idx >= 0) cart[idx].quantidade += quantidade;
    else
      cart.push({
        produtoId: produto.RowKey,
        nome: `${produto.Marca} ${produto.Modelo}`,
        valor: parseFloat(produto.Valor),
        quantidade,
        imagemUrl: produto.ImagemUrl,
      });
    this.save(cart);
    updateCartBadge();
  },
  remove(produtoId) {
    this.save(this.get().filter((i) => i.produtoId !== produtoId));
    updateCartBadge();
  },
  clear() {
    localStorage.removeItem("cart");
    updateCartBadge();
  },
  total() {
    return this.get().reduce((s, i) => s + i.valor * i.quantidade, 0);
  },
  count() {
    return this.get().reduce((s, i) => s + i.quantidade, 0);
  },
};

function updateCartBadge() {
  const badge = document.getElementById("cart-badge");
  if (badge) {
    const count = CartService.count();
    badge.textContent = count;
    badge.style.display = count > 0 ? "flex" : "none";
  }
}

// ── SESSION ───────────────────────────────────────────────────────────────────

const SessionService = {
  getCliente() {
    try {
      return JSON.parse(localStorage.getItem("clienteLogado") || "null");
    } catch {
      return null;
    }
  },
  setCliente(c) {
    localStorage.setItem("clienteLogado", JSON.stringify(c));
  },
  logout() {
    localStorage.removeItem("clienteLogado");
  },
  isLogged() {
    return !!this.getCliente();
  },
};
