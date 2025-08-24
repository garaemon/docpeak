import React, {useState, useEffect} from 'react';
import {settingsService, AVAILABLE_GEMINI_MODELS} from '../../services/settingsService';
import {geminiService} from '../../services/geminiService';
import styles from './SettingsModal.module.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const currentSettings = settingsService.loadSettings();
      setApiKey(currentSettings.geminiApiKey);
      setSelectedModel(currentSettings.selectedModel);
      setValidationError(null);
      setIsSaved(false);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setValidationError('API key is required');
      return;
    }

    if (!apiKey.startsWith('AIza')) {
      setValidationError(
        'Invalid API key format. Gemini API keys should start with "AIza"',
      );
      return;
    }

    setIsValidating(true);
    setValidationError(null);

    try {
      const isValid = await geminiService.validateApiKey(apiKey.trim());

      if (!isValid) {
        setValidationError('Invalid API key. Please check and try again.');
        return;
      }

      settingsService.updateGeminiApiKey(apiKey.trim());
      setIsSaved(true);

      setTimeout(() => {
        onSave();
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Error validating API key:', error);
      setValidationError('Failed to validate API key. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleClose = () => {
    if (!isValidating) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={styles.modalOverlay}
      onClick={handleClose}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Settings</h2>
          <button
            className={styles.closeButton}
            onClick={handleClose}
            disabled={isValidating}
          >
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.formGroup}>
            <label htmlFor="apiKey" className={styles.label}>
              Gemini API Key
            </label>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="Enter your Gemini API key (starts with AIza...)"
              className={styles.input}
              disabled={isValidating}
            />
            <div className={styles.helpText}>
              Get your API key from{' '}
              <a
                href="https://makersuite.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                Google AI Studio
              </a>
            </div>
          </div>

          {validationError && (
            <div className={styles.errorMessage}>{validationError}</div>
          )}

          {isSaved && (
            <div className={styles.successMessage}>
              API key saved successfully!
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button
            className={styles.cancelButton}
            onClick={handleClose}
            disabled={isValidating}
          >
            Cancel
          </button>
          <button
            className={styles.saveButton}
            onClick={handleSave}
            disabled={isValidating || isSaved}
          >
            {isValidating ? (
              <>
                <span className={styles.spinner}></span>
                Validating...
              </>
            ) : isSaved ? (
              'Saved!'
            ) : (
              'Save'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
