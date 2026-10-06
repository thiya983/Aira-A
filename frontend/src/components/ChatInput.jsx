import React, { useRef, useEffect } from 'react';
import { ArrowUp, Square, Sparkles } from 'lucide-react';

export default function ChatInput({
  input,
  setInput,
  onSend,
  onStop,
  isGenerating,
  disabled = false
}) {
  const textareaRef = useRef(null);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      // Cap at 200px max height
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isGenerating && input.trim()) {
        onSend(input);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isGenerating) {
      onStop();
    } else if (input.trim()) {
      onSend(input);
    }
  };

  return (
    <div className="chat-input-wrapper">
      <form onSubmit={handleSubmit} className="chat-input-container">
        <textarea
          ref={textareaRef}
          className="chat-textarea"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Aira anything... (Shift+Enter for newline)"
          rows={1}
          disabled={disabled}
        />

        <div className="chat-input-controls">
          {isGenerating ? (
            <button
              type="button"
              className="action-btn stop-btn"
              onClick={onStop}
              title="Stop generating"
              aria-label="Stop generation"
            >
              <Square size={16} fill="currentColor" />
            </button>
          ) : (
            <button
              type="submit"
              className={`action-btn send-btn ${input.trim() ? 'send-btn-active' : ''}`}
              disabled={!input.trim() || disabled}
              title="Send message (Enter)"
              aria-label="Send message"
            >
              <ArrowUp size={18} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </form>

      <div className="input-privacy-disclaimer">
        <Sparkles size={12} className="text-accent" />
        <span>Aira runs 100% locally on your computer via Ollama. No data leaves your machine.</span>
      </div>
    </div>
  );
}
