// ===== HOME PAGE =====
routes.home = async (app) => {
  // Admin users see admin dashboard instead of home page
  if (state.user && state.user.role === 'admin') {
    routes.admin(app);
    return;
  }

  app.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;
  try {
    const [featuredData, catData] = await Promise.all([
      api('GET', '/products?featured=1&limit=6'),
      api('GET', '/products/categories')
    ]);

    app.innerHTML = `
    <!-- Hero -->
    <section class="hero">
      <div class="hero-content">
        <div class="hero-badge">✦ New Arrivals Every Week</div>
        <h1>Shop Smarter,<br>Live Better</h1>
        <p>Discover thousands of quality products at unbeatable prices, delivered to your door.</p>
        <div class="hero-actions">
          <button class="btn btn-primary btn-lg" onclick="navigate('products')">Shop Now →</button>
          <!-- <button class="btn btn-secondary btn-lg" onclick="navigate('products', {category:'electronics'})">Electronics</button> -->
          <Button class="btn btn-secondary btn-lg" onclick="navigate('login')">Log In</button>
        </div>
      </div>
    </section>

    <!-- Categories -->
    <section style="padding: 40px 0 0;">
      <div class="container">
        <div class="section-header">
          <h2>Shop by Category</h2>
          <a href="#" onclick="navigate('products')">View all</a>
        </div>
        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(140px,1fr)); gap:12px; margin-bottom:20px;">
          ${catData.categories.map(c => `
            <div onclick="navigate('products',{category:'${c.slug}'})" style="background:white;border:1.5px solid var(--gray-5);border-radius:12px;padding:20px 12px;text-align:center;cursor:pointer;transition:all .2s;" onmouseover="this.style.borderColor='var(--primary)';this.style.boxShadow='0 4px 12px rgba(37,99,235,.12)'" onmouseout="this.style.borderColor='var(--gray-5)';this.style.boxShadow=''">
              <div style="font-size:1.8rem;margin-bottom:8px;">${catIcons[c.slug] || '📦'}</div>
              <div style="font-size:.85rem;font-weight:600;color:var(--dark)">${c.name}</div>
              <div style="font-size:.75rem;color:var(--gray-3);margin-top:3px">${c.product_count} items</div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- Featured Products -->
    <section class="section">
      <div class="container">
        <div class="section-header">
          <h2>Featured Products</h2>
          <a href="#" onclick="navigate('products')">See all products</a>
        </div>
        <div class="product-grid">
          ${featuredData.products.map(renderProductCard).join('')}
        </div>
      </div>
    </section>

    <!-- Promo Banners -->
    <section style="background:var(--gray-6); padding:40px 0;">
      <div class="container">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div style="background:linear-gradient(135deg,#0f172a,#1e3a5f);color:white;border-radius:16px;padding:32px;cursor:pointer;" onclick="navigate('products',{category:'electronics'})">
            <div style="font-size:.8rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#93c5fd;margin-bottom:8px">Electronics Sale</div>
            <div style="font-size:1.5rem;font-weight:700;margin-bottom:8px">Up to 30% Off<br>Tech Essentials</div>
            <div style="color:#93c5fd;font-size:.875rem">Shop Now →</div>
          </div>
          <div style="background:linear-gradient(135deg,#92400e,#d97706);color:white;border-radius:16px;padding:32px;cursor:pointer;" onclick="navigate('products',{category:'clothing'})">
            <div style="font-size:.8rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#fde68a;margin-bottom:8px">Fashion Forward</div>
            <div style="font-size:1.5rem;font-weight:700;margin-bottom:8px">New Season<br>Collection</div>
            <div style="color:#fde68a;font-size:.875rem">Explore →</div>
          </div>
        </div>
      </div>
    </section>
    `;
  } catch (e) {
    app.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Something went wrong</h3><p>${e.message}</p></div>`;
  }
};

const catIcons = {
  electronics: '📱',
  clothing: '👕',
  'home-garden': '🏡',
  sports: '⚽',
  books: '📚',
  beauty: '💄',
  'toys-games': '🧸',
  health: '💊',
  automotive: '🚗'
};

// ===== PRODUCT CARD =====
function renderProductCard(p) {
  const disc = p.original_price ? discount(p.original_price, p.price) : 0;
  return `
  <div class="product-card" onclick="navigate('product', {id:${p.id}})">
    <div class="product-img-wrap">
      <img src="${p.image}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x400?text=Product'">
      ${disc > 0 ? `<span class="product-badge badge-sale">-${disc}%</span>` : p.featured ? `<span class="product-badge badge-featured">Featured</span>` : ''}
    </div>
    <div class="product-info">
      <div class="product-category">${escapeHtml(p.category_name || 'General')}</div>
      <div class="product-name">${escapeHtml(p.name)}</div>
      ${renderStars(p.rating, p.review_count)}
      <div class="product-price">
        <span class="price-current">${formatPrice(p.price)}</span>
        ${p.original_price ? `<span class="price-original">${formatPrice(p.original_price)}</span><span class="price-discount">-${disc}%</span>` : ''}
      </div>
      <button class="add-to-cart-btn ${p.stock <= 0 ? 'out-of-stock' : ''}" 
        onclick="event.stopPropagation(); ${p.stock > 0 ? `addToCart(${p.id})` : ''}"
        ${p.stock <= 0 ? 'disabled' : ''}>
        ${p.stock > 0 ? '🛒 Add to Cart' : 'Out of Stock'}
      </button>
    </div>
  </div>`;
}

// ===== PRODUCTS PAGE =====
routes.products = async (app, params = {}) => {
  app.innerHTML = `
  <section class="page-banner">
    <h1>All Products</h1>
    <p>Find exactly what you're looking for</p>
  </section>
  <div id="productsMain"><div class="loading-spinner"><div class="spinner"></div></div></div>`;

  try {
    const catData = await api('GET', '/products/categories');

    let qp = new URLSearchParams();
    if (params.category) qp.set('category', params.category);
    if (params.search) qp.set('search', params.search);
    qp.set('limit', '200');

    const data = await api('GET', `/products?${qp}`);

    document.getElementById('productsMain').innerHTML = `
    <div class="container">
      <!-- Category Pills -->
      <div style="display:flex;gap:8px;flex-wrap:wrap;padding:20px 0 0;">
        <button class="cat-pill ${!params.category ? 'active' : ''}" onclick="navigate('products')">All</button>
        ${catData.categories.map(c => `
          <button class="cat-pill ${params.category === c.slug ? 'active' : ''}" onclick="navigate('products',{category:'${c.slug}'})">
            ${catIcons[c.slug] || ''} ${c.name}
          </button>
        `).join('')}
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar">
        ${params.search ? `<div style="background:var(--primary-light);color:var(--primary);padding:6px 14px;border-radius:99px;font-size:.85rem;font-weight:600;">Search: "${escapeHtml(params.search)}" <button onclick="navigate('products')" style="margin-left:6px;color:var(--primary);font-weight:700">×</button></div>` : ''}
        <select onchange="navigate('products', {...currentParams, sort: this.value})">
          <option value="">Sort: Default</option>
          <option value="price-asc" ${params.sort === 'price-asc' ? 'selected' : ''}>Price: Low to High</option>
          <option value="price-desc" ${params.sort === 'price-desc' ? 'selected' : ''}>Price: High to Low</option>
          <option value="rating" ${params.sort === 'rating' ? 'selected' : ''}>Top Rated</option>
          <option value="popular" ${params.sort === 'popular' ? 'selected' : ''}>Most Popular</option>
        </select>
        <span class="results-count">${data.total} products found</span>
      </div>

      <!-- Grid -->
      ${data.products.length ? `<div class="product-grid" style="padding-bottom:48px;">${data.products.map(renderProductCard).join('')}</div>`
        : `<div class="empty-state"><div class="empty-icon">🔍</div><h3>No products found</h3><p>Try a different search or category.</p><button class="btn btn-primary" onclick="navigate('products')">Browse All</button></div>`}
    </div>`;
  } catch (e) {
    document.getElementById('productsMain').innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Error loading products</h3><p>${e.message}</p></div>`;
  }
};

// ===== PRODUCT DETAIL =====
routes.product = async (app, { id }) => {
  app.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;
  try {
    const { product: p, related } = await api('GET', `/products/${id}`);
    const disc = p.original_price ? discount(p.original_price, p.price) : 0;

    let stockStatus, stockClass;
    if (p.stock <= 0) { stockStatus = '✗ Out of Stock'; stockClass = 'out-stock'; }
    else if (p.stock < 10) { stockStatus = `⚠ Only ${p.stock} left`; stockClass = 'low-stock'; }
    else { stockStatus = '✓ In Stock'; stockClass = 'in-stock'; }

    app.innerHTML = `
    <div class="product-detail">
      <button class="back-btn" onclick="navigate('products')">← Back</button>
      <div class="product-detail-grid">
        <div class="product-detail-img">
          <img src="${p.image}" alt="${escapeHtml(p.name)}" onerror="this.src='https://via.placeholder.com/600x600?text=Product'">
        </div>
        <div class="product-detail-info">
          <div style="font-size:.8rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--primary);margin-bottom:8px;">${escapeHtml(p.category_name || '')}</div>
          <h1>${escapeHtml(p.name)}</h1>
          ${renderStars(p.rating, p.review_count)}
          <div class="product-detail-price">
            <span class="price-current">${formatPrice(p.price)}</span>
            ${p.original_price ? `<span class="price-original">${formatPrice(p.original_price)}</span><span class="price-discount">Save ${disc}%</span>` : ''}
          </div>
          <p class="product-description">${escapeHtml(p.description || 'No description available.')}</p>
          <span class="stock-info ${stockClass}">${stockStatus}</span>

          ${p.stock > 0 ? `
          <div class="qty-selector">
            <button class="qty-btn" onclick="changeQty(-1)">−</button>
            <input type="number" class="qty-input" id="qtyInput" value="1" min="1" max="${p.stock}">
            <button class="qty-btn" onclick="changeQty(1)">+</button>
          </div>
          <div class="detail-actions">
            <button class="btn btn-primary btn-lg" onclick="addDetailToCart(${p.id})">🛒 Add to Cart</button>
            <button class="btn btn-ghost btn-lg" onclick="navigate('cart')">View Cart</button>
          </div>` : `<button class="btn btn-ghost btn-lg" disabled>Out of Stock</button>`}
        </div>
      </div>

      ${related.length ? `
      <div style="margin-top:60px;">
        <div class="section-header"><h2>Related Products</h2></div>
        <div class="product-grid">${related.map(renderProductCard).join('')}</div>
      </div>` : ''}
    </div>`;
  } catch (e) {
    app.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Product not found</h3><button class="btn btn-primary mt-16" onclick="navigate('products')">Browse Products</button></div>`;
  }
};

window.changeQty = function (delta) {
  const input = document.getElementById('qtyInput');
  if (!input) return;
  const max = parseInt(input.max);
  input.value = Math.max(1, Math.min(max, parseInt(input.value || 1) + delta));
};
window.addDetailToCart = function (id) {
  const qty = parseInt(document.getElementById('qtyInput')?.value || 1);
  addToCart(id, qty);
};

// ===== CART PAGE =====
routes.cart = async (app) => {
  if (!state.user) { navigate('login'); return; }
  await loadCart();
  const { items, total, count } = state.cart;

  app.innerHTML = `
  <div class="cart-page">
    <h1 style="font-size:1.8rem;font-weight:700;margin-bottom:28px;">Shopping Cart ${count ? `<span style="font-size:1rem;color:var(--gray-2);font-weight:400">(${count} items)</span>` : ''}</h1>

    ${!items.length ? `
    <div class="empty-state">
      <div class="empty-icon">🛒</div>
      <h3>Your cart is empty</h3>
      <p>Looks like you haven't added anything yet.</p>
      <button class="btn btn-primary" onclick="navigate('products')">Start Shopping</button>
    </div>` : `
    <div class="cart-grid">
      <div class="cart-items-list">
        ${items.map(item => `
        <div class="cart-item">
          <div class="cart-item-img" onclick="navigate('product',{id:${item.product_id}})" style="cursor:pointer;">
            <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" onerror="this.src='https://via.placeholder.com/90'">
          </div>
          <div class="cart-item-info">
            <div class="cart-item-name" onclick="navigate('product',{id:${item.product_id}})" style="cursor:pointer;">${escapeHtml(item.name)}</div>
            <div class="cart-item-price">${formatPrice(item.price)} each</div>
            <div class="cart-item-controls">
              <div class="qty-mini">
                <button onclick="updateCartItem(${item.product_id}, ${item.quantity - 1})">−</button>
                <span>${item.quantity}</span>
                <button onclick="updateCartItem(${item.product_id}, ${item.quantity + 1})" ${item.quantity >= item.stock ? 'disabled' : ''}>+</button>
              </div>
              <button class="remove-btn" onclick="removeFromCart(${item.product_id})">Remove</button>
            </div>
          </div>
          <div class="cart-item-total">${formatPrice(item.price * item.quantity)}</div>
        </div>`).join('')}
      </div>

      <div class="cart-summary">
        <h3>Order Summary</h3>
        <div class="summary-row"><span>Subtotal (${count} items)</span><span>${formatPrice(total)}</span></div>
        <div class="summary-row"><span>Shipping</span><span style="color:var(--success);font-weight:600">Free</span></div>
        <div class="summary-row"><span>Tax (8%)</span><span>${formatPrice(total * 0.08)}</span></div>
        <div class="summary-row total"><span>Total</span><span>${formatPrice(total * 1.08)}</span></div>
        <button class="btn btn-primary btn-block btn-lg" style="margin-top:16px;" onclick="navigate('checkout')">Checkout →</button>
        <button class="btn btn-ghost btn-block" style="margin-top:8px;" onclick="navigate('products')">Continue Shopping</button>
      </div>
    </div>`}
  </div>`;
};

// ===== CHECKOUT =====
routes.checkout = async (app) => {
  if (!state.user) { navigate('login'); return; }
  if (!state.cart.items.length) { navigate('cart'); return; }

  const { items, total } = state.cart;
  const tax = total * 0.08;
  const grandTotal = total + tax;

  app.innerHTML = `
  <div class="page-medium">
    <h1 style="font-size:1.8rem;font-weight:700;margin-bottom:28px;">Checkout</h1>
    <div style="display:grid;grid-template-columns:1fr 300px;gap:24px;align-items:start;">
      <div>
        <div class="form-card" style="margin-bottom:16px;">
          <h3 style="margin-bottom:20px;font-weight:700;">Shipping Information</h3>
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" id="shipName" value="${escapeHtml(state.user.name)}" placeholder="John Doe">
          </div>
          <div class="form-group">
            <label>Street Address</label>
            <input type="text" id="shipAddress" value="${escapeHtml(state.user.address || '')}" placeholder="123 Main Street">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>City</label>
              <input type="text" id="shipCity" placeholder="New York">
            </div>
            <div class="form-group">
              <label>ZIP Code</label>
              <input type="text" id="shipZip" placeholder="10001">
            </div>
          </div>
        </div>

        <div class="form-card">
          <h3 style="margin-bottom:20px;font-weight:700;">Payment Method</h3>
          <div style="display:flex;flex-direction:column;gap:10px;">
            ${[['card', '💳 Credit / Debit Card'], ['paypal', '🅿️ PayPal'], ['cod', '💵 Cash on Delivery']].map(([val, label]) => `
            <label style="display:flex;align-items:center;gap:12px;padding:14px;border:1.5px solid var(--gray-4);border-radius:10px;cursor:pointer;transition:border-color .2s;" onclick="this.parentElement.querySelectorAll('label').forEach(l=>l.style.borderColor='var(--gray-4)');this.style.borderColor='var(--primary)'">
              <input type="radio" name="payment" value="${val}" ${val === 'card' ? 'checked' : ''} style="accent-color:var(--primary)">
              <span style="font-weight:500">${label}</span>
            </label>`).join('')}
          </div>
        </div>
      </div>

      <div class="cart-summary" style="position:sticky;top:80px;">
        <h3>Order Summary</h3>
        ${items.map(i => `
        <div style="display:flex;justify-content:space-between;font-size:.85rem;margin-bottom:8px;">
          <span style="color:var(--gray-1)">${escapeHtml(i.name)} ×${i.quantity}</span>
          <span style="font-weight:600">${formatPrice(i.price * i.quantity)}</span>
        </div>`).join('')}
        <div class="summary-row" style="margin-top:12px;"><span>Shipping</span><span style="color:var(--success);font-weight:600">Free</span></div>
        <div class="summary-row"><span>Tax</span><span>${formatPrice(tax)}</span></div>
        <div class="summary-row total"><span>Total</span><span>${formatPrice(grandTotal)}</span></div>
        <button class="btn btn-success btn-block btn-lg" style="margin-top:16px;" onclick="placeOrder()">✓ Place Order</button>
      </div>
    </div>
  </div>`;
};

window.placeOrder = async function () {
  const name = document.getElementById('shipName')?.value.trim();
  const address = document.getElementById('shipAddress')?.value.trim();
  const city = document.getElementById('shipCity')?.value.trim();
  const zip = document.getElementById('shipZip')?.value.trim();
  const payment = document.querySelector('[name="payment"]:checked')?.value || 'card';

  if (!name || !address || !city || !zip) { toast('Please fill all shipping fields', 'error'); return; }

  const btn = document.querySelector('[onclick="placeOrder()"]');
  btn.disabled = true;
  btn.textContent = 'Processing…';

  try {
    const { orderId } = await api('POST', '/orders/place', {
      shipping_name: name, shipping_address: address,
      shipping_city: city, shipping_zip: zip, payment_method: payment
    });
    await loadCart();
    navigate('orderSuccess', { orderId });
  } catch (e) {
    toast(e.message, 'error');
    btn.disabled = false;
    btn.innerHTML = '✓ Place Order';
  }
};

// ===== ORDER SUCCESS =====
routes.orderSuccess = (app, { orderId }) => {
  app.innerHTML = `
  <div class="page-narrow" style="text-align:center;">
    <div style="font-size:4rem;margin-bottom:20px;">🎉</div>
    <h1 style="font-size:2rem;font-weight:700;margin-bottom:12px;">Order Placed!</h1>
    <p style="color:var(--gray-2);margin-bottom:8px;">Thank you for your purchase. Your order <strong>#${orderId}</strong> has been confirmed.</p>
    <p style="color:var(--gray-2);margin-bottom:32px;">You'll receive updates on your delivery status.</p>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
      <button class="btn btn-primary" onclick="navigate('orders')">View My Orders</button>
      <button class="btn btn-ghost" onclick="navigate('products')">Continue Shopping</button>
    </div>
  </div>`;
};

// ===== ORDERS =====
routes.orders = async (app) => {
  if (!state.user) { navigate('login'); return; }
  app.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;
  try {
    const { orders } = await api('GET', '/orders/my');
    app.innerHTML = `
    <div class="container" style="padding-top:40px;padding-bottom:60px;">
      <h1 style="font-size:1.8rem;font-weight:700;margin-bottom:28px;">My Orders</h1>
      ${!orders.length ? `
      <div class="empty-state">
        <div class="empty-icon">📦</div>
        <h3>No orders yet</h3>
        <p>Your orders will appear here after you purchase.</p>
        <button class="btn btn-primary" onclick="navigate('products')">Start Shopping</button>
      </div>` : orders.map(o => `
      <div class="order-card" onclick="navigate('orderDetail',{id:${o.id}})" style="cursor:pointer;">
        <div class="order-header">
          <div>
            <div class="order-id">Order #${o.id}</div>
            <div class="order-date">${formatDate(o.created_at)} · ${o.item_count} item${o.item_count !== 1 ? 's' : ''}</div>
          </div>
          <div style="display:flex;align-items:center;gap:16px;">
            ${statusBadge(o.status)}
            <div class="order-total">${formatPrice(o.total)}</div>
          </div>
        </div>
      </div>`).join('')}
    </div>`;
  } catch (e) {
    app.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Error loading orders</h3><p>${e.message}</p></div>`;
  }
};

// ===== ORDER DETAIL =====
routes.orderDetail = async (app, { id }) => {
  if (!state.user) { navigate('login'); return; }
  app.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;
  try {
    const { order: o, items } = await api('GET', `/orders/${id}`);
    app.innerHTML = `
    <div class="container" style="padding-top:40px;padding-bottom:60px;max-width:760px;">
      <button class="back-btn" onclick="navigate('orders')">← Back to Orders</button>
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:28px;">
        <h1 style="font-size:1.6rem;font-weight:700;">Order #${o.id}</h1>
        ${statusBadge(o.status)}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;">
        <div class="form-card" style="padding:20px;">
          <h4 style="font-weight:700;margin-bottom:10px;">Shipping Address</h4>
          <p style="font-size:.9rem;color:var(--gray-2);line-height:1.8;">${escapeHtml(o.shipping_name)}<br>${escapeHtml(o.shipping_address)}<br>${escapeHtml(o.shipping_city)}, ${escapeHtml(o.shipping_zip)}</p>
        </div>
        <div class="form-card" style="padding:20px;">
          <h4 style="font-weight:700;margin-bottom:10px;">Order Info</h4>
          <p style="font-size:.9rem;color:var(--gray-2);line-height:1.8;">Placed: ${formatDate(o.created_at)}<br>Payment: ${o.payment_method?.toUpperCase()}<br>Status: ${o.status}</p>
        </div>
      </div>
      <div class="admin-table-wrap" style="margin-bottom:16px;">
        <table class="admin-table">
          <thead><tr><th>Product</th><th>Price</th><th>Qty</th><th>Total</th></tr></thead>
          <tbody>
            ${items.map(i => `
            <tr>
              <td><div style="display:flex;align-items:center;gap:12px;"><img src="${escapeHtml(i.image)}" class="table-img" onerror="this.src='https://via.placeholder.com/48'"><span style="font-weight:500">${escapeHtml(i.name)}</span></div></td>
              <td>${formatPrice(i.price)}</td>
              <td>${i.quantity}</td>
              <td style="font-weight:700">${formatPrice(i.price * i.quantity)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div style="text-align:right;font-size:1.1rem;font-weight:700;">Total: ${formatPrice(o.total)}</div>
    </div>`;
  } catch (e) {
    app.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Order not found</h3><button class="btn btn-primary mt-16" onclick="navigate('orders')">My Orders</button></div>`;
  }
};

// ===== LOGIN =====
routes.login = (app) => {
  if (state.user) { navigate('home'); return; }
  app.innerHTML = `
  <div class="page-narrow">
    <div class="form-card">
      <div class="form-header">
        <div style="font-size:2rem;margin-bottom:8px;">⬡</div>
        <h2>Welcome Back</h2>
        <p>Sign in to your ShopNest account</p>
      </div>
      <div class="form-group"><label>Email Address</label><input type="email" id="loginEmail" placeholder="you@example.com"></div>
      <div class="form-group"><label>Password</label><input type="password" id="loginPassword" placeholder="••••••••" onkeypress="if(event.key==='Enter')doLogin()"></div>
      <div id="loginError" style="color:var(--danger);font-size:.85rem;margin-bottom:12px;display:none;"></div>
      <button class="btn btn-primary btn-block btn-lg" onclick="doLogin()" id="loginBtn">Sign In</button>
      <div class="form-footer" style="margin-top:16px;">Don't have an account? <a href="#" onclick="navigate('register')">Create one</a></div>
      <div class="form-divider">Demo credentials</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <button class="btn btn-ghost btn-sm" onclick="fillLogin('naimul@gmail.com','Naimul0123#')">👤 User Demo</button>
        <button class="btn btn-ghost btn-sm" onclick="fillLogin('admin@store.com','admin123')">☠️ Admin Demo</button>
      </div>
    </div>
  </div>`;
};

window.fillLogin = (e, p) => {
  document.getElementById('loginEmail').value = e;
  document.getElementById('loginPassword').value = p;
};
window.doLogin = async function () {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  const btn = document.getElementById('loginBtn');
  errEl.style.display = 'none';
  btn.disabled = true; btn.textContent = 'Signing in…';
  try {
    const { user } = await api('POST', '/auth/login', { email, password });
    state.user = user;
    updateHeaderAuth();
    await loadCart();
    toast(`Welcome back, ${user.name}!`, 'success');
    navigate('home');
  } catch (e) {
    errEl.textContent = e.message;
    errEl.style.display = 'block';
    btn.disabled = false; btn.textContent = 'Sign In';
  }
};

// ===== REGISTER =====
routes.register = (app) => {
  if (state.user) { navigate('home'); return; }
  app.innerHTML = `
  <div class="page-narrow">
    <div class="form-card">
      <div class="form-header"><div style="font-size:2rem;margin-bottom:8px;">⬡</div><h2>Create Account</h2><p>Join ShopNest today</p></div>
      <div class="form-group"><label>Full Name</label><input type="text" id="regName" placeholder="John Doe"></div>
      <div class="form-group"><label>Email Address</label><input type="email" id="regEmail" placeholder="you@example.com"></div>
      <div class="form-group"><label>Password</label><input type="password" id="regPassword" placeholder="At least 6 characters"></div>
      <div class="form-group"><label>Confirm Password</label><input type="password" id="regConfirm" placeholder="Repeat password" onkeypress="if(event.key==='Enter')doRegister()"></div>
      <div id="regError" style="color:var(--danger);font-size:.85rem;margin-bottom:12px;display:none;"></div>
      <button class="btn btn-primary btn-block btn-lg" onclick="doRegister()" id="regBtn">Create Account</button>
      <div class="form-footer" style="margin-top:16px;">Already have an account? <a href="#" onclick="navigate('login')">Sign in</a></div>
    </div>
  </div>`;
};

window.doRegister = async function () {
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const confirm = document.getElementById('regConfirm').value;
  const errEl = document.getElementById('regError');
  errEl.style.display = 'none';

  if (!name || !email || !password) { errEl.textContent = 'All fields required'; errEl.style.display = 'block'; return; }
  if (password !== confirm) { errEl.textContent = 'Passwords do not match'; errEl.style.display = 'block'; return; }

  const btn = document.getElementById('regBtn');
  btn.disabled = true; btn.textContent = 'Creating account…';
  try {
    const { user } = await api('POST', '/auth/register', { name, email, password });
    state.user = user;
    updateHeaderAuth();
    toast(`Welcome, ${user.name}!`, 'success');
    navigate('home');
  } catch (e) {
    errEl.textContent = e.message;
    errEl.style.display = 'block';
    btn.disabled = false; btn.textContent = 'Create Account';
  }
};

// ===== PROFILE =====
routes.profile = async (app) => {
  if (!state.user) { navigate('login'); return; }
  const { user } = await api('GET', '/auth/me');

  app.innerHTML = `
  <div class="page-narrow">
    <div class="form-card">
      <div class="form-header"><h2>My Profile</h2><p>Update your personal info</p></div>
      <div class="form-group"><label>Full Name</label><input type="text" id="profName" value="${escapeHtml(user.name)}"></div>
      <div class="form-group"><label>Email</label><input type="email" value="${escapeHtml(user.email)}" disabled style="opacity:.6"></div>
      <div class="form-group"><label>Phone</label><input type="text" id="profPhone" value="${escapeHtml(user.phone || '')}" placeholder="+1 555 000 0000"></div>
      <div class="form-group"><label>Address</label><textarea id="profAddress" placeholder="123 Main St, City, State">${escapeHtml(user.address || '')}</textarea></div>
      <div id="profMsg" style="display:none;margin-bottom:12px;"></div>
      <button class="btn btn-primary btn-block" onclick="saveProfile()">Save Changes</button>
      <div style="margin-top:16px;text-align:center;"><button class="btn btn-ghost btn-sm" onclick="navigate('orders')">📦 View My Orders</button></div>
    </div>
  </div>`;
};

window.saveProfile = async function () {
  const msgEl = document.getElementById('profMsg');
  try {
    await api('PUT', '/auth/profile', {
      name: document.getElementById('profName').value.trim(),
      address: document.getElementById('profAddress').value.trim(),
      phone: document.getElementById('profPhone').value.trim()
    });
    await loadUser();
    msgEl.textContent = '✓ Profile updated successfully';
    msgEl.style.cssText = 'display:block;color:var(--success);font-size:.875rem;';
    setTimeout(() => msgEl.style.display = 'none', 3000);
  } catch (e) {
    msgEl.textContent = e.message;
    msgEl.style.cssText = 'display:block;color:var(--danger);font-size:.875rem;';
  }
};

routes.about = (app) => {
  app.innerHTML = `
  <section class="page-banner"><h1>About ShopNest</h1><p>Quality products, exceptional experience.</p></section>
  <div class="container" style="padding:60px 24px;max-width:800px;">
    <div style="text-align:center;margin-bottom:48px;">
      <p style="font-size:1.1rem;color:var(--gray-2);line-height:1.8;">ShopNest is a modern e-commerce platform built to deliver the best online shopping experience. We offer a curated selection of quality products across electronics, fashion, home goods, sports, and more.</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;text-align:center;">
      ${[['10K+', 'Happy Customers'], ['150+', 'Products'], ['99%', 'Satisfaction Rate']].map(([n, l]) => `
      <div style="background:white;border:1px solid var(--gray-5);border-radius:16px;padding:28px;">
        <div style="font-size:2rem;font-weight:800;color:var(--primary);margin-bottom:6px;">${n}</div>
        <div style="color:var(--gray-2);font-size:.9rem;">${l}</div>
      </div>`).join('')}
    </div>
  </div>`;
};
