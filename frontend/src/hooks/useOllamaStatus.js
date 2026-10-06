import { useState, useEffect, useCallback } from 'react';

export function useOllamaStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [models, setModels] = useState([]);
  const [defaultModel, setDefaultModel] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isChecking, setIsChecking] = useState(true);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setIsConnected(true);
        setDefaultModel(data.defaultModel || 'llama3.2');
        setErrorMessage('');

        // Also fetch full models list
        try {
          const mRes = await fetch('/api/models');
          if (mRes.ok) {
            const mData = await mRes.json();
            setModels(mData.models || []);
          }
        } catch {}
      } else {
        const errData = await res.json().catch(() => ({}));
        setIsConnected(false);
        setErrorMessage(errData.message || 'Unable to connect to Ollama. Please start Ollama and try again.');
      }
    } catch (err) {
      setIsConnected(false);
      setErrorMessage('Unable to connect to Ollama. Please start Ollama and try again.');
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  return {
    isConnected,
    models,
    defaultModel,
    errorMessage,
    isChecking,
    checkStatus
  };
}
