const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');

const healthRoutes = require('./routes/health');
const modelsRoutes = require('./routes/models');
const chatRoutes = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 5000;
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

// Middleware
app.use(cors({
  origin: '*', // Allow local frontend Vite dev server (e.g. 5173, 3000)
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept']
}));
app.use(express.json());

// Request logger for development
app.use((req, res, next) => {
  const timestamp = new Date().toISOString().substring(11, 19);
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/models', modelsRoutes);
app.use('/api/chat', chatRoutes);

// Root route for quick test
app.get('/', (req, res) => {
  res.json({
    app: 'Aira AI Backend',
    version: '1.0.0',
    status: 'online',
    ollamaUrl: OLLAMA_URL,
    defaultModel: OLLAMA_MODEL,
    endpoints: [
      'GET  /api/health',
      'GET  /api/models',
      'POST /api/chat'
    ]
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Aira Backend Error]', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`  🌟 Aira AI Backend Server Running!     `);
  console.log(`  🔗 Port:         http://localhost:${PORT}`);
  console.log(`  🦙 Ollama URL:   ${OLLAMA_URL}          `);
  console.log(`  🤖 Default Model: ${OLLAMA_MODEL}       `);
  console.log(`=========================================`);
});
