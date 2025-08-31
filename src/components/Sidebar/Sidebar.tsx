import React from 'react';
import {WordDefinition} from '../../services/dictionaryService';
import {ChatMessage} from '../../services/geminiService';
import {settingsService} from '../../services/settingsService';
import ChatWindow from '../ChatWindow';
import useResizable from '../../hooks/useResizable';
import styles from './Sidebar.module.css';

interface SidebarProps {
  width: number;
  definition: WordDefinition | null;
  loading: boolean;
  error: string | null;
  hoveredWord: string | null;
  chatMessages: ChatMessage[];
  chatLoading: boolean;
  chatError: string | null;
  onSendMessage: (message: string) => void;
  onClearChat: () => void;
  onClearChatError: () => void;
  onOpenSettings: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  width,
  definition,
  loading,
  error,
  hoveredWord,
  chatMessages,
  chatLoading,
  chatError,
  onSendMessage,
  onClearChat,
  onClearChatError,
  onOpenSettings,
}) => {
  const {
    height: dictionaryHeight,
    isDragging,
    handleMouseDown,
  } = useResizable({
    initialHeight: window.innerHeight / 2,
    minHeight: 200,
    maxHeight: window.innerHeight - 200,
  });

  // Get current AI model information
  const settings = settingsService.loadSettings();
  const currentModel = settingsService
    .getAvailableModelsForProvider(settings.providerType)
    .find(model => model.id === settings.selectedModel);

  const baseModelName =
    currentModel?.name || settings.selectedModel || 'Unknown Model';
  const modelDisplayName =
    settings.providerType === 'ollama'
      ? `Ollama - ${baseModelName}`
      : baseModelName;

  return (
    <div className={styles.sidebar} style={{width: `${width}px`}}>
      <div
        className={styles.dictionarySection}
        style={{height: `${dictionaryHeight}px`}}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>Dictionary</h2>
        </div>

        <div className={styles.content}>
          {!hoveredWord && !loading && !error && (
            <div className={styles.placeholder}>
              <p>Hover over an English word to see its definition</p>
            </div>
          )}

          {loading && (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Loading definition...</p>
            </div>
          )}

          {error && hoveredWord && (
            <div className={styles.errorWithWord}>
              <div className={styles.searchedWord}>
                <h3 className={styles.word}>{hoveredWord}</h3>
              </div>
              <div className={styles.error}>
                <p>{error}</p>
              </div>
            </div>
          )}

          {definition && (
            <div className={styles.definitionContainer}>
              <div className={styles.wordHeader}>
                <h3 className={styles.word}>{definition.word}</h3>
                <div className={styles.wordMeta}>
                  {definition.phonetics && (
                    <span className={styles.phonetics}>
                      {definition.phonetics}
                    </span>
                  )}
                  {definition.partOfSpeech && (
                    <span className={styles.partOfSpeech}>
                      {definition.partOfSpeech}
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.definitions}>
                <h4 className={styles.definitionsTitle}>Definitions:</h4>
                {definition.definitions.map((def, index) => (
                  <div key={index} className={styles.definition}>
                    <span className={styles.definitionNumber}>
                      {index + 1}.
                    </span>
                    <span className={styles.definitionText}>{def}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        className={`${styles.resizeHandle} ${isDragging ? styles.dragging : ''}`}
        onMouseDown={handleMouseDown}
      >
        <div className={styles.resizeBar} />
      </div>

      <div className={styles.chatSection}>
        <div className={styles.chatHeader}>
          <div className={styles.aiModelInfo}>
            <span className={styles.aiModelLabel}>AI Model:</span>
            <span className={styles.aiModelName}>{modelDisplayName}</span>
          </div>
          <button
            className={styles.settingsButton}
            onClick={onOpenSettings}
            title="Settings"
          >
            ⚙️
          </button>
        </div>
        <ChatWindow
          messages={chatMessages}
          isLoading={chatLoading}
          error={chatError}
          onSendMessage={onSendMessage}
          onClearChat={onClearChat}
          onClearError={onClearChatError}
        />
      </div>
    </div>
  );
};

export default Sidebar;
