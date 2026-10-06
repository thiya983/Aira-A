import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Search,
  MessageSquare,
  Pencil,
  Trash2,
  Check,
  X,
  Sun,
  Moon,
  Settings as SettingsIcon,
  PanelLeftClose
} from 'lucide-react';

export default function Sidebar({
  chats = [],
  filteredChats = [],
  activeChatId,
  searchQuery,
  setSearchQuery,
  onSelectChat,
  onNewChat,
  onRenameChat,
  onDeleteChat,
  theme,
  onToggleTheme,
  onOpenSettings,
  isOpenMobile,
  onCloseMobile
}) {
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const startRename = (chat, e) => {
    e.stopPropagation();
    setEditingId(chat.id);
    setEditTitle(chat.title);
    setDeletingId(null);
  };

  const saveRename = (chatId, e) => {
    e?.stopPropagation();
    if (editTitle.trim()) {
      onRenameChat(chatId, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelRename = (e) => {
    e?.stopPropagation();
    setEditingId(null);
  };

  const startDelete = (chatId, e) => {
    e.stopPropagation();
    setDeletingId(chatId);
    setEditingId(null);
  };

  const confirmDelete = (chatId, e) => {
    e.stopPropagation();
    onDeleteChat(chatId);
    setDeletingId(null);
  };

  const cancelDelete = (e) => {
    e.stopPropagation();
    setDeletingId(null);
  };

  // Group chats by date (Today, Yesterday, Previous 7 Days, Older)
  const groupChats = (chatList) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const groups = {
      Today: [],
      Yesterday: [],
      'Previous 7 Days': [],
      Older: []
    };

    chatList.forEach((chat) => {
      const date = new Date(chat.updatedAt || chat.createdAt || 0);
      if (date >= today) {
        groups.Today.push(chat);
      } else if (date >= yesterday) {
        groups.Yesterday.push(chat);
      } else if (date >= sevenDaysAgo) {
        groups['Previous 7 Days'].push(chat);
      } else {
        groups.Older.push(chat);
      }
    });

    return groups;
  };

  const groupedChats = groupChats(filteredChats);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="sidebar-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar-container ${isOpenMobile ? 'sidebar-mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-logo">
              <Sparkles size={20} className="logo-sparkle" />
            </div>
            <div className="sidebar-brand-text">
              <span className="brand-name">Aira AI</span>
              <span className="brand-tag">Local Assistant</span>
            </div>
          </div>

          <button
            className="sidebar-close-btn"
            onClick={onCloseMobile}
            title="Close sidebar"
            type="button"
          >
            <PanelLeftClose size={18} />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="sidebar-action-section">
          <button
            className="new-chat-btn"
            onClick={() => {
              onNewChat();
              if (isOpenMobile) onCloseMobile();
            }}
            type="button"
          >
            <Plus size={18} />
            <span>New Chat</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="sidebar-search">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="search-clear-btn"
              onClick={() => setSearchQuery('')}
              type="button"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Chat History List */}
        <div className="sidebar-chat-list">
          {filteredChats.length === 0 ? (
            <div className="chat-list-empty">
              {searchQuery ? 'No matching conversations' : 'No chat history yet'}
            </div>
          ) : (
            Object.entries(groupedChats).map(([groupTitle, list]) => {
              if (list.length === 0) return null;
              return (
                <div key={groupTitle} className="chat-group">
                  <div className="chat-group-title">{groupTitle}</div>
                  {list.map((chat) => {
                    const isActive = chat.id === activeChatId;
                    const isRenaming = editingId === chat.id;
                    const isDeleting = deletingId === chat.id;

                    return (
                      <div
                        key={chat.id}
                        className={`chat-item ${isActive ? 'chat-item-active' : ''}`}
                        onClick={() => {
                          if (!isRenaming && !isDeleting) {
                            onSelectChat(chat.id);
                            if (isOpenMobile) onCloseMobile();
                          }
                        }}
                      >
                        <MessageSquare size={16} className="chat-item-icon" />

                        {isRenaming ? (
                          <div className="chat-item-rename-box" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              className="rename-input"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveRename(chat.id, e);
                                if (e.key === 'Escape') cancelRename(e);
                              }}
                            />
                            <button
                              className="action-icon-btn check-btn"
                              onClick={(e) => saveRename(chat.id, e)}
                              type="button"
                              title="Save"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              className="action-icon-btn cancel-btn"
                              onClick={cancelRename}
                              type="button"
                              title="Cancel"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : isDeleting ? (
                          <div className="chat-item-delete-box" onClick={(e) => e.stopPropagation()}>
                            <span className="delete-prompt">Delete?</span>
                            <button
                              className="action-icon-btn confirm-delete-btn"
                              onClick={(e) => confirmDelete(chat.id, e)}
                              type="button"
                              title="Confirm delete"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              className="action-icon-btn cancel-btn"
                              onClick={cancelDelete}
                              type="button"
                              title="Cancel"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="chat-item-title" title={chat.title}>
                              {chat.title || 'Untitled Chat'}
                            </span>

                            <div className="chat-item-actions">
                              <button
                                className="action-icon-btn"
                                onClick={(e) => startRename(chat, e)}
                                title="Rename chat"
                                type="button"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                className="action-icon-btn action-icon-danger"
                                onClick={(e) => startDelete(chat.id, e)}
                                title="Delete chat"
                                type="button"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer Controls */}
        <div className="sidebar-footer">
          <div className="footer-controls">
            <button
              className="theme-toggle-btn"
              onClick={onToggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              type="button"
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            <button
              className="settings-trigger-btn"
              onClick={onOpenSettings}
              title="Settings"
              type="button"
            >
              <SettingsIcon size={17} />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
