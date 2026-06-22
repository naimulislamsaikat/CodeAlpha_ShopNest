// ===== STATE =====
const state = {
  user: null,
  cart: { items: [], total: 0, count: 0 },
  currentPage: null,
};

// ===== API HELPER =====
async function api(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`/api${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ===== TOAST =====
function toast(message, type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ===== ROUTER =====
const routes = {};
let currentParams = {};

function navigate(page, params = {}) {
  currentParams = params;
  const app = document.getElementById('app');

  // Close dropdown
  document.getElementById('userDropdown').classList.remove('open');

  // Show header and footer for non-admin pages
  if (page !== 'admin') {
    document.getElementById('header').style.display = '';
    document.querySelector('footer').style.display = '';
  }

  if (routes[page]) {
    routes[page](app, params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  state.currentPage = page;
}

function handleSearch(e) {
  if (e.key === 'Enter') doSearch();
}
function doSearch() {
  const q = document.getElementById('searchInput').value.trim();
  if (q) navigate('products', { search: q });
}

// ===== AUTH =====
async function loadUser() {
  try {
    const { user } = await api('GET', '/auth/me');
    state.user = user;
    updateHeaderAuth();
    if (user) await loadCart();
  } catch (_) {}
}

function updateHeaderAuth() {
  const guestLinks = document.getElementById('guestLinks');
  const authLinks = document.getElementById('authLinks');
  const adminLink = document.getElementById('adminLink');
  const userNameEl = document.getElementById('dropdownUserName');
  const cartBtn = document.getElementById('cartBtn');

  if (state.user) {
    guestLinks.style.display = 'none';
    authLinks.style.display = 'block';
    userNameEl.textContent = state.user.name;
    adminLink.style.display = state.user.role === 'admin' ? 'block' : 'none';
    cartBtn.style.display = '';
  } else {
    guestLinks.style.display = 'block';
    authLinks.style.display = 'none';
    adminLink.style.display = 'none';
    cartBtn.style.display = '';
    updateCartBadge(0);
  }
}

function toggleUserDropdown() {
  document.getElementById('userDropdown').classList.toggle('open');
}
document.addEventListener('click', (e) => {
  if (!document.getElementById('userMenu').contains(e.target)) {
    document.getElementById('userDropdown').classList.remove('open');
  }
});

function toggleMobileMenu() {
  const nav = document.getElementById('navLinks');
  nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
  nav.style.flexDirection = 'column';
  nav.style.position = 'absolute';
  nav.style.top = '68px';
  nav.style.left = '0';
  nav.style.right = '0';
  nav.style.background = 'white';
  nav.style.padding = '12px';
  nav.style.borderBottom = '1px solid #e2e8f0';
  nav.style.zIndex = '99';
}

async function logout() {
  await api('POST', '/auth/logout');
  state.user = null;
  state.cart = { items: [], total: 0, count: 0 };
  updateHeaderAuth();
  toast('Signed out successfully', 'info');
  navigate('home');
}

// ===== CART =====
async function loadCart() {
  if (!state.user) return;
  try {
    const data = await api('GET', '/cart');
    state.cart = data;
    updateCartBadge(data.count);
  } catch (_) {}
}

function updateCartBadge(count) {
  const badge = document.getElementById('cartBadge');
  if (count > 0) {
    badge.textContent = count > 99 ? '99+' : count;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

async function addToCart(productId, qty = 1) {
  if (!state.user) {
    toast('Please sign in to add items to cart', 'warning');
    navigate('login');
    return;
  }
  try {
    await api('POST', '/cart/add', { product_id: productId, quantity: qty });
    await loadCart();
    toast('Added to cart!', 'success');
  } catch (e) {
    toast(e.message, 'error');
  }
}

async function updateCartItem(productId, qty) {
  try {
    await api('PUT', '/cart/update', { product_id: productId, quantity: qty });
    await loadCart();
    if (state.currentPage === 'cart') navigate('cart');
  } catch (e) {
    toast(e.message, 'error');
  }
}

async function removeFromCart(productId) {
  try {
    await api('DELETE', `/cart/remove/${productId}`);
    await loadCart();
    if (state.currentPage === 'cart') navigate('cart');
    toast('Item removed', 'info');
  } catch (e) {
    toast(e.message, 'error');
  }
}

// ===== HELPERS =====
function formatPrice(p) { return `$${parseFloat(p).toFixed(2)}`; }
function formatDate(d) { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
function discount(orig, cur) { return Math.round((1 - cur / orig) * 100); }
function stars(rating) {
  const full = Math.floor(rating), half = rating % 1 >= 0.5 ? 1 : 0, empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}
function renderStars(rating, count) {
  return `<div class="product-rating">
    <span class="stars">${stars(rating)}</span>
    <span class="rating-count">(${count})</span>
  </div>`;
}
function statusBadge(status) {
  return `<span class="status-badge status-${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
}
function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function requireAuth(cb) {
  if (!state.user) {
    toast('Please sign in to continue', 'warning');
    navigate('login');
    return false;
  }
  return cb ? cb() : true;
}

// ===== INIT =====
window.addEventListener('DOMContentLoaded', async () => {
  await loadUser();
  navigate('home');
});
