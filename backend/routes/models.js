const express = require('express');
const router = express.Router();
const ollamaService = require('../services/ollama');

// GET /api/models
router.get('/', async (req, res) => {
  try {
    const data = await ollamaService.getModels();
    return res.json({
      status: 'ok',
      defaultModel: data.defaultModel,
      models: data.models
    });
  } catch (err) {
    return res.status(503).json({
      status: 'error',
      message: err.message || 'Unable to connect to Ollama. Please start Ollama and try again.'
    });
  }
});

module.exports = router;
