import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import templateRoutes from './routes/templates.js';
import sessionRoutes from './routes/sessions.js';
import evaluationRoutes from './routes/evaluations.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/templates', templateRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/evaluations', evaluationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Hệ thống đánh giá API đang hoạt động',
    timestamp: new Date().toISOString() 
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Hệ thống đánh giá đa người - API Server',
    version: '1.0.0',
    endpoints: {
      templates: '/api/templates',
      sessions: '/api/sessions',
      evaluations: '/api/evaluations',
      health: '/api/health',
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('🚀 Hệ thống đánh giá API Server');
  console.log('='.repeat(50));
  console.log(`📡 Server đang chạy tại: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📋 Templates API: http://localhost:${PORT}/api/templates`);
  console.log(`📊 Sessions API: http://localhost:${PORT}/api/sessions`);
  console.log(`✍️  Evaluations API: http://localhost:${PORT}/api/evaluations`);
  console.log('='.repeat(50));
});

export default app;
