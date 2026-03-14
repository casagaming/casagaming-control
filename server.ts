import express from 'express';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import path from 'path';

// Configure Cloudinary with the provided credentials
cloudinary.config({
  cloud_name: 'ddsikz7wq',
  api_key: '728859884445323',
  api_secret: 'qJBcAxrhV_loi85MYP8OK_F_IcY'
});

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  app.use(express.json());

  // Image Upload Endpoint
  app.post('/api/upload', (req, res, next) => {
    upload.single('image')(req, res, (err) => {
      if (err) {
        console.error('Multer Error:', err);
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  }, async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image provided' });
      }
      
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = 'data:' + req.file.mimetype + ';base64,' + b64;
      
      // Upload to Cloudinary with optimization
      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'kace_gaming',
        transformation: [
          { width: 1200, crop: 'limit' }, // Resize to max 1200px width
          { quality: 'auto:eco', fetch_format: 'auto' } // Eco quality to save resources
        ]
      });
      
      res.json({ url: result.secure_url, public_id: result.public_id });
    } catch (error) {
      console.error('Upload Error:', error);
      res.status(500).json({ error: 'Upload failed' });
    }
  });

  // Image Delete Endpoint
  app.post('/api/delete-image', async (req, res) => {
    try {
      const { public_id } = req.body;
      if (!public_id) {
        return res.status(400).json({ error: 'No public_id provided' });
      }
      
      await cloudinary.uploader.destroy(public_id);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete Error:', error);
      res.status(500).json({ error: 'Delete failed' });
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

  app.listen(3000, '0.0.0.0', () => {
    console.log('Server running on http://localhost:3000');
  });
}

startServer();
