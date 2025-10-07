import { useState, useCallback } from 'react';

export interface StatusMessage {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  autoHide?: boolean;
  autoHideDelay?: number;
}

export function useStatusMessage() {
  const [messages, setMessages] = useState<StatusMessage[]>([]);

  const addMessage = useCallback((message: Omit<StatusMessage, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newMessage: StatusMessage = {
      id,
      autoHide: true,
      autoHideDelay: 5000,
      ...message
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Auto-hide se configurado
    if (newMessage.autoHide) {
      setTimeout(() => {
        removeMessage(id);
      }, newMessage.autoHideDelay);
    }
    
    return id;
  }, []);

  const removeMessage = useCallback((id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  }, []);

  const clearAllMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const showSuccess = useCallback((message: string, autoHide = true) => {
    return addMessage({ type: 'success', message, autoHide });
  }, [addMessage]);

  const showWarning = useCallback((message: string, autoHide = true) => {
    return addMessage({ type: 'warning', message, autoHide });
  }, [addMessage]);

  const showError = useCallback((message: string, autoHide = false) => {
    return addMessage({ type: 'error', message, autoHide });
  }, [addMessage]);

  const showInfo = useCallback((message: string, autoHide = true) => {
    return addMessage({ type: 'info', message, autoHide });
  }, [addMessage]);

  return {
    messages,
    addMessage,
    removeMessage,
    clearAllMessages,
    showSuccess,
    showWarning,
    showError,
    showInfo
  };
}
