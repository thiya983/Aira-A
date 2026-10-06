import { useState, useEffect, useRef, useCallback } from 'react';
import {
  loadChats,
  saveChats,
  getActiveChatId,
  saveActiveChatId,
  createNewChatObject,
  generateId,
  generateChatTitle,
  loadSavedModel,
  saveModel
} from '../utils/storage';

export function useChat() {
  const [chats, setChats] = useState(() => loadChats());
  const [activeChatId, setActiveChatId] = useState(() => getActiveChatId());
  const [selectedModel, setSelectedModel] = useState(() => loadSavedModel());
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);

  const abortControllerRef = useRef(null);
  const streamingTextRef = useRef('');

  // Persist chats whenever they change
  useEffect(() => {
    saveChats(chats);
  }, [chats]);

  // Persist activeChatId
  useEffect(() => {
    saveActiveChatId(activeChatId);
  }, [activeChatId]);

  // Persist selected model
  useEffect(() => {
    saveModel(selectedModel);
  }, [selectedModel]);

  // Ensure active chat exists or fallback to first chat / null
  useEffect(() => {
    if (activeChatId && !chats.some(c => c.id === activeChatId)) {
      if (chats.length > 0) {
        setActiveChatId(chats[0].id);
      } else {
        setActiveChatId(null);
      }
    }
  }, [chats, activeChatId]);

  const activeChat = chats.find(c => c.id === activeChatId) || null;

  // Filtered chats based on search query
  const filteredChats = chats.filter(chat => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = chat.title?.toLowerCase().includes(q);
    const contentMatch = chat.messages?.some(m => m.content?.toLowerCase().includes(q));
    return titleMatch || contentMatch;
  });

  /**
   * Create a new blank chat
   */
  const createNewChat = useCallback(() => {
    if (isGenerating) {
      stopGeneration();
    }
    const newChat = createNewChatObject('New Chat');
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setStreamingContent('');
    setErrorMessage(null);
    return newChat.id;
  }, [isGenerating]);

  /**
   * Select a chat
   */
  const selectChat = useCallback((id) => {
    if (isGenerating) {
      stopGeneration();
    }
    setActiveChatId(id);
    setStreamingContent('');
    setErrorMessage(null);
  }, [isGenerating]);

  /**
   * Rename an existing chat
   */
  const renameChat = useCallback((id, newTitle) => {
    if (!newTitle || !newTitle.trim()) return;
    setChats(prev => prev.map(chat => {
      if (chat.id === id) {
        return { ...chat, title: newTitle.trim(), updatedAt: new Date().toISOString() };
      }
      return chat;
    }));
  }, []);

  /**
   * Delete a chat
   */
  const deleteChat = useCallback((id) => {
    if (isGenerating && activeChatId === id) {
      stopGeneration();
    }
    setChats(prev => {
      const remaining = prev.filter(c => c.id !== id);
      if (activeChatId === id) {
        const nextActive = remaining.length > 0 ? remaining[0].id : null;
        setActiveChatId(nextActive);
      }
      return remaining;
    });
  }, [activeChatId, isGenerating]);

  /**
   * Clear current chat messages
   */
  const clearCurrentChat = useCallback(() => {
    if (!activeChatId) return;
    if (isGenerating) {
      stopGeneration();
    }
    setChats(prev => prev.map(chat => {
      if (chat.id === activeChatId) {
        return {
          ...chat,
          messages: [],
          updatedAt: new Date().toISOString()
        };
      }
      return chat;
    }));
    setStreamingContent('');
    setErrorMessage(null);
  }, [activeChatId, isGenerating]);

  /**
   * Stop generation
   */
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // If there is accumulated text, save it as an assistant message
    const currentStreaming = streamingTextRef.current;
    if (currentStreaming.trim() && activeChatId) {
      const assistantMessage = {
        id: generateId(),
        role: 'assistant',
        content: currentStreaming,
        timestamp: new Date().toISOString(),
        interrupted: true
      };

      setChats(prev => prev.map(chat => {
        if (chat.id === activeChatId) {
          return {
            ...chat,
            messages: [...chat.messages, assistantMessage],
            updatedAt: new Date().toISOString()
          };
        }
        return chat;
      }));
    }

    setIsGenerating(false);
    setStreamingContent('');
    streamingTextRef.current = '';
  }, [activeChatId]);

  /**
   * Send a message and stream the response
   */
  const sendMessage = useCallback(async (content, overrideChatId = null) => {
    if (!content || !content.trim() || isGenerating) return;

    setErrorMessage(null);
    let targetChatId = overrideChatId || activeChatId;
    let currentChat = chats.find(c => c.id === targetChatId);

    // If no active chat, create one now
    if (!currentChat) {
      const newChat = createNewChatObject(generateChatTitle(content));
      targetChatId = newChat.id;
      currentChat = newChat;
      setChats(prev => [newChat, ...prev]);
      setActiveChatId(targetChatId);
    }

    const isFirstMessage = currentChat.messages.length === 0;
    const userMessage = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString()
    };

    // Update chat with user message and title if first message
    const updatedMessages = [...currentChat.messages, userMessage];
    const newTitle = isFirstMessage ? generateChatTitle(content) : currentChat.title;

    setChats(prev => prev.map(chat => {
      if (chat.id === targetChatId) {
        return {
          ...chat,
          title: newTitle,
          messages: updatedMessages,
          updatedAt: new Date().toISOString()
        };
      }
      return chat;
    }));

    // Start streaming
    setIsGenerating(true);
    setStreamingContent('');
    streamingTextRef.current = '';

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const apiMessages = updatedMessages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: apiMessages,
          model: selectedModel || undefined
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        let errMessage = 'Unable to connect to Ollama. Please start Ollama and try again.';
        try {
          const errData = await res.json();
          errMessage = errData.error || errMessage;
        } catch {}
        throw new Error(errMessage);
      }

      // Read SSE stream
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;

          const jsonStr = trimmed.replace(/^data:\s*/, '');
          if (!jsonStr) continue;

          try {
            const data = JSON.parse(jsonStr);

            if (data.type === 'chunk' && data.content) {
              accumulated += data.content;
              streamingTextRef.current = accumulated;
              setStreamingContent(accumulated);
            } else if (data.type === 'error') {
              throw new Error(data.error);
            }
          } catch (jsonErr) {
            // Ignore parse errors on individual non-json lines
          }
        }
      }

      // Finish streaming and append complete assistant message
      if (accumulated.trim()) {
        const assistantMessage = {
          id: generateId(),
          role: 'assistant',
          content: accumulated,
          timestamp: new Date().toISOString()
        };

        setChats(prev => prev.map(chat => {
          if (chat.id === targetChatId) {
            return {
              ...chat,
              messages: [...chat.messages, assistantMessage],
              updatedAt: new Date().toISOString()
            };
          }
          return chat;
        }));
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        // Handled cleanly by stopGeneration
        return;
      }

      const displayError = err.message || 'Unable to connect to Ollama. Please start Ollama and try again.';
      setErrorMessage(displayError);

      // Append error message to chat so user has clear contextual feedback
      const errorAssistantMessage = {
        id: generateId(),
        role: 'assistant',
        content: `⚠️ **Aira AI Error**: ${displayError}`,
        timestamp: new Date().toISOString(),
        isError: true
      };

      setChats(prev => prev.map(chat => {
        if (chat.id === targetChatId) {
          return {
            ...chat,
            messages: [...chat.messages, errorAssistantMessage],
            updatedAt: new Date().toISOString()
          };
        }
        return chat;
      }));
    } finally {
      setIsGenerating(false);
      setStreamingContent('');
      streamingTextRef.current = '';
      abortControllerRef.current = null;
    }
  }, [activeChatId, chats, isGenerating, selectedModel, stopGeneration]);

  /**
   * Regenerate response for a given assistant message
   */
  const regenerateResponse = useCallback(async (messageId) => {
    if (!activeChat || isGenerating) return;

    const messageIndex = activeChat.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    // Slice all messages prior to this assistant response
    const priorMessages = activeChat.messages.slice(0, messageIndex);
    const lastUserMessage = [...priorMessages].reverse().find(m => m.role === 'user');

    if (!lastUserMessage) return;

    // Truncate chat messages to prior messages
    setChats(prev => prev.map(chat => {
      if (chat.id === activeChat.id) {
        return {
          ...chat,
          messages: priorMessages,
          updatedAt: new Date().toISOString()
        };
      }
      return chat;
    }));

    // Start streaming for priorMessages
    setIsGenerating(true);
    setStreamingContent('');
    streamingTextRef.current = '';
    setErrorMessage(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const apiMessages = priorMessages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: apiMessages,
          model: selectedModel || undefined
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        let errMessage = 'Unable to connect to Ollama. Please start Ollama and try again.';
        try {
          const errData = await res.json();
          errMessage = errData.error || errMessage;
        } catch {}
        throw new Error(errMessage);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const jsonStr = trimmed.replace(/^data:\s*/, '');
          if (!jsonStr) continue;

          try {
            const data = JSON.parse(jsonStr);
            if (data.type === 'chunk' && data.content) {
              accumulated += data.content;
              streamingTextRef.current = accumulated;
              setStreamingContent(accumulated);
            } else if (data.type === 'error') {
              throw new Error(data.error);
            }
          } catch {}
        }
      }

      if (accumulated.trim()) {
        const newAssistantMessage = {
          id: generateId(),
          role: 'assistant',
          content: accumulated,
          timestamp: new Date().toISOString()
        };

        setChats(prev => prev.map(chat => {
          if (chat.id === activeChat.id) {
            return {
              ...chat,
              messages: [...chat.messages, newAssistantMessage],
              updatedAt: new Date().toISOString()
            };
          }
          return chat;
        }));
      }
    } catch (err) {
      if (err.name === 'AbortError') return;

      const displayError = err.message || 'Unable to connect to Ollama. Please start Ollama and try again.';
      setErrorMessage(displayError);

      const errorAssistantMessage = {
        id: generateId(),
        role: 'assistant',
        content: `⚠️ **Aira AI Error**: ${displayError}`,
        timestamp: new Date().toISOString(),
        isError: true
      };

      setChats(prev => prev.map(chat => {
        if (chat.id === activeChat.id) {
          return {
            ...chat,
            messages: [...chat.messages, errorAssistantMessage],
            updatedAt: new Date().toISOString()
          };
        }
        return chat;
      }));
    } finally {
      setIsGenerating(false);
      setStreamingContent('');
      streamingTextRef.current = '';
      abortControllerRef.current = null;
    }
  }, [activeChat, isGenerating, selectedModel]);

  /**
   * Edit a previous user message, remove all subsequent messages, and regenerate
   */
  const editAndResend = useCallback(async (messageId, newContent) => {
    if (!activeChat || isGenerating || !newContent.trim()) return;

    const messageIndex = activeChat.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    // Messages prior to the edited message
    const priorMessages = activeChat.messages.slice(0, messageIndex);
    const updatedUserMessage = {
      ...activeChat.messages[messageIndex],
      content: newContent.trim(),
      timestamp: new Date().toISOString(),
      edited: true
    };

    const messagesToSend = [...priorMessages, updatedUserMessage];

    // Truncate chat messages to this point
    setChats(prev => prev.map(chat => {
      if (chat.id === activeChat.id) {
        return {
          ...chat,
          messages: messagesToSend,
          updatedAt: new Date().toISOString()
        };
      }
      return chat;
    }));

    // Start streaming from this point
    setIsGenerating(true);
    setStreamingContent('');
    streamingTextRef.current = '';
    setErrorMessage(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const apiMessages = messagesToSend.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: apiMessages,
          model: selectedModel || undefined
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        let errMessage = 'Unable to connect to Ollama. Please start Ollama and try again.';
        try {
          const errData = await res.json();
          errMessage = errData.error || errMessage;
        } catch {}
        throw new Error(errMessage);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const jsonStr = trimmed.replace(/^data:\s*/, '');
          if (!jsonStr) continue;

          try {
            const data = JSON.parse(jsonStr);
            if (data.type === 'chunk' && data.content) {
              accumulated += data.content;
              streamingTextRef.current = accumulated;
              setStreamingContent(accumulated);
            } else if (data.type === 'error') {
              throw new Error(data.error);
            }
          } catch {}
        }
      }

      if (accumulated.trim()) {
        const newAssistantMessage = {
          id: generateId(),
          role: 'assistant',
          content: accumulated,
          timestamp: new Date().toISOString()
        };

        setChats(prev => prev.map(chat => {
          if (chat.id === activeChat.id) {
            return {
              ...chat,
              messages: [...chat.messages, newAssistantMessage],
              updatedAt: new Date().toISOString()
            };
          }
          return chat;
        }));
      }
    } catch (err) {
      if (err.name === 'AbortError') return;

      const displayError = err.message || 'Unable to connect to Ollama. Please start Ollama and try again.';
      setErrorMessage(displayError);

      const errorAssistantMessage = {
        id: generateId(),
        role: 'assistant',
        content: `⚠️ **Aira AI Error**: ${displayError}`,
        timestamp: new Date().toISOString(),
        isError: true
      };

      setChats(prev => prev.map(chat => {
        if (chat.id === activeChat.id) {
          return {
            ...chat,
            messages: [...chat.messages, errorAssistantMessage],
            updatedAt: new Date().toISOString()
          };
        }
        return chat;
      }));
    } finally {
      setIsGenerating(false);
      setStreamingContent('');
      streamingTextRef.current = '';
      abortControllerRef.current = null;
    }
  }, [activeChat, isGenerating, selectedModel]);

  return {
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
    errorMessage,
    setErrorMessage,
    createNewChat,
    selectChat,
    renameChat,
    deleteChat,
    clearCurrentChat,
    sendMessage,
    stopGeneration,
    regenerateResponse,
    editAndResend
  };
}
