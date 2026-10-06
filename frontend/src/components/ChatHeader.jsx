import React from 'react';
import {
  Menu,
  Plus,
  Trash2,
  Cpu,
  Settings as SettingsIcon,
  Wifi,
  WifiOff
} from 'lucide-react';

export default function ChatHeader({
  activeChat,
  onOpenMobileSidebar,
  onNewChat,
  onClearChat,
  onOpenSettings,
  isConnected,
  currentModel
}) {
  return (
    <header className="chat-header">
      <div className="chat-header-left">
        <button
          className="mobile-menu-btn"
          onClick={onOpenMobileSidebar}
          title="Open menu"
          type="button"
        >
          <Menu size={20} />
        </button>

        <div className="header-title-box">
          <h2 className="header-chat-title">
            {activeChat ? activeChat.title : 'Aira AI'}
          </h2>
        </div>
      </div>

      <div className="chat-header-right">
        {/* Model & Ollama Status Pill */}
        <div
          className={`model-status-pill ${isConnected ? 'status-online' : 'status-offline'}`}
          onClick={onOpenSettings}
          title={isConnected ? `Connected to Ollama (${currentModel || 'llama3.2'})` : 'Ollama Offline'}
        >
          <span className="status-dot"></span>
          <Cpu size={14} className="model-icon" />
          <span className="model-name">{currentModel || 'llama3.2'}</span>
          {isConnected ? (
            <Wifi size={13} className="text-success wifi-icon" />
          ) : (
            <WifiOff size={13} className="text-danger wifi-icon" />
          )}
        </div>

        {/* Clear Chat Button (when chat has messages) */}
        {activeChat && activeChat.messages.length > 0 && (
          <button
            className="header-action-btn"
            onClick={onClearChat}
            title="Clear chat messages"
            type="button"
          >
            <Trash2 size={16} />
            <span className="btn-label-desktop">Clear</span>
          </button>
        )}

        {/* New Chat Button */}
        <button
          className="header-action-btn"
          onClick={onNewChat}
          title="Start new chat"
          type="button"
        >
          <Plus size={16} />
          <span className="btn-label-desktop">New Chat</span>
        </button>

        {/* Settings Button */}
        <button
          className="header-action-btn icon-only-btn"
          onClick={onOpenSettings}
          title="Settings"
          type="button"
        >
          <SettingsIcon size={16} />
        </button>
      </div>
    </header>
  );
}
