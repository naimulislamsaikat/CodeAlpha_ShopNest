const express = require('express');
const { getDB } = require('../database');
const router = express.Router();

// Get all products with filters
router.get('/', (req, res) => {
  const db = getDB();
  const { category, search, sort, featured, limit, offset } = req.query;

  let query = `
    SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (category) {
    query += ' AND c.slug = ?';
    params.push(category);
  }
  if (search) {
    query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (featured === '1') {
    query += ' AND p.featured = 1';
  }

  const sortMap = {
    'price-asc': 'p.price ASC',
    'price-desc': 'p.price DESC',
    'rating': 'p.rating DESC',
    'newest': 'p.created_at DESC',
    'popular': 'p.review_count DESC'
  };
  query += ` ORDER BY ${sortMap[sort] || 'p.featured DESC, p.created_at DESC'}`;

  const lim = parseInt(limit) || 20;
  const off = parseInt(offset) || 0;
  query += ` LIMIT ? OFFSET ?`;
  params.push(lim, off);

  const products = db.prepare(query).all(...params);

  // Get total count
  let countQuery = `SELECT COUNT(*) as total FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1`;
  const countParams = [];
  if (category) { countQuery += ' AND c.slug = ?'; countParams.push(category); }
  if (search) { countQuery += ' AND (p.name LIKE ? OR p.description LIKE ?)'; countParams.push(`%${search}%`, `%${search}%`); }
  if (featured === '1') { countQuery += ' AND p.featured = 1'; }

  const { total } = db.prepare(countQuery).get(...countParams);

  res.json({ products, total, limit: lim, offset: off });
});

// Get categories
router.get('/categories', (req, res) => {
  const db = getDB();
  const categories = db.prepare(`
    SELECT c.*, COUNT(p.id) as product_count 
    FROM categories c 
    LEFT JOIN products p ON p.category_id = c.id 
    GROUP BY c.id
  `).all();
  res.json({ categories });
});

// Get single product
router.get('/:id', (req, res) => {
  const db = getDB();
  const product = db.prepare(`
    SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?
  `).get(req.params.id);

  if (!product) return res.status(404).json({ error: 'Product not found' });

  // Related products
  const related = db.prepare(`
    SELECT * FROM products WHERE category_id = ? AND id != ? LIMIT 4
  `).all(product.category_id, product.id);

  res.json({ product, related });
});

module.exports = router;
