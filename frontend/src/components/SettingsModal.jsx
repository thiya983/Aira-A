import React, { useState } from 'react';
import {
  X,
  Cpu,
  Server,
  Trash2,
  Check,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Info
} from 'lucide-react';
import { clearAllChatsFromStorage } from '../utils/storage';

export default function SettingsModal({
  isOpen,
  onClose,
  models = [],
  currentModel,
  onSelectModel,
  isConnected,
  onRefreshStatus,
  onChatsCleared
}) {
  const [confirmClear, setConfirmClear] = useState(false);
  const [customModelInput, setCustomModelInput] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsRefreshing(true);
    await onRefreshStatus();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleClearAllHistory = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    clearAllChatsFromStorage();
    onChatsCleared();
    setConfirmClear(false);
    onClose();
  };

  const handleApplyCustomModel = (e) => {
    e.preventDefault();
    if (customModelInput.trim()) {
      onSelectModel(customModelInput.trim());
      setCustomModelInput('');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Cpu size={20} className="text-accent" />
            <h3 className="modal-title">Aira AI Settings</h3>
          </div>
          <button
            className="modal-close-btn"
            onClick={onClose}
            title="Close settings"
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="modal-body">
          {/* Section: Ollama Model Configuration */}
          <div className="settings-section">
            <label className="section-label">
              <Cpu size={16} />
              <span>Ollama Model</span>
            </label>
            <p className="section-desc">
              Select an installed local LLM model or enter a model name configured in Ollama.
            </p>

            <div className="model-selector-wrap">
              <select
                className="settings-select"
                value={currentModel || 'llama3.2'}
                onChange={(e) => onSelectModel(e.target.value)}
              >
                {models.length > 0 ? (
                  models.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name} {m.size ? `(${(m.size / (1024 * 1024 * 1024)).toFixed(1)} GB)` : ''}
                    </option>
                  ))
                ) : (
                  <option value="llama3.2">llama3.2 (Default)</option>
                )}
              </select>
            </div>

            {/* Custom Model input if user has a different model tag */}
            <form onSubmit={handleApplyCustomModel} className="custom-model-form">
              <input
                type="text"
                placeholder="Or type custom model (e.g. llama3.2:1b, mistral)"
                value={customModelInput}
                onChange={(e) => setCustomModelInput(e.target.value)}
                className="custom-model-input"
              />
              <button
                type="submit"
                className="btn-secondary btn-sm"
                disabled={!customModelInput.trim()}
              >
                Set
              </button>
            </form>
          </div>

          {/* Section: Local Backend & Ollama Server */}
          <div className="settings-section">
            <label className="section-label">
              <Server size={16} />
              <span>Local Ollama Connection</span>
            </label>
            <p className="section-desc">
              Aira connects to your local Ollama instance via the local Express backend proxy.
            </p>

            <div className="server-status-card">
              <div className="server-status-info">
                <span className={`status-pill ${isConnected ? 'status-pill-online' : 'status-pill-offline'}`}>
                  <span className="status-dot"></span>
                  <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                </span>
                <span className="server-endpoint">http://localhost:11434</span>
              </div>

              <button
                className="btn-secondary btn-sm"
                onClick={handleTestConnection}
                disabled={isRefreshing}
                type="button"
              >
                <RefreshCw size={13} className={isRefreshing ? 'spin-icon' : ''} />
                <span>Test Connection</span>
              </button>
            </div>
          </div>

          {/* Section: Privacy & Security Guarantee */}
          <div className="settings-section privacy-section">
            <div className="privacy-badge-group">
              <ShieldCheck size={20} className="text-success" />
              <div>
                <h4 className="privacy-heading">Zero Cloud APIs • No API Keys</h4>
                <p className="privacy-text">
                  Aira operates 100% offline and locally on your computer. All prompts, tokens, and weights stay strictly on your machine.
                </p>
              </div>
            </div>
          </div>

          {/* Section: Danger Zone (Clear Chat History) */}
          <div className="settings-section danger-section">
            <label className="section-label text-danger">
              <Trash2 size={16} />
              <span>Chat Storage</span>
            </label>
            <p className="section-desc">
              All conversations are saved in your browser's localStorage. You can clear them anytime.
            </p>

            {confirmClear ? (
              <div className="confirm-clear-box">
                <AlertCircle size={16} className="text-danger" />
                <span>Are you sure? This cannot be undone.</span>
                <div className="confirm-buttons">
                  <button
                    className="btn-danger btn-sm"
                    onClick={handleClearAllHistory}
                    type="button"
                  >
                    Yes, delete all
                  </button>
                  <button
                    className="btn-secondary btn-sm"
                    onClick={() => setConfirmClear(false)}
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="btn-secondary btn-sm btn-danger-outline"
                onClick={() => setConfirmClear(true)}
                type="button"
              >
                <Trash2 size={14} />
                <span>Clear All Chat History</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="btn-primary" onClick={onClose} type="button">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
