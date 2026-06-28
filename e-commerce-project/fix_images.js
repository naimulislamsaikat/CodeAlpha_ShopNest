const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'e-commerce-project', 'database.js'); // placeholder, actual DB path is e-commerce-project/ecommerce.db
const dbFile = path.join(__dirname, 'e-commerce-project', 'ecommerce.db');
const db = new Database(dbFile);

const placeholder = 'https://via.placeholder.com/400x400?text=Product';

const stmt = db.prepare("SELECT id, image FROM products WHERE image LIKE '%images.unsplash.com%' ");
const update = db.prepare('UPDATE products SET image = ? WHERE id = ?');

let count = 0;
for (const row of stmt.iterate()) {
  update.run(placeholder, row.id);
  count++;
}
console.log(`Replaced images for ${count} products.`);
