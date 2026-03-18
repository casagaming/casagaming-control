import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { createClient } from '@libsql/client';
import Pusher from 'pusher';
import path from 'path';
import { randomUUID } from 'crypto';

cloudinary.config({
  cloud_name: 'ddsikz7wq',
  api_key: '728859884445323',
  api_secret: 'qJBcAxrhV_loi85MYP8OK_F_IcY',
});

const db = createClient({
  url: 'libsql://casagaming1-casagaming.aws-eu-west-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzM4MTY2MzUsImlkIjoiMDE5Y2ZmNjQtODQwMS03OTE4LTkwYWMtYzg0NDVjMmU5YTJhIiwicmlkIjoiNmY0ZmRlMDYtMmYwYy00YzcyLTkxY2EtOGVmNDFjMGIxMDllIn0.uI1magG-U9X1NVygJU0-jRincNwJhsvcvl5gBJZj3FsKARpFLFH0ORe4Vcbmz7Udhn1nmh9ePxFBT1QAHm3mDg',
});

const pusher = new Pusher({
  appId: '2129205',
  key: '6f398ffd3b06e741d29f',
  secret: 'f4926e3de762bd1f28fe',
  cluster: 'eu',
  useTLS: true,
});

const upload = multer({ storage: multer.memoryStorage() });

function parseJson(val: any): any {
  if (val === null || val === undefined) return null;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return val; }
  }
  return val;
}

function toArr(val: any): string[] {
  if (!val) return [];
  const parsed = parseJson(val);
  if (Array.isArray(parsed)) return parsed;
  return [];
}

function rowToObj(row: any): any {
  if (!row) return null;
  const obj: any = {};
  for (const key of Object.keys(row)) {
    obj[key] = row[key];
  }
  return obj;
}

function extractPublicId(url: string): string | null {
  if (!url || !url.includes('cloudinary.com')) return null;
  try {
    const parts = url.split('/');
    const uploadIndex = parts.findIndex(p => p === 'upload');
    if (uploadIndex === -1) return null;
    const pathParts = parts.slice(uploadIndex + 2);
    return pathParts.join('/').replace(/\.[^/.]+$/, '');
  } catch { return null; }
}

async function deleteCloudinaryImages(urls: (string | null | undefined)[]): Promise<void> {
  const ids = urls.map(u => u ? extractPublicId(u) : null).filter(Boolean) as string[];
  await Promise.allSettled(ids.map(id => cloudinary.uploader.destroy(id)));
}

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // ─── Image Upload ─────────────────────────────────────────────────────
  app.post('/api/upload', (req, res, next) => {
    upload.single('image')(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message });
      next();
    });
  }, async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No image provided' });
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = 'data:' + req.file.mimetype + ';base64,' + b64;
      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'kace_gaming',
        transformation: [
          { width: 1200, crop: 'limit' },
          { quality: 'auto:eco', fetch_format: 'auto' }
        ]
      });
      res.json({ url: result.secure_url, public_id: result.public_id });
    } catch (error) {
      console.error('Upload Error:', error);
      res.status(500).json({ error: 'Upload failed' });
    }
  });

  app.post('/api/delete-image', async (req, res) => {
    try {
      const { public_id } = req.body;
      if (!public_id) return res.status(400).json({ error: 'No public_id provided' });
      await cloudinary.uploader.destroy(public_id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Delete failed' });
    }
  });

  // ─── Categories ──────────────────────────────────────────────────────
  app.get('/api/categories', async (_req, res) => {
    try {
      const result = await db.execute('SELECT * FROM categories ORDER BY created_at DESC');
      res.json(result.rows.map(rowToObj));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/categories', async (req, res) => {
    try {
      const { name_ar, name_en, slug, image_url } = req.body;
      const id = randomUUID();
      const now = new Date().toISOString();
      await db.execute({
        sql: 'INSERT INTO categories (id, name_ar, name_en, slug, image_url, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        args: [id, name_ar, name_en, slug, image_url || null, now]
      });
      const row = await db.execute({ sql: 'SELECT * FROM categories WHERE id = ?', args: [id] });
      res.json(rowToObj(row.rows[0]));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.put('/api/categories/:id', async (req, res) => {
    try {
      const { name_ar, name_en, slug, image_url } = req.body;
      await db.execute({
        sql: 'UPDATE categories SET name_ar=?, name_en=?, slug=?, image_url=? WHERE id=?',
        args: [name_ar, name_en, slug, image_url || null, req.params.id]
      });
      const row = await db.execute({ sql: 'SELECT * FROM categories WHERE id = ?', args: [req.params.id] });
      res.json(rowToObj(row.rows[0]));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete('/api/categories/:id', async (req, res) => {
    try {
      const existing = await db.execute({ sql: 'SELECT image_url FROM categories WHERE id=?', args: [req.params.id] });
      if (existing.rows[0]) {
        const row = rowToObj(existing.rows[0]);
        await deleteCloudinaryImages([row.image_url]);
      }
      await db.execute({ sql: 'DELETE FROM categories WHERE id=?', args: [req.params.id] });
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── Products ─────────────────────────────────────────────────────────
  app.get('/api/products', async (_req, res) => {
    try {
      const prodResult = await db.execute('SELECT p.*, c.name_en as cat_name_en, c.name_ar as cat_name_ar FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.created_at DESC');
      const varResult = await db.execute('SELECT * FROM product_variants ORDER BY created_at ASC');

      const variants = varResult.rows.map(rowToObj);
      const products = prodResult.rows.map(r => {
        const p = rowToObj(r);
        p.image_url = toArr(p.image_url);
        p.images = toArr(p.images);
        p.category = p.cat_name_en ? { name_en: p.cat_name_en, name_ar: p.cat_name_ar } : null;
        delete p.cat_name_en; delete p.cat_name_ar;
        p.variants = variants.filter(v => v.product_id === p.id);
        return p;
      });
      res.json(products);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/products', async (req, res) => {
    try {
      const { name_ar, name_en, slug, description_ar, description_en, price, original_price, image_url, images, category_id, stock, is_featured, is_new, is_sale, variants } = req.body;
      const id = randomUUID();
      const now = new Date().toISOString();
      const autoSlug = (slug || name_en.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')) + '-' + id.slice(0, 6);
      await db.execute({
        sql: `INSERT INTO products (id, name_ar, name_en, slug, description_ar, description_en, price, original_price, image_url, images, category_id, stock, is_featured, is_new, is_sale, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [id, name_ar, name_en, autoSlug, description_ar || null, description_en || null, price, original_price || null,
          JSON.stringify(image_url || []), JSON.stringify(images || []), category_id || null, stock || 0,
          is_featured ? 1 : 0, is_new ? 1 : 0, is_sale ? 1 : 0, now]
      });
      if (variants && variants.length > 0) {
        for (const v of variants) {
          await db.execute({
            sql: 'INSERT INTO product_variants (id, product_id, name_ar, name_en, image_url, stock, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            args: [randomUUID(), id, v.name_ar || v.name_en, v.name_en, v.image_url || null, v.stock || 0, now]
          });
        }
      }
      res.json({ id });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.put('/api/products/:id', async (req, res) => {
    try {
      const { name_ar, name_en, slug, description_ar, description_en, price, original_price, image_url, images, category_id, stock, is_featured, is_new, is_sale, variants } = req.body;
      const newImages = [...(image_url || []), ...(images || [])];
      const oldProd = await db.execute({ sql: 'SELECT image_url, images FROM products WHERE id=?', args: [req.params.id] });
      if (oldProd.rows[0]) {
        const old = rowToObj(oldProd.rows[0]);
        const oldImages = [...toArr(old.image_url), ...toArr(old.images)];
        const removedImages = oldImages.filter(u => !newImages.includes(u));
        await deleteCloudinaryImages(removedImages);
      }
      const oldVarRows = await db.execute({ sql: 'SELECT image_url FROM product_variants WHERE product_id=?', args: [req.params.id] });
      const newVariantImages = (variants || []).map((v: any) => v.image_url).filter(Boolean);
      for (const v of oldVarRows.rows) {
        const vObj = rowToObj(v);
        if (vObj.image_url && !newVariantImages.includes(vObj.image_url)) {
          await deleteCloudinaryImages([vObj.image_url]);
        }
      }
      await db.execute({
        sql: `UPDATE products SET name_ar=?, name_en=?, slug=?, description_ar=?, description_en=?, price=?, original_price=?, image_url=?, images=?, category_id=?, stock=?, is_featured=?, is_new=?, is_sale=? WHERE id=?`,
        args: [name_ar, name_en, slug || name_en.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          description_ar || null, description_en || null, price, original_price || null,
          JSON.stringify(image_url || []), JSON.stringify(images || []), category_id || null, stock || 0,
          is_featured ? 1 : 0, is_new ? 1 : 0, is_sale ? 1 : 0, req.params.id]
      });
      await db.execute({ sql: 'DELETE FROM product_variants WHERE product_id=?', args: [req.params.id] });
      if (variants && variants.length > 0) {
        const now = new Date().toISOString();
        for (const v of variants) {
          await db.execute({
            sql: 'INSERT INTO product_variants (id, product_id, name_ar, name_en, image_url, stock, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            args: [randomUUID(), req.params.id, v.name_ar || v.name_en, v.name_en, v.image_url || null, v.stock || 0, now]
          });
        }
      }
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete('/api/products/:id', async (req, res) => {
    try {
      const prodRow = await db.execute({ sql: 'SELECT image_url, images FROM products WHERE id=?', args: [req.params.id] });
      const varRows = await db.execute({ sql: 'SELECT image_url FROM product_variants WHERE product_id=?', args: [req.params.id] });
      const allUrls: string[] = [];
      if (prodRow.rows[0]) {
        const p = rowToObj(prodRow.rows[0]);
        allUrls.push(...toArr(p.image_url), ...toArr(p.images));
      }
      for (const v of varRows.rows) {
        const vObj = rowToObj(v);
        if (vObj.image_url) allUrls.push(vObj.image_url);
      }
      await deleteCloudinaryImages(allUrls);
      await db.execute({ sql: 'DELETE FROM products WHERE id=?', args: [req.params.id] });
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── Orders ───────────────────────────────────────────────────────────
  app.get('/api/orders', async (_req, res) => {
    try {
      const ordersResult = await db.execute('SELECT * FROM orders ORDER BY created_at DESC');
      const itemsResult = await db.execute(`
        SELECT oi.*, 
               p.name_en as prod_name_en, p.image_url as prod_image_url,
               pv.id as var_id, pv.name_en as var_name_en, pv.image_url as var_image_url
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        LEFT JOIN product_variants pv ON oi.variant_id = pv.id
      `);

      const items = itemsResult.rows.map(rowToObj);
      const orders = ordersResult.rows.map(r => {
        const o = rowToObj(r);
        o.order_items = items
          .filter(i => i.order_id === o.id)
          .map(i => ({
            id: i.id,
            order_id: i.order_id,
            product_id: i.product_id,
            variant_id: i.variant_id,
            quantity: i.quantity,
            price: i.price,
            product: i.prod_name_en ? {
              name_en: i.prod_name_en,
              image_url: toArr(i.prod_image_url)
            } : null,
            variant: i.var_id ? {
              id: i.var_id,
              name_en: i.var_name_en,
              image_url: i.var_image_url
            } : null
          }));
        return o;
      });
      res.json(orders);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/orders', async (req, res) => {
    try {
      const { customer_name, phone, wilaya, commune, address, total_price, shipping_price, items } = req.body;
      const id = randomUUID();
      const now = new Date().toISOString();
      await db.execute({
        sql: `INSERT INTO orders (id, customer_name, phone, wilaya, commune, address, total_price, shipping_price, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
        args: [id, customer_name, phone, wilaya, commune || null, address, total_price, shipping_price, now]
      });
      if (items && items.length > 0) {
        for (const item of items) {
          await db.execute({
            sql: 'INSERT INTO order_items (id, order_id, product_id, variant_id, quantity, price) VALUES (?, ?, ?, ?, ?, ?)',
            args: [randomUUID(), id, item.product_id || null, item.variant_id || null, item.quantity, item.price]
          });
        }
      }
      await pusher.trigger('orders-channel', 'new-order', {
        id, customer_name, phone, total_price, created_at: now
      });
      res.json({ id });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.patch('/api/orders/:id/status', async (req, res) => {
    try {
      const { status } = req.body;
      await db.execute({ sql: 'UPDATE orders SET status=? WHERE id=?', args: [status, req.params.id] });
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── Shipping Rates ───────────────────────────────────────────────────
  app.get('/api/shipping-rates', async (_req, res) => {
    try {
      const result = await db.execute('SELECT * FROM shipping_rates ORDER BY wilaya_id ASC');
      res.json(result.rows.map(rowToObj));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.put('/api/shipping-rates/:id', async (req, res) => {
    try {
      const { home_delivery_price, desk_delivery_price, return_price } = req.body;
      await db.execute({
        sql: 'UPDATE shipping_rates SET home_delivery_price=?, desk_delivery_price=?, return_price=? WHERE id=?',
        args: [home_delivery_price ?? null, desk_delivery_price ?? null, return_price ?? null, req.params.id]
      });
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── Store Config ─────────────────────────────────────────────────────
  app.get('/api/store-config', async (_req, res) => {
    try {
      const result = await db.execute('SELECT * FROM store_config WHERE id=1 LIMIT 1');
      if (result.rows.length === 0) return res.json(null);
      const row = rowToObj(result.rows[0]);
      row.hero_images = toArr(row.hero_images);
      res.json(row);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.put('/api/store-config', async (req, res) => {
    try {
      const { store_name, logo_url, hero_images, contact_phone, contact_email, contact_address, facebook_url, instagram_url, twitter_url, whatsapp_number } = req.body;
      const now = new Date().toISOString();
      await db.execute({
        sql: `INSERT INTO store_config (id, store_name, logo_url, hero_images, contact_phone, contact_email, contact_address, facebook_url, instagram_url, twitter_url, whatsapp_number, updated_at)
              VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET store_name=excluded.store_name, logo_url=excluded.logo_url, hero_images=excluded.hero_images,
              contact_phone=excluded.contact_phone, contact_email=excluded.contact_email, contact_address=excluded.contact_address,
              facebook_url=excluded.facebook_url, instagram_url=excluded.instagram_url, twitter_url=excluded.twitter_url,
              whatsapp_number=excluded.whatsapp_number, updated_at=excluded.updated_at`,
        args: [store_name, logo_url || null, JSON.stringify(hero_images || []),
          contact_phone || null, contact_email || null, contact_address || null,
          facebook_url || null, instagram_url || null, twitter_url || null, whatsapp_number || null, now]
      });
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── Banners ──────────────────────────────────────────────────────────
  app.get('/api/banners', async (_req, res) => {
    try {
      const result = await db.execute('SELECT * FROM banners ORDER BY order_index ASC');
      res.json(result.rows.map(rowToObj));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/banners', async (req, res) => {
    try {
      const { image_url, title, link_url, order_index, is_active } = req.body;
      const id = randomUUID();
      const now = new Date().toISOString();
      await db.execute({
        sql: 'INSERT INTO banners (id, image_url, title, link_url, order_index, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [id, image_url, title || null, link_url || null, order_index ?? 0, is_active ? 1 : 0, now]
      });
      const row = await db.execute({ sql: 'SELECT * FROM banners WHERE id=?', args: [id] });
      res.json(rowToObj(row.rows[0]));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.put('/api/banners/:id', async (req, res) => {
    try {
      const { image_url, is_active } = req.body;
      await db.execute({
        sql: 'UPDATE banners SET image_url=?, is_active=? WHERE id=?',
        args: [image_url, is_active ? 1 : 0, req.params.id]
      });
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete('/api/banners/:id', async (req, res) => {
    try {
      const existing = await db.execute({ sql: 'SELECT image_url FROM banners WHERE id=?', args: [req.params.id] });
      if (existing.rows[0]) {
        const row = rowToObj(existing.rows[0]);
        await deleteCloudinaryImages([row.image_url]);
      }
      await db.execute({ sql: 'DELETE FROM banners WHERE id=?', args: [req.params.id] });
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── Dashboard Stats ──────────────────────────────────────────────────
  app.get('/api/stats', async (_req, res) => {
    try {
      const [ordersRes, productsRes, categoriesRes, recentRes] = await Promise.all([
        db.execute('SELECT total_price FROM orders'),
        db.execute('SELECT COUNT(*) as cnt FROM products'),
        db.execute('SELECT COUNT(*) as cnt FROM categories'),
        db.execute('SELECT * FROM orders ORDER BY created_at DESC LIMIT 3'),
      ]);
      const revenue = ordersRes.rows.reduce((sum, r: any) => sum + Number(r.total_price || 0), 0);
      res.json({
        totalOrders: ordersRes.rows.length,
        totalRevenue: revenue,
        totalProducts: Number((productsRes.rows[0] as any)?.cnt || 0),
        totalCategories: Number((categoriesRes.rows[0] as any)?.cnt || 0),
        recentOrders: recentRes.rows.map(rowToObj),
      });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── Pusher Auth (for private channels if needed) ─────────────────────
  app.post('/api/pusher/auth', (req, res) => {
    const { socket_id, channel_name } = req.body;
    const auth = pusher.authorizeChannel(socket_id, channel_name);
    res.json(auth);
  });

  // ─── Vite / Static ────────────────────────────────────────────────────
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

  const PORT = parseInt(process.env.PORT || '5000', 10);
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
