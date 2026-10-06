import React, { useState } from 'react';
import ChatHeader from './ChatHeader';
import WelcomeScreen from './WelcomeScreen';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import StatusBanner from './StatusBanner';

export default function ChatArea({
  activeChat,
  onOpenMobileSidebar,
  onNewChat,
  onClearChat,
  onOpenSettings,
  isConnected,
  currentModel,
  errorMessage,
  onRetryConnection,
  onDismissError,
  isGenerating,
  streamingContent,
  onSendMessage,
  onStopGeneration,
  onRegenerate,
  onEditAndResend
}) {
  const [inputText, setInputText] = useState('');

  const handleSelectExamplePrompt = (promptText) => {
    setInputText(promptText);
    // Focus textarea
    const textarea = document.querySelector('.chat-textarea');
    if (textarea) {
      textarea.focus();
    }
  };

  const handleSend = (text) => {
    onSendMessage(text);
    setInputText('');
  };

  const hasMessages = activeChat && activeChat.messages && activeChat.messages.length > 0;

  return (
    <main className="chat-main-area">
      <ChatHeader
        activeChat={activeChat}
        onOpenMobileSidebar={onOpenMobileSidebar}
        onNewChat={onNewChat}
        onClearChat={onClearChat}
        onOpenSettings={onOpenSettings}
        isConnected={isConnected}
        currentModel={currentModel}
      />

      <StatusBanner
        isConnected={isConnected}
        errorMessage={errorMessage}
        onRetry={onRetryConnection}
        onDismiss={onDismissError}
      />

      <div className="chat-body-viewport">
        {!hasMessages && !isGenerating ? (
          <WelcomeScreen onSelectPrompt={handleSelectExamplePrompt} />
        ) : (
          <MessageList
            messages={activeChat?.messages || []}
            isGenerating={isGenerating}
            streamingContent={streamingContent}
            onRegenerate={onRegenerate}
            onStop={onStopGeneration}
            onEditAndResend={onEditAndResend}
          />
        )}
      </div>

      <ChatInput
        input={inputText}
        setInput={setInputText}
        onSend={handleSend}
        onStop={onStopGeneration}
        isGenerating={isGenerating}
        disabled={!isConnected && activeChat?.messages?.length === 0 && false}
      />
    </main>
  );
}
