const express = require('express');
const router = express.Router();
const ollamaService = require('../services/ollama');

// GET /api/health
router.get('/', async (req, res) => {
  try {
    const health = await ollamaService.checkHealth();
    if (!health.running) {
      return res.status(503).json({
        status: 'error',
        ollamaConnected: false,
        message: health.message
      });
    }

    return res.json({
      status: 'ok',
      ollamaConnected: true,
      defaultModel: health.defaultModel,
      modelsCount: health.models.length,
      models: health.models.map(m => m.name)
    });
  } catch (err) {
    return res.status(503).json({
      status: 'error',
      ollamaConnected: false,
      message: 'Unable to connect to Ollama. Please start Ollama and try again.'
    });
  }
});

module.exports = router;
