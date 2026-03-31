// ── TOAST ──────────────────────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) { container = document.createElement('div'); container.id = 'toast-container'; document.body.appendChild(container); }
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => t.remove(), 3100);
}

// ── LOADER ─────────────────────────────────────────────────────────────────────
let loaderEl = null;
function showLoader(msg = 'Carregando...') {
  if (!loaderEl) {
    loaderEl = document.createElement('div');
    loaderEl.className = 'loading-overlay';
    loaderEl.innerHTML = `<div class="loader"></div><div style="color:var(--text2);font-size:.9rem">${msg}</div>`;
    document.body.appendChild(loaderEl);
  }
  loaderEl.querySelector('div:last-child').textContent = msg;
  loaderEl.classList.add('show');
}
function hideLoader() { if (loaderEl) loaderEl.classList.remove('show'); }

// ── MODAL ──────────────────────────────────────────────────────────────────────
function openModal(id) { const el = document.getElementById(id); if (el) { el.classList.add('open'); document.body.style.overflow = 'hidden'; } }
function closeModal(id) { const el = document.getElementById(id); if (el) { el.classList.remove('open'); document.body.style.overflow = ''; } }
document.addEventListener('click', e => { if (e.target.classList.contains('modal-overlay')) { e.target.classList.remove('open'); document.body.style.overflow = ''; } });

// ── TABS ───────────────────────────────────────────────────────────────────────
function initTabs(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const target = container.querySelector(`#tab-${btn.dataset.tab}`);
      if (target) target.classList.add('active');
    });
  });
}

// ── CONFIRM ────────────────────────────────────────────────────────────────────
function confirmDialog(msg) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.innerHTML = `<div class="modal" style="max-width:400px"><div class="modal-body" style="padding:28px"><p style="font-size:1rem;margin-bottom:22px">${msg}</p><div style="display:flex;gap:10px;justify-content:flex-end"><button class="btn btn-ghost" id="cc">Cancelar</button><button class="btn btn-danger" id="co">Confirmar</button></div></div></div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#co').onclick = () => { overlay.remove(); resolve(true); };
    overlay.querySelector('#cc').onclick = () => { overlay.remove(); resolve(false); };
  });
}

// ── FORMAT ─────────────────────────────────────────────────────────────────────
function formatCurrency(v) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0); }
function formatDate(iso) { if (!iso) return '—'; return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso)); }

// ── NAV ACTIVE ─────────────────────────────────────────────────────────────────
function setActiveNav() {
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav a').forEach(a => {
    const href = a.getAttribute('href');
    a.classList.toggle('active', href === path || (path === '' && href === 'index.html'));
  });
}

// ── SELLER SERVICE ─────────────────────────────────────────────────────────────
const SellerService = {
  isSeller(cliente) { return cliente?.IsSeller === true || cliente?.IsSeller === 'true'; },
  async becomeSeller(clienteId) {
    const c = await ClientesService.buscarPorId(clienteId);
    if (!c) throw new Error('Cliente não encontrado');
    await ClientesService.atualizar(clienteId, { ...c, nome: c.Nome, email: c.Email, cpf: c.CPF, telefone: c.Telefone, endereco: c.Endereco, cidade: c.Cidade, cep: c.CEP, isSeller: true });
    const updated = await ClientesService.buscarPorId(clienteId);
    SessionService.setCliente(updated);
    return updated;
  },
};

// ── RENDER HEADER ──────────────────────────────────────────────────────────────
function renderHeader(isAdmin = false) {
  const cliente = SessionService.getCliente();
  const isSeller = SellerService.isSeller(cliente);
  const cartCount = CartService.count();

  const adminBadge = isAdmin ? `<div class="admin-header-bar"><div class="container">⚡ Painel Administrativo — NuvemMart</div></div>` : '';

  const adminNav = `
    <a href="admin-produtos.html">Produtos</a>
    <a href="admin-clientes.html">Clientes</a>
    <a href="admin-pedidos.html">Pedidos</a>`;

  const storeNav = `
    <a href="index.html">Início</a>
    <a href="produtos.html">Produtos</a>
    ${cliente ? `<a href="minha-conta.html">Minha Conta</a>` : ''}
    ${isSeller ? `<a href="vendedor.html" class="seller-link">🏪 Meus Anúncios</a>` : `<a href="seja-vendedor.html" class="seller-link">🏪 Seja Vendedor</a>`}`;

  const userArea = cliente
    ? `<div class="user-pill" onclick="location.href='minha-conta.html'">
        <div class="user-avatar">${cliente.Nome?.[0] || '?'}</div>
        <span style="font-size:.84rem;max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${cliente.Nome.split(' ')[0]}</span>
        ${isSeller ? `<span class="badge badge-seller" style="font-size:.6rem;padding:1px 5px">Vendedor</span>` : ''}
      </div>
      <button class="btn btn-ghost btn-sm" onclick="doLogout()">Sair</button>`
    : `<button class="btn btn-secondary btn-sm" onclick="location.href='login.html'">Entrar</button>
<button class="btn btn-primary btn-sm" onclick="location.href='login.html#register'">Cadastrar</button>`;
  const cartBtn = !isAdmin ? `
    <button class="btn-cart" onclick="toggleCart()">
      🛒 Carrinho
      <span id="cart-badge" style="display:${cartCount > 0 ? 'flex' : 'none'}">${cartCount}</span>
    </button>` : '';

  document.getElementById('app-header').innerHTML = `
    ${adminBadge}
    <header>
      <div class="container header-inner">
        <a href="${isAdmin ? 'admin-produtos.html' : 'index.html'}" class="logo">
          Nuvem<span>Mart</span>
        </a>
        <nav id="main-nav">${isAdmin ? adminNav : storeNav}</nav>
        <div class="header-actions">
          ${cartBtn}
          ${!isAdmin ? userArea : `<button class="btn btn-ghost btn-sm" onclick="location.href='index.html'">← Loja</button>`}
        </div>
      </div>
    </header>`;
  setActiveNav();
}

function doLogout() { SessionService.logout(); CartService.clear(); location.href = 'index.html'; }

// ── CART SIDEBAR ───────────────────────────────────────────────────────────────
function renderCartSidebar() {
  const existing = document.getElementById('cart-sidebar');
  if (existing) existing.remove();
  const cart = CartService.get();
  const total = CartService.total();
  const itemsHtml = cart.length === 0
    ? `<div class="empty-state"><div class="icon">🛒</div><h3>Carrinho vazio</h3><p class="text-muted text-sm">Adicione produtos para continuar</p></div>`
    : cart.map(item => `
      <div class="cart-item">
        ${item.imagemUrl ? `<img class="cart-item-img" src="${getBlobUrl(item.imagemUrl)}" alt="${item.nome}" onerror="this.style.display='none'">` : `<div class="cart-item-img" style="display:flex;align-items:center;justify-content:center;font-size:1.5rem">📦</div>`}
        <div class="cart-item-info">
          <div class="cart-item-name">${item.nome}</div>
          <div class="cart-item-price">${formatCurrency(item.valor)}</div>
          <div class="cart-item-qty">
            <button class="qty-btn" onclick="cartQty('${item.produtoId}',-1)">−</button>
            <span style="font-size:.9rem;min-width:20px;text-align:center">${item.quantidade}</span>
            <button class="qty-btn" onclick="cartQty('${item.produtoId}',1)">+</button>
            <button class="qty-btn" onclick="cartRemove('${item.produtoId}')" style="margin-left:4px;color:var(--danger)">×</button>
          </div>
        </div>
      </div>`).join('');

  const sidebar = document.createElement('div');
  sidebar.id = 'cart-sidebar';
  sidebar.className = 'cart-sidebar';
  sidebar.innerHTML = `
    <div class="cart-sidebar-header">
      <h3 style="font-size:1.1rem">Carrinho</h3>
      <button class="modal-close" onclick="toggleCart()">✕</button>
    </div>
    <div class="cart-items">${itemsHtml}</div>
    ${cart.length > 0 ? `
    <div class="cart-footer">
      <div class="cart-total">
        <span class="cart-total-label">Total</span>
        <span class="cart-total-value">${formatCurrency(total)}</span>
      </div>
      <button class="btn btn-primary btn-full" onclick="location.href='checkout.html';toggleCart()">Finalizar Compra →</button>
    </div>` : ''}`;
  document.body.appendChild(sidebar);
}

let cartOpen = false;
function toggleCart() {
  cartOpen = !cartOpen;
  if (cartOpen) renderCartSidebar();
  const sidebar = document.getElementById('cart-sidebar');
  if (sidebar) {
    setTimeout(() => sidebar.classList.toggle('open', cartOpen), 10);
    if (!cartOpen) setTimeout(() => { if (!cartOpen) sidebar.remove(); }, 300);
  }
}
function cartQty(id, delta) {
  const cart = CartService.get();
  const idx = cart.findIndex(i => i.produtoId === id);
  if (idx >= 0) { cart[idx].quantidade += delta; if (cart[idx].quantidade <= 0) cart.splice(idx, 1); }
  CartService.save(cart);
  if (cartOpen) renderCartSidebar();
  const sidebar = document.getElementById('cart-sidebar');
  if (sidebar) setTimeout(() => sidebar.classList.add('open'), 10);
  updateCartBadge();
}
function cartRemove(id) {
  CartService.remove(id);
  if (cartOpen) renderCartSidebar();
  const sidebar = document.getElementById('cart-sidebar');
  if (sidebar) setTimeout(() => sidebar.classList.add('open'), 10);
}
