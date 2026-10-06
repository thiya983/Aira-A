/**
 * LocalStorage utilities for Aira AI Chatbot
 * Manages chat history, active chat ID, theme, and model preferences
 */

const STORAGE_KEYS = {
  CHATS: 'aira_chats',
  ACTIVE_CHAT: 'aira_active_chat_id',
  THEME: 'aira_theme',
  MODEL: 'aira_model'
};

/**
 * Generate a unique ID (timestamp + random string)
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate a clean title from the user's first message
 * @param {string} text - Message text
 * @returns {string} - Truncated title
 */
export function generateChatTitle(text) {
  if (!text || typeof text !== 'string') return 'New Chat';
  const clean = text.replace(/[\r\n]+/g, ' ').trim();
  if (clean.length <= 36) return clean;
  return clean.substring(0, 36) + '...';
}

/**
 * Load all chats from localStorage
 * Schema:
 * [
 *   {
 *     id: string,
 *     title: string,
 *     createdAt: string,
 *     updatedAt: string,
 *     messages: [
 *       { id: string, role: 'user'|'assistant'|'system', content: string, timestamp: string }
 *     ]
 *   }
 * ]
 */
export function loadChats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CHATS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load chats from localStorage:', err);
    return [];
  }
}

/**
 * Save chats array to localStorage
 */
export function saveChats(chats) {
  try {
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
  } catch (err) {
    console.error('Failed to save chats to localStorage:', err);
  }
}

/**
 * Get active chat ID
 */
export function getActiveChatId() {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_CHAT) || null;
  } catch {
    return null;
  }
}

/**
 * Save active chat ID
 */
export function saveActiveChatId(id) {
  try {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_CHAT, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_CHAT);
    }
  } catch (err) {
    console.error('Failed to save active chat ID:', err);
  }
}

/**
 * Create a new chat object
 */
export function createNewChatObject(initialTitle = 'New Chat') {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    title: initialTitle,
    createdAt: now,
    updatedAt: now,
    messages: []
  };
}

/**
 * Load saved theme
 */
export function loadTheme() {
  try {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
  } catch {
    return 'dark';
  }
}

/**
 * Save theme preference
 */
export function saveTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch (err) {
    console.error('Failed to save theme:', err);
  }
}

/**
 * Load saved model preference
 */
export function loadSavedModel() {
  try {
    return localStorage.getItem(STORAGE_KEYS.MODEL) || '';
  } catch {
    return '';
  }
}

/**
 * Save model preference
 */
export function saveModel(model) {
  try {
    if (model) {
      localStorage.setItem(STORAGE_KEYS.MODEL, model);
    } else {
      localStorage.removeItem(STORAGE_KEYS.MODEL);
    }
  } catch (err) {
    console.error('Failed to save model:', err);
  }
}

/**
 * Clear all chats from localStorage
 */
export function clearAllChatsFromStorage() {
  try {
    localStorage.removeItem(STORAGE_KEYS.CHATS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_CHAT);
  } catch (err) {
    console.error('Failed to clear chats:', err);
  }
}
