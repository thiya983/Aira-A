import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import MessageItem from './MessageItem';

export default function MessageList({
  messages = [],
  isGenerating = false,
  streamingContent = '',
  onRegenerate,
  onStop,
  onEditAndResend
}) {
  const bottomRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const isAutoScrollActiveRef = useRef(true);

  // Auto-scroll handler
  const scrollToBottom = (behavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior });
  };

  // Check scroll position to toggle scroll-to-bottom button
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const isAtBottom = distanceFromBottom < 80;

    isAutoScrollActiveRef.current = isAtBottom;
    setShowScrollBottom(!isAtBottom);
  };

  // Scroll to bottom when new messages arrive or when streaming updates
  useEffect(() => {
    if (isAutoScrollActiveRef.current) {
      scrollToBottom('auto');
    }
  }, [messages, streamingContent]);

  return (
    <div
      className="message-list-container"
      ref={scrollContainerRef}
      onScroll={handleScroll}
    >
      <div className="message-list-content">
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            isGenerating={isGenerating}
            onRegenerate={onRegenerate}
            onEditAndResend={onEditAndResend}
          />
        ))}

        {/* Active streaming message */}
        {isGenerating && streamingContent && (
          <MessageItem
            key="active-streaming-message"
            message={{
              id: 'streaming-preview',
              role: 'assistant',
              content: streamingContent,
              timestamp: new Date().toISOString()
            }}
            isStreaming={true}
            isGenerating={true}
            onStop={onStop}
          />
        )}

        {/* Loading shimmer indicator when generating but first chunk hasn't arrived */}
        {isGenerating && !streamingContent && (
          <div className="message-row message-assistant">
            <div className="message-container">
              <div className="message-avatar">
                <div className="avatar-aira shimmer-pulse"></div>
              </div>
              <div className="message-body">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} className="scroll-anchor" />
      </div>

      {/* Floating scroll to bottom button */}
      {showScrollBottom && (
        <button
          className="scroll-to-bottom-btn"
          onClick={() => {
            isAutoScrollActiveRef.current = true;
            scrollToBottom('smooth');
          }}
          type="button"
          aria-label="Scroll to bottom"
        >
          <ChevronDown size={18} />
        </button>
      )}
    </div>
  );
}
