import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import queueRoutes from './routes/queueRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, 'public');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Parse incoming JSON payloads
app.use(express.json());

// Request logger for DEBUG//LAB diagnostic tracing (stderr/stdout)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    }
  });
  next();
});

// Support both direct /api and preview proxy paths like /runtime/:id/preview/api
app.use(['/api', '*/api'], queueRoutes);

// Static assets serving
app.use(express.static(publicDir));
app.use(['/runtime/:id/preview', '*/preview'], express.static(publicDir));

// Fallback route for index.html
app.get(['/', '/index.html', '/runtime/:id/preview', '/runtime/:id/preview/index.html'], (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Centralized JSON error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message
  });
});

const server = app.listen(PORT, HOST, () => {
  console.log(`QueueCraft server running at http://${HOST}:${PORT}`);
  console.log(`Ready for DEBUG//LAB proxy under /runtime/{runtime_id}/preview/`);
});

export default app;
export { server };
