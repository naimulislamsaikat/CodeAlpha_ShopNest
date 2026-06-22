const express = require('express');
const { getDB } = require('../database');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();

// Dashboard stats
router.get('/stats', requireAdmin, (req, res) => {
  const db = getDB();

  const totalOrders = db.prepare("SELECT COUNT(*) as c FROM orders").get().c;
  const totalRevenue = db.prepare("SELECT COALESCE(SUM(total), 0) as r FROM orders WHERE status != 'cancelled'").get().r;
  const totalUsers = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'user'").get().c;
  const totalProducts = db.prepare("SELECT COUNT(*) as c FROM products").get().c;
  const pendingOrders = db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'pending'").get().c;
  const recentOrders = db.prepare(`
    SELECT o.*, u.name as user_name, u.email as user_email
    FROM orders o JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC LIMIT 5
  `).all();

  res.json({ totalOrders, totalRevenue, totalUsers, totalProducts, pendingOrders, recentOrders });
});

// Get all orders
router.get('/orders', requireAdmin, (req, res) => {
  const db = getDB();
  const orders = db.prepare(`
    SELECT o.*, u.name as user_name, u.email as user_email
    FROM orders o JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
  `).all();
  res.json({ orders });
});

// Update order status
router.put('/orders/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const db = getDB();
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});

// Get all products (admin)
router.get('/products', requireAdmin, (req, res) => {
  const db = getDB();
  const products = db.prepare(`
    SELECT p.*, c.name as category_name FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY p.created_at DESC
  `).all();
  res.json({ products });
});

// Create product
router.post('/products', requireAdmin, (req, res) => {
  const { name, description, price, original_price, stock, category_id, image, featured } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'Name and price required' });

  const db = getDB();
  const result = db.prepare(`
    INSERT INTO products (name, description, price, original_price, stock, category_id, image, featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, description, parseFloat(price), original_price ? parseFloat(original_price) : null, 
         parseInt(stock) || 0, category_id, image || '/images/placeholder.jpg', featured ? 1 : 0);

  res.json({ success: true, id: result.lastInsertRowid });
});

// Update product
router.put('/products/:id', requireAdmin, (req, res) => {
  const { name, description, price, original_price, stock, category_id, image, featured } = req.body;
  const db = getDB();
  db.prepare(`
    UPDATE products SET name=?, description=?, price=?, original_price=?, stock=?, 
    category_id=?, image=?, featured=? WHERE id=?
  `).run(name, description, parseFloat(price), original_price ? parseFloat(original_price) : null,
         parseInt(stock), category_id, image, featured ? 1 : 0, req.params.id);

  res.json({ success: true });
});

// Delete product
router.delete('/products/:id', requireAdmin, (req, res) => {
  const db = getDB();
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Get all users
router.get('/users', requireAdmin, (req, res) => {
  const db = getDB();
  const users = db.prepare('SELECT id, name, email, role, address, phone, created_at FROM users ORDER BY created_at DESC').all();
  res.json({ users });
});

// Update user (admin)
router.put('/users/:id', requireAdmin, (req, res) => {
  const { name, email, phone, address, role } = req.body;
  const validRoles = ['user', 'admin'];

  if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });
  if (role && !validRoles.includes(role)) return res.status(400).json({ error: 'Invalid role' });

  const db = getDB();

  // Check email uniqueness (exclude self)
  const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, req.params.id);
  if (existing) return res.status(400).json({ error: 'Email already in use by another account' });

  db.prepare(`
    UPDATE users SET name = ?, email = ?, phone = ?, address = ?, role = ? WHERE id = ?
  `).run(name, email, phone || null, address || null, role || 'user', req.params.id);

  res.json({ success: true });
});

// Delete user (admin)
router.delete('/users/:id', requireAdmin, (req, res) => {
  const db = getDB();
  // Prevent deleting own account
  if (parseInt(req.params.id) === req.session.userId) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
