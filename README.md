# E-Commerce Site

A full-stack e-commerce application with product listings, shopping cart, user authentication, and order processing.

## Project Structure

```
ecommerce/
├── frontend/                 # Frontend (HTML, CSS, JavaScript)
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── main.js
│   │   ├── cart.js
│   │   └── api.js
│   ├── pages/
│   │   ├── products.html
│   │   ├── product-detail.html
│   │   ├── cart.html
│   │   ├── checkout.html
│   │   ├── login.html
│   │   └── register.html
│   └── assets/
│
├── backend/                  # Backend (Django/Express)
│   ├── api/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── controllers/
│   └── config/
│
├── database/                 # Database schemas and migrations
│   ├── schema.sql
│   └── migrations/
│
├── docs/                     # Documentation
│   ├── API.md
│   ├── DATABASE.md
│   └── SETUP.md
│
└── .gitignore
```

## Features

- ✅ Product Listings
- ✅ Product Details Page
- ✅ Shopping Cart
- ✅ User Registration & Login
- ✅ Order Processing
- ✅ Database for Products, Users, and Orders

## Tech Stack

**Frontend:**
- HTML5
- CSS3
- JavaScript (ES6+)

**Backend:**
- Django (Python) or Express.js (Node.js)
- RESTful API

**Database:**
- MySQL/PostgreSQL

## Getting Started

See [SETUP.md](docs/SETUP.md) for detailed installation instructions.

## API Documentation

See [API.md](docs/API.md) for API endpoints and usage.

## Database Schema

See [DATABASE.md](docs/DATABASE.md) for database structure.
