import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Sparkles,
  User,
  Copy,
  Check,
  RotateCw,
  Square,
  Pencil,
  X,
  Send
} from 'lucide-react';
import CodeBlock from './CodeBlock';

export default function MessageItem({
  message,
  isStreaming = false,
  isGenerating = false,
  onRegenerate,
  onStop,
  onEditAndResend
}) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editContent.trim()) return;
    onEditAndResend(message.id, editContent.trim());
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  const formatTimestamp = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className={`message-row ${isUser ? 'message-user' : 'message-assistant'} ${message.isError ? 'message-error' : ''}`}>
      <div className="message-container">
        {/* Avatar */}
        <div className="message-avatar">
          {isUser ? (
            <div className="avatar-user">
              <User size={18} />
            </div>
          ) : (
            <div className="avatar-aira">
              <Sparkles size={18} />
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="message-body">
          <div className="message-header-info">
            <span className="message-sender">{isUser ? 'You' : 'Aira AI'}</span>
            {message.timestamp && (
              <span className="message-time">{formatTimestamp(message.timestamp)}</span>
            )}
            {message.edited && <span className="message-tag">edited</span>}
            {message.interrupted && <span className="message-tag">stopped</span>}
          </div>

          {/* User Message Edit Mode */}
          {isUser && isEditing ? (
            <form onSubmit={handleSaveEdit} className="edit-message-form">
              <textarea
                className="edit-message-textarea"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                autoFocus
                rows={Math.min(6, Math.max(2, editContent.split('\n').length))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSaveEdit(e);
                  }
                  if (e.key === 'Escape') {
                    handleCancelEdit();
                  }
                }}
              />
              <div className="edit-actions">
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={handleCancelEdit}
                >
                  <X size={14} />
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  className="btn-primary btn-sm"
                  disabled={!editContent.trim()}
                >
                  <Send size={14} />
                  <span>Save & Submit</span>
                </button>
              </div>
            </form>
          ) : (
            /* Regular Message Display */
            <div className="message-text">
              {isUser ? (
                <p className="user-plain-text">{message.content}</p>
              ) : (
                <div className="markdown-render">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        const codeString = String(children).replace(/\n$/, '');

                        if (!inline && (match || codeString.includes('\n'))) {
                          return (
                            <CodeBlock
                              language={match ? match[1] : ''}
                              value={codeString}
                            />
                          );
                        }
                        return (
                          <code className="inline-code" {...props}>
                            {children}
                          </code>
                        );
                      },
                      a({ href, children }) {
                        return (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="chat-link"
                          >
                            {children}
                          </a>
                        );
                      }
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                  {isStreaming && (
                    <span className="streaming-cursor" aria-hidden="true"></span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Toolbar */}
          {!isEditing && (
            <div className="message-toolbar">
              {isUser ? (
                /* User Controls */
                <button
                  className="toolbar-btn"
                  onClick={() => setIsEditing(true)}
                  title="Edit and resend"
                  type="button"
                  disabled={isGenerating}
                >
                  <Pencil size={14} />
                  <span>Edit</span>
                </button>
              ) : (
                /* Assistant Controls */
                <>
                  <button
                    className="toolbar-btn"
                    onClick={handleCopy}
                    title="Copy response"
                    type="button"
                  >
                    {copied ? (
                      <>
                        <Check size={14} className="text-success" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  {isStreaming ? (
                    <button
                      className="toolbar-btn toolbar-btn-danger"
                      onClick={onStop}
                      title="Stop generating"
                      type="button"
                    >
                      <Square size={14} />
                      <span>Stop</span>
                    </button>
                  ) : (
                    onRegenerate && (
                      <button
                        className="toolbar-btn"
                        onClick={() => onRegenerate(message.id)}
                        title="Regenerate response"
                        type="button"
                        disabled={isGenerating}
                      >
                        <RotateCw size={14} />
                        <span>Regenerate</span>
                      </button>
                    )
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
