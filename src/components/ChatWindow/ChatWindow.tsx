import React, {useState, useRef, useEffect} from 'react';
import {ChatMessage} from '../../services/geminiService';
import MarkdownRenderer from '../MarkdownRenderer';
import styles from './ChatWindow.module.css';

interface ChatWindowProps {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  onSendMessage: (message: string) => void;
  onClearChat: () => void;
  onClearError: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  isLoading,
  error,
  onSendMessage,
  onClearChat,
  onClearError,
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Only send message when not in IME composition
      if (e.nativeEvent.isComposing) {
        return;
      }
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={styles.chatWindow}>
      <div className={styles.header}>
        <h3 className={styles.title}>AI Assistant</h3>
        <button
          onClick={onClearChat}
          className={styles.clearButton}
          disabled={messages.length === 0 || isLoading}
        >
          Clear
        </button>
      </div>

      <div className={styles.messagesContainer}>
        {messages.length === 0 && !error && (
          <div className={styles.emptyState}>
            <p>Ask questions about English or the PDF content!</p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`${styles.message} ${
              message.role === 'user'
                ? styles.userMessage
                : styles.assistantMessage
            }`}
          >
            <div className={styles.messageContent}>
              <div className={styles.messageText}>
                {message.role === 'user' ? (
                  message.content.split('\n').map((line, lineIndex) => (
                    <React.Fragment key={lineIndex}>
                      {line}
                      {lineIndex < message.content.split('\n').length - 1 && (
                        <br />
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <MarkdownRenderer
                    content={message.content}
                    className={styles.markdownContent}
                  />
                )}
              </div>
              <div className={styles.messageTime}>
                {formatTimestamp(message.timestamp)}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className={`${styles.message} ${styles.assistantMessage}`}>
            <div className={styles.messageContent}>
              <div className={styles.loadingIndicator}>
                <div className={styles.typingDots}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span>AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className={styles.errorContainer}>
            <div className={styles.errorMessage}>
              <span className={styles.errorText}>{error}</span>
              <button
                onClick={onClearError}
                className={styles.errorCloseButton}
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className={styles.inputForm}>
        <div className={styles.inputContainer}>
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about English or the PDF content..."
            className={styles.messageInput}
            rows={2}
            disabled={isLoading}
          />
          <button
            type="submit"
            className={styles.sendButton}
            disabled={!inputValue.trim() || isLoading}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;
