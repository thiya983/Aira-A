const express = require('express');
const router = express.Router();
const ollamaService = require('../services/ollama');

// POST /api/chat
router.post('/', async (req, res) => {
  const { messages, model } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      error: 'Invalid request: "messages" array is required and must not be empty.'
    });
  }

  // Format and validate messages for Ollama
  const formattedMessages = messages.map(msg => ({
    role: msg.role === 'user' ? 'user' : (msg.role === 'system' ? 'system' : 'assistant'),
    content: typeof msg.content === 'string' ? msg.content : String(msg.content || '')
  }));

  const abortController = new AbortController();

  // If the client disconnects or aborts before response finishes, abort upstream request to Ollama
  res.on('close', () => {
    if (!res.writableEnded) {
      abortController.abort();
    }
  });

  try {
    const { model: activeModel, stream } = await ollamaService.createChatStream(
      formattedMessages,
      model,
      abortController.signal
    );

    // Set up Server-Sent Events headers
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable proxy buffering
    res.flushHeaders?.();

    // Send initial metadata event
    res.write(`data: ${JSON.stringify({ type: 'start', model: activeModel })}\n\n`);

    const reader = stream.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete trailing fragment in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          const parsed = JSON.parse(trimmed);
          if (parsed.message && parsed.message.content) {
            res.write(`data: ${JSON.stringify({
              type: 'chunk',
              content: parsed.message.content,
              done: false
            })}\n\n`);
          }

          if (parsed.done) {
            res.write(`data: ${JSON.stringify({
              type: 'done',
              done: true,
              totalDuration: parsed.total_duration,
              evalCount: parsed.eval_count
            })}\n\n`);
          }
        } catch (parseErr) {
          // If chunk wasn't complete JSON, ignore or log
        }
      }
    }

    // Process any remaining bytes in buffer
    if (buffer.trim()) {
      try {
        const parsed = JSON.parse(buffer.trim());
        if (parsed.message?.content) {
          res.write(`data: ${JSON.stringify({
            type: 'chunk',
            content: parsed.message.content,
            done: false
          })}\n\n`);
        }
      } catch {}
    }

    res.write(`data: ${JSON.stringify({ type: 'done', done: true })}\n\n`);
    res.end();
  } catch (err) {
    if (abortController.signal.aborted || err.name === 'AbortError') {
      if (!res.headersSent) {
        return res.status(499).json({ error: 'Client closed connection' });
      }
      return res.end();
    }

    const errorMessage = err.message || 'Unable to connect to Ollama. Please start Ollama and try again.';

    if (!res.headersSent) {
      return res.status(503).json({ error: errorMessage });
    }

    res.write(`data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`);
    res.end();
  }
});

module.exports = router;
