const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'ecommerce.db');

let db;

function getDB() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDB() {
  const db = getDB();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      address TEXT,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      original_price REAL,
      stock INTEGER DEFAULT 0,
      category_id INTEGER REFERENCES categories(id),
      image TEXT DEFAULT '/images/placeholder.jpg',
      rating REAL DEFAULT 4.0,
      review_count INTEGER DEFAULT 0,
      featured INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      quantity INTEGER DEFAULT 1,
      UNIQUE(user_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      total REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      shipping_name TEXT,
      shipping_address TEXT,
      shipping_city TEXT,
      shipping_zip TEXT,
      payment_method TEXT DEFAULT 'card',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      quantity INTEGER NOT NULL,
      price REAL NOT NULL
    );
  `);

  // Seed data if empty
  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  if (userCount === 0) {
    seedData(db);
  }
}

function seedData(db) {
  // Admin user
  const adminHash = bcrypt.hashSync('admin123', 10);
  db.prepare(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`).run(
    'Admin', 'admin@store.com', adminHash, 'admin'
  );

  // Demo user
  const userHash = bcrypt.hashSync('user123', 10);
  db.prepare(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`).run(
    'Jane Smith', 'jane@example.com', userHash, 'user'
  );

  // Categories
  const categories = [
    { name: 'Electronics', slug: 'electronics' },
    { name: 'Clothing', slug: 'clothing' },
    { name: 'Home & Garden', slug: 'home-garden' },
    { name: 'Sports', slug: 'sports' },
    { name: 'Books', slug: 'books' },
  ];
  const catStmt = db.prepare(`INSERT INTO categories (name, slug) VALUES (?, ?)`);
  categories.forEach(c => catStmt.run(c.name, c.slug));

  // Products
  const products = [
    { name: 'Wireless Noise-Cancelling Headphones', description: 'Premium over-ear headphones with active noise cancellation, 30-hour battery life, and studio-quality sound. Perfect for music lovers and remote workers.', price: 149.99, original_price: 199.99, stock: 45, category_id: 1, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop', rating: 4.8, review_count: 234, featured: 1 },
    { name: 'Smart Watch Pro', description: 'Feature-packed smartwatch with health monitoring, GPS, always-on display, and 7-day battery. Compatible with iOS and Android.', price: 249.99, original_price: 299.99, stock: 30, category_id: 1, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop', rating: 4.6, review_count: 189, featured: 1 },
    { name: 'Mechanical Keyboard', description: 'TKL mechanical keyboard with Cherry MX switches, RGB backlight, and aluminum build. Tactile, responsive, and built to last.', price: 89.99, original_price: null, stock: 60, category_id: 1, image: 'https://images.unsplash.com/photo-1601445638532-3c6f6c3aa1d6?w=400&h=400&fit=crop', rating: 4.7, review_count: 312, featured: 0 },
    { name: '4K Webcam', description: 'Crystal clear 4K webcam with autofocus, built-in ring light, and noise-cancelling mic. Elevate your video calls.', price: 79.99, original_price: 99.99, stock: 25, category_id: 1, image: 'https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=400&h=400&fit=crop', rating: 4.4, review_count: 98, featured: 0 },
    { name: 'Classic Oxford Shirt', description: 'Premium 100% cotton Oxford shirt with a tailored fit. Available in multiple colors, perfect for work or casual wear.', price: 49.99, original_price: 69.99, stock: 120, category_id: 2, image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=400&fit=crop', rating: 4.3, review_count: 156, featured: 1 },
    { name: 'Running Sneakers', description: 'Lightweight and responsive running shoes with advanced cushioning technology. Designed for long-distance comfort.', price: 99.99, original_price: 129.99, stock: 85, category_id: 4, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop', rating: 4.5, review_count: 278, featured: 1 },
    { name: 'Yoga Mat Premium', description: 'Eco-friendly, non-slip yoga mat with alignment lines. 6mm thick for optimal joint support. Includes carrying strap.', price: 39.99, original_price: null, stock: 200, category_id: 4, image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400&h=400&fit=crop', rating: 4.6, review_count: 445, featured: 0 },
    { name: 'Coffee Maker Deluxe', description: 'Programmable 12-cup coffee maker with built-in grinder, thermal carafe, and smart brewing technology.', price: 129.99, original_price: 159.99, stock: 40, category_id: 3, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop', rating: 4.7, review_count: 203, featured: 1 },
    { name: 'Indoor Plant Set', description: 'Set of 3 low-maintenance indoor plants in ceramic pots. Perfect for home or office. Includes care guide.', price: 34.99, original_price: null, stock: 75, category_id: 3, image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop', rating: 4.4, review_count: 167, featured: 0 },
    { name: 'The Art of Clean Code', description: 'A practical guide to writing maintainable, readable, and elegant code. Essential for every software developer.', price: 29.99, original_price: 39.99, stock: 150, category_id: 5, image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=400&fit=crop', rating: 4.9, review_count: 891, featured: 0 },
    { name: 'Bluetooth Speaker', description: 'Portable waterproof speaker with 360° sound, 20-hour battery, and built-in powerbank. Ready for any adventure.', price: 59.99, original_price: 79.99, stock: 55, category_id: 1, image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop', rating: 4.5, review_count: 334, featured: 1 },
    { name: 'Denim Jacket', description: 'Classic stonewashed denim jacket with a modern slim fit. Durable, timeless, and effortlessly stylish.', price: 79.99, original_price: null, stock: 60, category_id: 2, image: 'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=400&h=400&fit=crop', rating: 4.2, review_count: 112, featured: 0 },
  ];

  const prodStmt = db.prepare(`
    INSERT INTO products (name, description, price, original_price, stock, category_id, image, rating, review_count, featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  products.forEach(p => prodStmt.run(p.name, p.description, p.price, p.original_price, p.stock, p.category_id, p.image, p.rating, p.review_count, p.featured));

  console.log('✅ Database seeded with demo data');
}

module.exports = { getDB, initDB };
