const express = require('express');
const bcrypt = require('bcryptjs');
const { getDB } = require('../database');
const router = express.Router();

// Register
router.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const db = getDB();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(400).json({ error: 'Email already registered' });

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)').run(name, email, hash);

  req.session.userId = result.lastInsertRowid;
  req.session.userName = name;
  req.session.role = 'user';

  res.json({ success: true, user: { id: result.lastInsertRowid, name, email, role: 'user' } });
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const db = getDB();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  req.session.userId = user.id;
  req.session.userName = user.name;
  req.session.role = user.role;

  res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Get current user
router.get('/me', (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  const db = getDB();
  const user = db.prepare('SELECT id, name, email, role, address, phone, created_at FROM users WHERE id = ?').get(req.session.userId);
  res.json({ user });
});

// Update profile
router.put('/profile', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
  const { name, address, phone } = req.body;
  const db = getDB();
  db.prepare('UPDATE users SET name = ?, address = ?, phone = ? WHERE id = ?')
    .run(name, address, phone, req.session.userId);
  req.session.userName = name;
  res.json({ success: true });
});

module.exports = router;
