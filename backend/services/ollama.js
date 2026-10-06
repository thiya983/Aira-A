/**
 * Ollama Service - Local LLM integration for Aira AI
 */

const getOllamaUrl = () => process.env.OLLAMA_URL || 'http://localhost:11434';
const getDefaultModel = () => process.env.OLLAMA_MODEL || 'llama3.2';

/**
 * Check if the local Ollama instance is active and reachable
 */
async function checkHealth() {
  const url = getOllamaUrl();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${url}/api/tags`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return {
        running: false,
        message: 'Unable to connect to Ollama. Please start Ollama and try again.'
      };
    }

    const data = await response.json();
    return {
      running: true,
      url,
      defaultModel: getDefaultModel(),
      models: data.models || []
    };
  } catch (err) {
    return {
      running: false,
      message: 'Unable to connect to Ollama. Please start Ollama and try again.'
    };
  }
}

/**
 * Retrieve list of all available models in local Ollama
 */
async function getModels() {
  const url = getOllamaUrl();
  try {
    const response = await fetch(`${url}/api/tags`);
    if (!response.ok) {
      throw new Error('Unable to connect to Ollama. Please start Ollama and try again.');
    }
    const data = await response.json();
    return {
      models: data.models || [],
      defaultModel: getDefaultModel()
    };
  } catch (err) {
    throw new Error('Unable to connect to Ollama. Please start Ollama and try again.');
  }
}

/**
 * Stream chat completion from Ollama
 * @param {Array} messages - Chat history array [{role, content}]
 * @param {string} requestedModel - Optional model name override
 * @param {AbortSignal} clientSignal - Upstream abort signal
 */
async function createChatStream(messages, requestedModel, clientSignal) {
  const url = getOllamaUrl();
  const model = requestedModel || getDefaultModel();

  let response;
  try {
    response = await fetch(`${url}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true
      }),
      signal: clientSignal
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw err;
    }
    throw new Error('Unable to connect to Ollama. Please start Ollama and try again.');
  }

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errJson = await response.json();
      errorDetail = errJson.error || '';
    } catch {
      // non-JSON response
    }

    if (response.status === 404 || errorDetail.toLowerCase().includes('not found')) {
      throw new Error('The selected Ollama model is not installed. Please install it using Ollama.');
    }

    throw new Error(errorDetail || 'Unable to connect to Ollama. Please start Ollama and try again.');
  }

  return {
    model,
    stream: response.body
  };
}

module.exports = {
  checkHealth,
  getModels,
  createChatStream,
  getDefaultModel,
  getOllamaUrl
};
