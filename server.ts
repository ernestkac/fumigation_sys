import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { config } from './backend/config/env.js';
import apiRoutes from './backend/routes/apiRoutes.js';

async function startServer() {
  const app = express();
  const PORT = config.port || 3000;

  // Basic Middlewares
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API Health Check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'Fumigation Exercise Tracking System API',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API Routes
  app.use('/api', apiRoutes);

  // Vite middleware for development vs Static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(` Fumigation Exercise Tracking System Server Started `);
    console.log(` Port: ${PORT} | Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log(` API Endpoint: http://localhost:${PORT}/api`);
    console.log(`====================================================`);
  });
}

startServer().catch((err) => {
  console.error('Fatal Server Startup Error:', err);
  process.exit(1);
});
