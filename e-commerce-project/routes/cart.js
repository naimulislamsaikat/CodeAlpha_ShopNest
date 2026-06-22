const express = require('express');
const { getDB } = require('../database');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

// Get cart
router.get('/', requireAuth, (req, res) => {
  const db = getDB();
  const items = db.prepare(`
    SELECT ci.id, ci.quantity, p.id as product_id, p.name, p.price, p.image, p.stock
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.user_id = ?
  `).all(req.session.userId);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  res.json({ items, total, count: items.reduce((s, i) => s + i.quantity, 0) });
});

// Add to cart
router.post('/add', requireAuth, (req, res) => {
  const { product_id, quantity = 1 } = req.body;
  const db = getDB();

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  if (product.stock < quantity) return res.status(400).json({ error: 'Not enough stock' });

  db.prepare(`
    INSERT INTO cart_items (user_id, product_id, quantity)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id, product_id) DO UPDATE SET quantity = quantity + ?
  `).run(req.session.userId, product_id, quantity, quantity);

  res.json({ success: true, message: 'Added to cart' });
});

// Update quantity
router.put('/update', requireAuth, (req, res) => {
  const { product_id, quantity } = req.body;
  const db = getDB();

  if (quantity <= 0) {
    db.prepare('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?').run(req.session.userId, product_id);
  } else {
    db.prepare('UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?').run(quantity, req.session.userId, product_id);
  }

  res.json({ success: true });
});

// Remove from cart
router.delete('/remove/:product_id', requireAuth, (req, res) => {
  const db = getDB();
  db.prepare('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?').run(req.session.userId, req.params.product_id);
  res.json({ success: true });
});

// Clear cart
router.delete('/clear', requireAuth, (req, res) => {
  const db = getDB();
  db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.session.userId);
  res.json({ success: true });
});

module.exports = router;
