import React from 'react';
import { AlertTriangle, RefreshCw, Terminal, X } from 'lucide-react';

export default function StatusBanner({
  isConnected,
  errorMessage,
  onRetry,
  onDismiss
}) {
  if (isConnected && !errorMessage) return null;

  const isModelNotInstalled = errorMessage && errorMessage.toLowerCase().includes('not installed');
  const isOllamaOffline = !isConnected || (errorMessage && errorMessage.toLowerCase().includes('unable to connect'));

  const suggestedCommand = isModelNotInstalled
    ? 'ollama pull llama3.2'
    : 'ollama serve';

  return (
    <div className="status-banner">
      <div className="status-banner-content">
        <AlertTriangle size={18} className="banner-alert-icon" />

        <div className="status-banner-text">
          <p className="banner-primary-msg">
            {errorMessage || (
              !isConnected
                ? 'Unable to connect to Ollama. Please start Ollama and try again.'
                : 'Connection issue detected.'
            )}
          </p>

          <div className="banner-command-hint">
            <Terminal size={13} />
            <code>{suggestedCommand}</code>
          </div>
        </div>

        <div className="status-banner-actions">
          {onRetry && (
            <button
              className="banner-retry-btn"
              onClick={onRetry}
              title="Retry connection"
              type="button"
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          )}

          {onDismiss && (
            <button
              className="banner-close-btn"
              onClick={onDismiss}
              title="Dismiss banner"
              type="button"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
