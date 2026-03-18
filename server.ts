import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@libsql/client';
import cloudinary from 'cloudinary';
import Pusher from 'pusher';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Turso DB
const db = createClient({
  url: 'libsql://casagaming1-casagaming.aws-eu-west-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzM4NDMwNTUsImlkIjoiMDE5Y2ZmNjQtODQwMS03OTE4LTkwYWMtYzg0NDVjMmU5YTJhIiwicmlkIjoiNmY0ZmRlMDYtMmYwYy00YzcyLTkxY2EtOGVmNDFjMGIxMDllIn0.EweA6uglQr4xeH5cXXbM6Jdlb9m8EMWzaRKMRbpQxOttCLaFI0Gn_2MurLDO-yo1e8eS_vavGGZcnn30oQqUDg'
});

// Initialize Cloudinary
cloudinary.v2.config({
  cloud_name: 'ddsikz7wq',
  api_key: '728859884445323',
  api_secret: 'qJBcAxrhV_loi85MYP8OK_F_IcY'
});

// Initialize Pusher
const pusher = new Pusher({
  appId: "2129205",
  key: "6f398ffd3b06e741d29f",
  secret: "f4926e3de762bd1f28fe",
  cluster: "eu",
  useTLS: true
});

const upload = multer({ storage: multer.memoryStorage() });

async function initializeDB() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name_ar TEXT,
        name_en TEXT,
        slug TEXT,
        image_url TEXT,
        created_at DATETIME
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name_ar TEXT,
        name_en TEXT,
        description_ar TEXT,
        description_en TEXT,
        price REAL,
        original_price REAL,
        image_url TEXT,
        category_id INTEGER,
        stock INTEGER,
        is_featured BOOLEAN,
        is_new BOOLEAN,
        is_sale BOOLEAN,
        rating REAL,
        reviews_count INTEGER
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS product_variants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        name_ar TEXT,
        name_en TEXT,
        image_url TEXT,
        stock INTEGER
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT,
        phone TEXT,
        wilaya TEXT,
        commune TEXT,
        address TEXT,
        total_price REAL,
        shipping_price REAL,
        status TEXT,
        created_at DATETIME
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        product_id INTEGER,
        variant_id INTEGER,
        quantity INTEGER,
        price REAL
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS shipping_rates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wilaya_name_ar TEXT,
        wilaya_name_en TEXT,
        wilaya_id INTEGER,
        home_delivery_price REAL,
        desk_delivery_price REAL,
        return_price REAL,
        delivery_time TEXT
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS store_config (
        name TEXT,
        logo TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        facebook TEXT,
        instagram TEXT,
        whatsapp TEXT
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS banners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        image_url TEXT,
        title TEXT,
        link_url TEXT,
        order_index INTEGER,
        is_active BOOLEAN
      )
    `);
    
    // Seed shipping rates if empty
    const ratesCount = await db.execute('SELECT COUNT(*) as count FROM shipping_rates');
    if (ratesCount.rows[0].count === 0) {
      const wilayas = [
        { id: 16, ar: 'الجزائر', en: 'Algiers' },
        { id: 31, ar: 'وهران', en: 'Oran' },
        { id: 25, ar: 'قسنطينة', en: 'Constantine' }
      ];
      for (const w of wilayas) {
        await db.execute({
          sql: 'INSERT INTO shipping_rates (wilaya_name_ar, wilaya_name_en, wilaya_id, home_delivery_price, desk_delivery_price, return_price, delivery_time) VALUES (?, ?, ?, 400, 300, 200, "24-48 ساعة")',
          args: [w.ar, w.en, w.id]
        });
      }
    }
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}

async function startServer() {
  await initializeDB();
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  
  // Stats
  app.get('/api/stats', async (req, res) => {
    try {
      const ordersCount = await db.execute('SELECT COUNT(*) as count FROM orders');
      const revenue = await db.execute('SELECT SUM(total_price) as total FROM orders WHERE status != "ملغى"');
      const productsCount = await db.execute('SELECT COUNT(*) as count FROM products');
      const categoriesCount = await db.execute('SELECT COUNT(*) as count FROM categories');
      
      const recentOrders = await db.execute('SELECT * FROM orders ORDER BY created_at DESC LIMIT 5');

      res.json({
        totalOrders: ordersCount.rows[0].count,
        totalRevenue: revenue.rows[0].total || 0,
        totalProducts: productsCount.rows[0].count,
        totalCategories: categoriesCount.rows[0].count,
        recentOrders: recentOrders.rows
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  // Categories
  app.get('/api/categories', async (req, res) => {
    try {
      const result = await db.execute('SELECT * FROM categories ORDER BY id DESC');
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  });

  app.post('/api/categories', async (req, res) => {
    const { name_ar, name_en, slug, image_url } = req.body;
    try {
      const result = await db.execute({
        sql: 'INSERT INTO categories (name_ar, name_en, slug, image_url, created_at) VALUES (?, ?, ?, ?, datetime("now")) RETURNING *',
        args: [name_ar, name_en, slug, image_url]
      });
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create category' });
    }
  });

  app.put('/api/categories/:id', async (req, res) => {
    const { name_ar, name_en, slug, image_url } = req.body;
    try {
      await db.execute({
        sql: 'UPDATE categories SET name_ar = ?, name_en = ?, slug = ?, image_url = ? WHERE id = ?',
        args: [name_ar, name_en, slug, image_url, req.params.id]
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update category' });
    }
  });

  app.delete('/api/categories/:id', async (req, res) => {
    try {
      await db.execute({
        sql: 'DELETE FROM categories WHERE id = ?',
        args: [req.params.id]
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete category' });
    }
  });

  // Products
  app.get('/api/products', async (req, res) => {
    try {
      const result = await db.execute('SELECT * FROM products ORDER BY id DESC');
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  app.post('/api/products', async (req, res) => {
    const { name_ar, name_en, description_ar, description_en, price, original_price, image_url, category_id, stock, is_featured, is_new, is_sale } = req.body;
    try {
      const result = await db.execute({
        sql: 'INSERT INTO products (name_ar, name_en, description_ar, description_en, price, original_price, image_url, category_id, stock, is_featured, is_new, is_sale, rating, reviews_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0) RETURNING *',
        args: [name_ar, name_en, description_ar, description_en, price, original_price, JSON.stringify(image_url), category_id, stock, is_featured ? 1 : 0, is_new ? 1 : 0, is_sale ? 1 : 0]
      });
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create product' });
    }
  });

  app.put('/api/products/:id', async (req, res) => {
    const { name_ar, name_en, description_ar, description_en, price, original_price, image_url, category_id, stock, is_featured, is_new, is_sale } = req.body;
    try {
      await db.execute({
        sql: 'UPDATE products SET name_ar = ?, name_en = ?, description_ar = ?, description_en = ?, price = ?, original_price = ?, image_url = ?, category_id = ?, stock = ?, is_featured = ?, is_new = ?, is_sale = ? WHERE id = ?',
        args: [name_ar, name_en, description_ar, description_en, price, original_price, JSON.stringify(image_url), category_id, stock, is_featured ? 1 : 0, is_new ? 1 : 0, is_sale ? 1 : 0, req.params.id]
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update product' });
    }
  });

  app.delete('/api/products/:id', async (req, res) => {
    try {
      await db.execute({
        sql: 'DELETE FROM products WHERE id = ?',
        args: [req.params.id]
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete product' });
    }
  });

  // Orders
  app.get('/api/orders', async (req, res) => {
    try {
      const result = await db.execute('SELECT * FROM orders ORDER BY created_at DESC');
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  });

  app.get('/api/orders/:id', async (req, res) => {
    try {
      const order = await db.execute({
        sql: 'SELECT * FROM orders WHERE id = ?',
        args: [req.params.id]
      });
      if (order.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
      
      const items = await db.execute({
        sql: 'SELECT oi.*, p.name_ar as product_name, pv.name_ar as variant_name FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id LEFT JOIN product_variants pv ON oi.variant_id = pv.id WHERE oi.order_id = ?',
        args: [req.params.id]
      });
      
      res.json({ ...order.rows[0], items: items.rows });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch order details' });
    }
  });

  app.patch('/api/orders/:id/status', async (req, res) => {
    const { status } = req.body;
    try {
      await db.execute({
        sql: 'UPDATE orders SET status = ? WHERE id = ?',
        args: [status, req.params.id]
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update order status' });
    }
  });

  app.post('/api/orders', async (req, res) => {
    // This would typically be called from the storefront, not the admin panel
    // but we include it to trigger Pusher for testing
    const { customer_name, phone, wilaya, commune, address, total_price, shipping_price, items } = req.body;
    try {
      const result = await db.execute({
        sql: 'INSERT INTO orders (customer_name, phone, wilaya, commune, address, total_price, shipping_price, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, "قيد الانتظار", datetime("now")) RETURNING id',
        args: [customer_name, phone, wilaya, commune, address, total_price, shipping_price]
      });
      
      const orderId = result.rows[0].id;
      
      for (const item of items) {
        await db.execute({
          sql: 'INSERT INTO order_items (order_id, product_id, variant_id, quantity, price) VALUES (?, ?, ?, ?, ?)',
          args: [orderId, item.product_id, item.variant_id, item.quantity, item.price]
        });
      }
      
      // Trigger Pusher notification
      pusher.trigger('orders-channel', 'new-order', {
        id: orderId,
        customer_name,
        total_price: total_price + shipping_price
      });
      
      res.json({ id: orderId });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create order' });
    }
  });

  // Shipping Rates
  app.get('/api/shipping-rates', async (req, res) => {
    try {
      const result = await db.execute('SELECT * FROM shipping_rates ORDER BY wilaya_id ASC');
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch shipping rates' });
    }
  });

  app.put('/api/shipping-rates/:id', async (req, res) => {
    const { home_delivery_price, desk_delivery_price, return_price, delivery_time } = req.body;
    try {
      await db.execute({
        sql: 'UPDATE shipping_rates SET home_delivery_price = ?, desk_delivery_price = ?, return_price = ?, delivery_time = ? WHERE id = ?',
        args: [home_delivery_price, desk_delivery_price, return_price, delivery_time, req.params.id]
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update shipping rate' });
    }
  });

  // Store Config
  app.get('/api/store-config', async (req, res) => {
    try {
      const result = await db.execute('SELECT * FROM store_config LIMIT 1');
      res.json(result.rows[0] || {});
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch store config' });
    }
  });

  app.put('/api/store-config', async (req, res) => {
    const { name, logo, phone, email, address, facebook, instagram, whatsapp } = req.body;
    try {
      const existing = await db.execute('SELECT COUNT(*) as count FROM store_config');
      if (Number(existing.rows[0].count) > 0) {
        await db.execute({
          sql: 'UPDATE store_config SET name = ?, logo = ?, phone = ?, email = ?, address = ?, facebook = ?, instagram = ?, whatsapp = ?',
          args: [name, logo, phone, email, address, facebook, instagram, whatsapp]
        });
      } else {
        await db.execute({
          sql: 'INSERT INTO store_config (name, logo, phone, email, address, facebook, instagram, whatsapp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          args: [name, logo, phone, email, address, facebook, instagram, whatsapp]
        });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update store config' });
    }
  });

  // Banners
  app.get('/api/banners', async (req, res) => {
    try {
      const result = await db.execute('SELECT * FROM banners ORDER BY order_index ASC');
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch banners' });
    }
  });

  app.post('/api/banners', async (req, res) => {
    const { image_url, title, link_url, order_index, is_active } = req.body;
    try {
      const result = await db.execute({
        sql: 'INSERT INTO banners (image_url, title, link_url, order_index, is_active) VALUES (?, ?, ?, ?, ?) RETURNING *',
        args: [image_url, title, link_url, order_index, is_active ? 1 : 0]
      });
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create banner' });
    }
  });

  app.put('/api/banners/:id', async (req, res) => {
    const { image_url, title, link_url, order_index, is_active } = req.body;
    try {
      await db.execute({
        sql: 'UPDATE banners SET image_url = ?, title = ?, link_url = ?, order_index = ?, is_active = ? WHERE id = ?',
        args: [image_url, title, link_url, order_index, is_active ? 1 : 0, req.params.id]
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update banner' });
    }
  });

  app.delete('/api/banners/:id', async (req, res) => {
    try {
      await db.execute({
        sql: 'DELETE FROM banners WHERE id = ?',
        args: [req.params.id]
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete banner' });
    }
  });

  // Upload Image
  app.post('/api/upload', upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image provided' });
      }
      
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
      
      const result = await cloudinary.v2.uploader.upload(dataURI, {
        folder: 'casagaming'
      });
      
      res.json({ url: result.secure_url, public_id: result.public_id });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Failed to upload image' });
    }
  });

  app.post('/api/delete-image', async (req, res) => {
    const { public_id } = req.body;
    try {
      if (public_id) {
        await cloudinary.v2.uploader.destroy(public_id);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete image' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
