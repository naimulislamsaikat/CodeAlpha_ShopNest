const express = require('express');
const { getDB } = require('../database');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

// Place order
router.post('/place', requireAuth, (req, res) => {
  const { shipping_name, shipping_address, shipping_city, shipping_zip, payment_method } = req.body;

  if (!shipping_name || !shipping_address || !shipping_city || !shipping_zip) {
    return res.status(400).json({ error: 'All shipping fields are required' });
  }

  const db = getDB();

  // Get cart items
  const cartItems = db.prepare(`
    SELECT ci.quantity, p.id as product_id, p.name, p.price, p.stock
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.user_id = ?
  `).all(req.session.userId);

  if (cartItems.length === 0) return res.status(400).json({ error: 'Cart is empty' });

  // Check stock
  for (const item of cartItems) {
    if (item.stock < item.quantity) {
      return res.status(400).json({ error: `"${item.name}" has insufficient stock` });
    }
  }

  const total = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);

  // Create order in transaction
  const placeOrder = db.transaction(() => {
    const order = db.prepare(`
      INSERT INTO orders (user_id, total, shipping_name, shipping_address, shipping_city, shipping_zip, payment_method)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(req.session.userId, total, shipping_name, shipping_address, shipping_city, shipping_zip, payment_method || 'card');

    const orderId = order.lastInsertRowid;

    const itemStmt = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)');
    const stockStmt = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');

    for (const item of cartItems) {
      itemStmt.run(orderId, item.product_id, item.quantity, item.price);
      stockStmt.run(item.quantity, item.product_id);
    }

    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.session.userId);

    return orderId;
  });

  const orderId = placeOrder();
  res.json({ success: true, orderId, message: 'Order placed successfully!' });
});

// Get user orders
router.get('/my', requireAuth, (req, res) => {
  const db = getDB();
  const orders = db.prepare(`
    SELECT o.*, 
      (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
    FROM orders o
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC
  `).all(req.session.userId);

  res.json({ orders });
});

// Get single order
router.get('/:id', requireAuth, (req, res) => {
  const db = getDB();
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.session.userId);

  if (!order) return res.status(404).json({ error: 'Order not found' });

  const items = db.prepare(`
    SELECT oi.*, p.name, p.image
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
  `).all(order.id);

  res.json({ order, items });
});

module.exports = router;
