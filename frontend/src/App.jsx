import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import SettingsModal from './components/SettingsModal';
import { useTheme } from './hooks/useTheme';
import { useOllamaStatus } from './hooks/useOllamaStatus';
import { useChat } from './hooks/useChat';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const {
    isConnected,
    models,
    defaultModel,
    errorMessage: ollamaError,
    checkStatus
  } = useOllamaStatus();

  const {
    chats,
    filteredChats,
    activeChat,
    activeChatId,
    selectedModel,
    setSelectedModel,
    searchQuery,
    setSearchQuery,
    isGenerating,
    streamingContent,
    errorMessage: chatError,
    setErrorMessage: setChatError,
    createNewChat,
    selectChat,
    renameChat,
    deleteChat,
    clearCurrentChat,
    sendMessage,
    stopGeneration,
    regenerateResponse,
    editAndResend
  } = useChat();

  // If no model explicitly selected yet, default to Ollama's detected or default model
  const currentModel = selectedModel || defaultModel || 'llama3.2';

  // Global keyboard shortcuts (Ctrl+K or Cmd+K for New Chat, Escape to close modals)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        createNewChat();
        setIsMobileSidebarOpen(false);
      }
      if (e.key === 'Escape') {
        setIsMobileSidebarOpen(false);
        setIsSettingsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createNewChat]);

  // Combined error to display in banner
  const activeErrorMessage = chatError || (isConnected ? null : ollamaError);

  return (
    <div className="aira-app-container">
      {/* Sidebar for Desktop & Mobile Drawer */}
      <Sidebar
        chats={chats}
        filteredChats={filteredChats}
        activeChatId={activeChatId}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSelectChat={selectChat}
        onNewChat={createNewChat}
        onRenameChat={renameChat}
        onDeleteChat={deleteChat}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Chat Area */}
      <ChatArea
        activeChat={activeChat}
        onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        onNewChat={createNewChat}
        onClearChat={clearCurrentChat}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isConnected={isConnected}
        currentModel={currentModel}
        errorMessage={activeErrorMessage}
        onRetryConnection={checkStatus}
        onDismissError={() => setChatError(null)}
        isGenerating={isGenerating}
        streamingContent={streamingContent}
        onSendMessage={sendMessage}
        onStopGeneration={stopGeneration}
        onRegenerate={regenerateResponse}
        onEditAndResend={editAndResend}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        models={models}
        currentModel={currentModel}
        onSelectModel={setSelectedModel}
        isConnected={isConnected}
        onRefreshStatus={checkStatus}
        onChatsCleared={() => {
          createNewChat();
        }}
      />
    </div>
  );
}
