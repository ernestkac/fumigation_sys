import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { config } from './config/env.js';
import apiRoutes from './routes/apiRoutes.js';

async function startServer() {
  const app = express();
  const PORT = config.port || 3000;

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'Fumigation Exercise Tracking System API',
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api', apiRoutes);

  const frontendDistPath = path.resolve(process.cwd(), '../frontend/dist');
  if (fs.existsSync(frontendDistPath)) {
    app.use(express.static(frontendDistPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(frontendDistPath, 'index.html'));
    });
  } else {
    app.get('/', (_req, res) => {
      res.json({
        name: 'Fumigation Exercise Tracking System API',
        mode: process.env.NODE_ENV || 'development',
        message: 'Frontend is running separately from the frontend package.',
      });
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
