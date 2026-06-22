// ===== ADMIN PANEL =====
routes.admin = async (app) => {
  if (!state.user || state.user.role !== 'admin') {
    toast('Admin access required', 'error');
    navigate('login');
    return;
  }

  renderAdminShell(app);
  
  // Close admin menu when clicking outside
  setTimeout(() => {
    document.addEventListener('click', (e) => {
      const menu = document.getElementById('adminProfileMenu');
      const profileInfo = document.querySelector('.admin-profile-info');
      if (menu && profileInfo && !profileInfo.contains(e.target)) {
        menu.style.display = 'none';
      }
    });
  }, 100);
  
  await renderAdminDashboard();
};

function renderAdminShell(app) {
  // Hide header and footer for admin panel
  document.getElementById('header').style.display = 'none';
  document.querySelector('footer').style.display = 'none';
  
  app.innerHTML = `
  <div class="admin-layout">
    <div class="admin-topbar">
      <div class="admin-topbar-left">
        <h2 style="margin:0;color:white;">ShopNest Admin</h2>
      </div>
      <div class="admin-topbar-right">
        <div class="admin-profile-info">
          <div style="text-align:right;">
            <div style="font-weight:600;color:white;">${escapeHtml(state.user.name)}</div>
            <div style="font-size:.85rem;color:#93c5fd;">${escapeHtml(state.user.email)}</div>
          </div>
          <button class="admin-profile-btn" onclick="toggleAdminMenu()">👤</button>
          <div class="admin-profile-menu" id="adminProfileMenu" style="display:none;">
            <button onclick="openAdminProfileEdit()">✏️ Edit Profile</button>
            <button onclick="logout()">🚪 Logout</button>
          </div>
        </div>
      </div>
    </div>
    <div class="admin-sidebar">
      <h3>Admin Panel</h3>
      <div class="admin-nav-item active" id="nav-dashboard" onclick="adminNav('dashboard')">📊 Dashboard</div>
      <div class="admin-nav-item" id="nav-products" onclick="adminNav('products')">📦 Products</div>
      <div class="admin-nav-item" id="nav-orders" onclick="adminNav('orders')">🧾 Orders</div>
      <div class="admin-nav-item" id="nav-users" onclick="adminNav('users')">👥 Users</div>
      <div class="admin-nav-item" style="margin-top:auto;border-top:1px solid rgba(255,255,255,.1);padding-top:12px;" onclick="navigate('home')">← Back to Store</div>
    </div>
    <div class="admin-content" id="adminContent">
      <div class="loading-spinner"><div class="spinner"></div></div>
    </div>
  </div>`;
}

window.adminNav = function(section) {
  document.querySelectorAll('.admin-nav-item').forEach(el => el.classList.remove('active'));
  const nav = document.getElementById(`nav-${section}`);
  if (nav) nav.classList.add('active');

  const fns = { dashboard: renderAdminDashboard, products: renderAdminProducts, orders: renderAdminOrders, users: renderAdminUsers };
  if (fns[section]) fns[section]();
};

async function renderAdminDashboard() {
  const c = document.getElementById('adminContent');
  if (!c) return;
  try {
    const s = await api('GET', '/admin/stats');
    c.innerHTML = `
    <div class="admin-header"><h2>Dashboard</h2><p style="color:var(--gray-2);font-size:.875rem;">Welcome back, ${escapeHtml(state.user.name)}</p></div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon">💰</div><div class="stat-label">Total Revenue</div><div class="stat-value">$${Number(s.totalRevenue).toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2})}</div></div>
      <div class="stat-card"><div class="stat-icon">🧾</div><div class="stat-label">Total Orders</div><div class="stat-value">${s.totalOrders}</div></div>
      <div class="stat-card"><div class="stat-icon">⏳</div><div class="stat-label">Pending Orders</div><div class="stat-value" style="color:var(--warning)">${s.pendingOrders}</div></div>
      <div class="stat-card"><div class="stat-icon">👥</div><div class="stat-label">Total Customers</div><div class="stat-value">${s.totalUsers}</div></div>
      <div class="stat-card"><div class="stat-icon">📦</div><div class="stat-label">Products</div><div class="stat-value">${s.totalProducts}</div></div>
    </div>
    <div class="admin-table-wrap">
      <div style="padding:16px 20px;border-bottom:1px solid var(--gray-5);font-weight:700;">Recent Orders</div>
      <table class="admin-table">
        <thead><tr><th>Order #</th><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
        <tbody>
          ${s.recentOrders.map(o => `
          <tr>
            <td style="font-weight:600">#${o.id}</td>
            <td><div style="font-weight:500">${escapeHtml(o.user_name)}</div><div style="font-size:.8rem;color:var(--gray-3)">${escapeHtml(o.user_email)}</div></td>
            <td style="font-weight:600">${formatPrice(o.total)}</td>
            <td>${statusBadge(o.status)}</td>
            <td style="color:var(--gray-2)">${formatDate(o.created_at)}</td>
            <td>
              <select onchange="updateOrderStatus(${o.id},this.value)" style="padding:5px 8px;border:1.5px solid var(--gray-4);border-radius:6px;font-size:.8rem;">
                ${['pending','processing','shipped','delivered','cancelled'].map(s => `<option value="${s}" ${o.status===s?'selected':''}>${s}</option>`).join('')}
              </select>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
  } catch (e) {
    document.getElementById('adminContent').innerHTML = `<div class="empty-state"><h3>Error loading dashboard</h3><p>${e.message}</p></div>`;
  }
}

async function renderAdminProducts() {
  const c = document.getElementById('adminContent');
  c.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;
  try {
    const { products } = await api('GET', '/admin/products');
    const { categories } = await api('GET', '/products/categories');
    window._adminCats = categories;

    c.innerHTML = `
    <div class="admin-header" style="display:flex;justify-content:space-between;align-items:center;">
      <div><h2>Products</h2><p style="color:var(--gray-2);font-size:.875rem;">${products.length} products</p></div>
      <button class="btn btn-primary" onclick="openProductModal()">+ Add Product</button>
    </div>
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Featured</th><th>Actions</th></tr></thead>
        <tbody id="productsTableBody">
          ${products.map(p => renderProductRow(p)).join('')}
        </tbody>
      </table>
    </div>
    ${productModal(categories)}`;
  } catch (e) {
    c.innerHTML = `<div class="empty-state"><h3>Error</h3><p>${e.message}</p></div>`;
  }
}

function renderProductRow(p) {
  return `<tr id="prow-${p.id}">
    <td><img src="${escapeHtml(p.image)}" class="table-img" onerror="this.src='https://via.placeholder.com/48'"></td>
    <td style="font-weight:500;max-width:200px;">${escapeHtml(p.name)}</td>
    <td><span style="font-size:.8rem;padding:3px 8px;background:var(--primary-light);color:var(--primary);border-radius:99px;">${escapeHtml(p.category_name||'—')}</span></td>
    <td style="font-weight:600">${formatPrice(p.price)}</td>
    <td><span style="color:${p.stock<5?'var(--danger)':p.stock<15?'var(--warning)':'var(--success)'}">${p.stock}</span></td>
    <td>${p.featured ? '<span style="color:var(--success)">✓</span>' : '<span style="color:var(--gray-4)">—</span>'}</td>
    <td>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-ghost btn-sm" onclick="openProductModal(${p.id})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id})">Delete</button>
      </div>
    </td>
  </tr>`;
}

function productModal(cats) {
  return `
  <div class="modal-overlay" id="productModal" style="display:none;">
    <div class="modal">
      <div class="modal-header">
        <h3 id="modalTitle">Add Product</h3>
        <button class="modal-close" onclick="closeProductModal()">✕</button>
      </div>
      <div class="modal-body">
        <input type="hidden" id="editProductId">
        <div class="form-group"><label>Product Name *</label><input type="text" id="pName" placeholder="Product name"></div>
        <div class="form-group"><label>Description</label><textarea id="pDesc" placeholder="Product description"></textarea></div>
        <div class="form-row">
          <div class="form-group"><label>Price *</label><input type="number" id="pPrice" step="0.01" min="0" placeholder="0.00"></div>
          <div class="form-group"><label>Original Price</label><input type="number" id="pOrigPrice" step="0.01" min="0" placeholder="Leave blank if no discount"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Stock</label><input type="number" id="pStock" min="0" placeholder="0"></div>
          <div class="form-group"><label>Category</label>
            <select id="pCategory">
              <option value="">— Select —</option>
              ${cats.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group"><label>Image URL</label><input type="url" id="pImage" placeholder="https://..."></div>
        <div class="form-group" style="display:flex;align-items:center;gap:10px;">
          <input type="checkbox" id="pFeatured" style="width:16px;height:16px;accent-color:var(--primary)">
          <label for="pFeatured" style="margin:0;cursor:pointer;">Featured product</label>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="closeProductModal()">Cancel</button>
        <button class="btn btn-primary" onclick="saveProduct()" id="saveProductBtn">Save Product</button>
      </div>
    </div>
  </div>`;
}

window.openProductModal = async function(id) {
  document.getElementById('productModal').style.display = 'flex';
  document.getElementById('editProductId').value = id || '';
  document.getElementById('modalTitle').textContent = id ? 'Edit Product' : 'Add Product';
  document.getElementById('saveProductBtn').textContent = id ? 'Update Product' : 'Save Product';

  if (id) {
    try {
      const { product: p } = await api('GET', `/products/${id}`);
      document.getElementById('pName').value = p.name;
      document.getElementById('pDesc').value = p.description || '';
      document.getElementById('pPrice').value = p.price;
      document.getElementById('pOrigPrice').value = p.original_price || '';
      document.getElementById('pStock').value = p.stock;
      document.getElementById('pCategory').value = p.category_id || '';
      document.getElementById('pImage').value = p.image || '';
      document.getElementById('pFeatured').checked = !!p.featured;
    } catch (e) { toast('Could not load product', 'error'); }
  } else {
    ['pName','pDesc','pPrice','pOrigPrice','pStock','pImage'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('pCategory').value = '';
    document.getElementById('pFeatured').checked = false;
  }
};
window.closeProductModal = () => document.getElementById('productModal').style.display = 'none';

window.saveProduct = async function() {
  const id = document.getElementById('editProductId').value;
  const data = {
    name: document.getElementById('pName').value.trim(),
    description: document.getElementById('pDesc').value.trim(),
    price: document.getElementById('pPrice').value,
    original_price: document.getElementById('pOrigPrice').value || null,
    stock: document.getElementById('pStock').value || 0,
    category_id: document.getElementById('pCategory').value || null,
    image: document.getElementById('pImage').value.trim() || null,
    featured: document.getElementById('pFeatured').checked
  };
  if (!data.name || !data.price) { toast('Name and price are required', 'error'); return; }

  try {
    if (id) {
      await api('PUT', `/admin/products/${id}`, data);
      toast('Product updated', 'success');
    } else {
      await api('POST', '/admin/products', data);
      toast('Product created', 'success');
    }
    closeProductModal();
    renderAdminProducts();
  } catch (e) { toast(e.message, 'error'); }
};

window.deleteProduct = async function(id) {
  if (!confirm('Delete this product? This cannot be undone.')) return;
  try {
    await api('DELETE', `/admin/products/${id}`);
    toast('Product deleted', 'success');
    renderAdminProducts();
  } catch (e) { toast(e.message, 'error'); }
};

async function renderAdminOrders() {
  const c = document.getElementById('adminContent');
  c.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;
  try {
    const { orders } = await api('GET', '/admin/orders');
    c.innerHTML = `
    <div class="admin-header"><h2>All Orders</h2><p style="color:var(--gray-2);font-size:.875rem;">${orders.length} orders total</p></div>
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead><tr><th>#</th><th>Customer</th><th>Amount</th><th>Payment</th><th>Status</th><th>Date</th><th>Update</th></tr></thead>
        <tbody>
          ${orders.map(o => `
          <tr>
            <td style="font-weight:600">#${o.id}</td>
            <td><div style="font-weight:500">${escapeHtml(o.user_name)}</div><div style="font-size:.8rem;color:var(--gray-3)">${escapeHtml(o.user_email)}</div></td>
            <td style="font-weight:700">${formatPrice(o.total)}</td>
            <td style="text-transform:uppercase;font-size:.8rem;">${o.payment_method}</td>
            <td>${statusBadge(o.status)}</td>
            <td style="color:var(--gray-2);font-size:.85rem;">${formatDate(o.created_at)}</td>
            <td>
              <select onchange="updateOrderStatus(${o.id},this.value)" style="padding:5px 8px;border:1.5px solid var(--gray-4);border-radius:6px;font-size:.8rem;">
                ${['pending','processing','shipped','delivered','cancelled'].map(s=>`<option value="${s}" ${o.status===s?'selected':''}>${s}</option>`).join('')}
              </select>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
  } catch (e) { c.innerHTML = `<div class="empty-state"><h3>Error</h3><p>${e.message}</p></div>`; }
}

window.updateOrderStatus = async function(id, status) {
  try {
    await api('PUT', `/admin/orders/${id}/status`, { status });
    toast('Order status updated', 'success');
  } catch (e) { toast(e.message, 'error'); }
};

async function renderAdminUsers() {
  const c = document.getElementById('adminContent');
  c.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;
  try {
    const { users } = await api('GET', '/admin/users');
    c.innerHTML = `
    <div class="admin-header"><h2>Customers</h2><p style="color:var(--gray-2);font-size:.875rem;">${users.filter(u=>u.role==='user').length} customers</p></div>
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead>
        <tbody>
          ${users.map(u => `
          <tr>
            <td style="font-weight:500">${escapeHtml(u.name)}</td>
            <td style="color:var(--gray-2)">${escapeHtml(u.email)}</td>
            <td><span style="font-size:.75rem;padding:3px 10px;border-radius:99px;font-weight:700;background:${u.role==='admin'?'var(--primary-light)':'var(--gray-6)'};color:${u.role==='admin'?'var(--primary)':'var(--gray-2)'};">${u.role}</span></td>
            <td style="color:var(--gray-2);font-size:.85rem;">${formatDate(u.created_at)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
  } catch (e) { c.innerHTML = `<div class="empty-state"><h3>Error</h3><p>${e.message}</p></div>`; }
}

window.toggleAdminMenu = function() {
  const menu = document.getElementById('adminProfileMenu');
  if (menu) menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
};

window.openAdminProfileEdit = function() {
  const menu = document.getElementById('adminProfileMenu');
  if (menu) menu.style.display = 'none';
  
  const content = document.getElementById('adminContent');
  const admin = state.user;
  
  content.innerHTML = `
    <div class="admin-header"><h2>Edit Profile</h2></div>
    <div style="max-width:600px;margin:20px auto;">
      <div style="background:white;border-radius:12px;padding:24px;border:1.5px solid var(--gray-5);">
        <form onsubmit="return saveAdminProfile(event)">
          <div style="margin-bottom:20px;">
            <label style="display:block;font-weight:600;margin-bottom:8px;color:var(--dark);">Name</label>
            <input type="text" id="adminName" value="${escapeHtml(admin.name)}" required style="width:100%;padding:10px 12px;border:1.5px solid var(--gray-4);border-radius:8px;font-size:1rem;font-family:inherit;">
          </div>
          <div style="margin-bottom:20px;">
            <label style="display:block;font-weight:600;margin-bottom:8px;color:var(--dark);">Email</label>
            <input type="email" value="${escapeHtml(admin.email)}" disabled style="width:100%;padding:10px 12px;border:1.5px solid var(--gray-4);border-radius:8px;font-size:1rem;font-family:inherit;background:var(--gray-6);color:var(--gray-3);">
            <p style="font-size:.85rem;color:var(--gray-3);margin-top:4px;">Email cannot be changed</p>
          </div>
          <div style="margin-bottom:20px;">
            <label style="display:block;font-weight:600;margin-bottom:8px;color:var(--dark);">Phone</label>
            <input type="tel" id="adminPhone" value="${escapeHtml(admin.phone || '')}" style="width:100%;padding:10px 12px;border:1.5px solid var(--gray-4);border-radius:8px;font-size:1rem;font-family:inherit;">
          </div>
          <div style="margin-bottom:20px;">
            <label style="display:block;font-weight:600;margin-bottom:8px;color:var(--dark);">Address</label>
            <textarea id="adminAddress" style="width:100%;padding:10px 12px;border:1.5px solid var(--gray-4);border-radius:8px;font-size:1rem;font-family:inherit;resize:vertical;min-height:100px;">${escapeHtml(admin.address || '')}</textarea>
          </div>
          <div style="display:flex;gap:12px;">
            <button type="submit" class="btn btn-primary">Save Changes</button>
            <button type="button" class="btn btn-secondary" onclick="adminNav('dashboard')">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  `;
};

window.saveAdminProfile = async function(event) {
  event.preventDefault();
  try {
    const name = document.getElementById('adminName').value;
    const phone = document.getElementById('adminPhone').value;
    const address = document.getElementById('adminAddress').value;
    
    await api('PUT', '/auth/profile', { name, phone, address });
    state.user.name = name;
    state.user.phone = phone;
    state.user.address = address;
    
    toast('Profile updated successfully', 'success');
    adminNav('dashboard');
  } catch (e) {
    toast(e.message, 'error');
  }
  return false;
};
