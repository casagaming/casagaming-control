import 'dotenv/config';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { app } from './src/api/app.js';

const REQUIRED_ENV_VARS = [
  'TURSO_DATABASE_URL',
  'TURSO_AUTH_TOKEN',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'PUSHER_APP_ID',
  'PUSHER_KEY',
  'PUSHER_SECRET',
  'PUSHER_CLUSTER',
];

const missing = REQUIRED_ENV_VARS.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error('❌ Missing required environment variables:\n' + missing.map(k => `   - ${k}`).join('\n'));
  console.error('\nCopy .env.example to .env and fill in your values.');
  process.exit(1);
}

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const { default: express } = await import('express');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = parseInt(process.env.PORT || '5000', 10);
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
