import React, {useState, useEffect} from 'react';
import {
  settingsService,
  ProviderType,
  Model,
} from '../../services/settingsService';
import {geminiService} from '../../services/geminiService';
import {ollamaService} from '../../services/ollamaService';
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
  const [providerType, setProviderType] = useState<ProviderType>('gemini');
  const [ollamaEndpoint, setOllamaEndpoint] = useState('');
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const loadModelsForProvider = async (provider: ProviderType) => {
    setIsLoadingModels(true);
    try {
      const models =
        await settingsService.getAvailableModelsForProviderAsync(provider);
      setAvailableModels(models);

      // Set the first model as selected if no current selection or if switching providers
      const currentSettings = settingsService.loadSettings();
      const currentModelExists = models.find(
        m => m.id === currentSettings.selectedModel,
      );
      if (!currentModelExists && models.length > 0) {
        setSelectedModel(models[0].id);
      }
    } catch (error) {
      console.error('Failed to load models:', error);
      // Use fallback models
      const fallbackModels =
        settingsService.getAvailableModelsForProvider(provider);
      setAvailableModels(fallbackModels);
      if (fallbackModels.length > 0) {
        setSelectedModel(fallbackModels[0].id);
      }
    } finally {
      setIsLoadingModels(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const currentSettings = settingsService.loadSettings();
      setApiKey(currentSettings.geminiApiKey);
      setSelectedModel(currentSettings.selectedModel);
      setProviderType(currentSettings.providerType);
      setOllamaEndpoint(currentSettings.ollamaEndpoint);
      setValidationError(null);
      setIsSaved(false);

      // Load models for the current provider
      void loadModelsForProvider(currentSettings.providerType);
    }
  }, [isOpen]);

  const handleProviderChange = (newProvider: ProviderType) => {
    setProviderType(newProvider);
    setValidationError(null);
    void loadModelsForProvider(newProvider);
  };

  const handleSave = async () => {
    if (providerType === 'gemini') {
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
    }

    if (providerType === 'ollama') {
      if (!ollamaEndpoint.trim()) {
        setValidationError('Ollama endpoint is required');
        return;
      }

      try {
        new URL(ollamaEndpoint);
      } catch (error) {
        setValidationError('Invalid endpoint URL format');
        return;
      }
    }

    setIsValidating(true);
    setValidationError(null);

    try {
      if (providerType === 'gemini') {
        const isValid = await geminiService.validateApiKey(apiKey.trim());
        if (!isValid) {
          setValidationError('Invalid API key. Please check and try again.');
          return;
        }
        settingsService.updateGeminiApiKey(apiKey.trim());
      }

      if (providerType === 'ollama') {
        const isValid = await ollamaService.validateConnection(
          ollamaEndpoint.trim(),
        );
        if (!isValid) {
          setValidationError(
            'Cannot connect to Ollama. Please check the endpoint and ensure Ollama is running.',
          );
          return;
        }
        ollamaService.setEndpoint(ollamaEndpoint.trim());
        settingsService.updateOllamaEndpoint(ollamaEndpoint.trim());
      }

      settingsService.updateSelectedModel(selectedModel);
      settingsService.updateProviderType(providerType);
      setIsSaved(true);

      setTimeout(() => {
        onSave();
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Error validating settings:', error);
      setValidationError('Failed to validate settings. Please try again.');
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
            <label htmlFor="providerType" className={styles.label}>
              AI Provider
            </label>
            <select
              id="providerType"
              value={providerType}
              onChange={e =>
                handleProviderChange(e.target.value as ProviderType)
              }
              className={styles.select}
              disabled={isValidating}
            >
              <option value="gemini">Google Gemini</option>
              <option value="ollama">Ollama (Local)</option>
            </select>
            <div className={styles.helpText}>
              {providerType === 'gemini'
                ? 'Cloud-based Google Gemini models'
                : 'Local AI models via Ollama'}
            </div>
          </div>

          {providerType === 'gemini' && (
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
          )}

          {providerType === 'ollama' && (
            <div className={styles.formGroup}>
              <label htmlFor="ollamaEndpoint" className={styles.label}>
                Ollama Endpoint
              </label>
              <input
                id="ollamaEndpoint"
                type="url"
                value={ollamaEndpoint}
                onChange={e => setOllamaEndpoint(e.target.value)}
                placeholder="http://localhost:11434"
                className={styles.input}
                disabled={isValidating}
              />
              <div className={styles.helpText}>
                Make sure Ollama is running on your system. Install from{' '}
                <a
                  href="https://ollama.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.link}
                >
                  ollama.ai
                </a>
              </div>
            </div>
          )}

          <div className={styles.formGroup}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <label htmlFor="selectedModel" className={styles.label}>
                AI Model
              </label>
              {providerType === 'ollama' && (
                <button
                  type="button"
                  onClick={() => loadModelsForProvider('ollama')}
                  disabled={isLoadingModels || isValidating}
                  className={styles.refreshButton}
                  title="Refresh model list"
                >
                  {isLoadingModels ? '⟳' : '↻'}
                </button>
              )}
            </div>
            <select
              id="selectedModel"
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
              className={styles.select}
              disabled={isValidating || isLoadingModels}
            >
              {isLoadingModels ? (
                <option value="">Loading models...</option>
              ) : (
                availableModels.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))
              )}
            </select>
            <div className={styles.helpText}>
              {isLoadingModels
                ? 'Loading available models...'
                : availableModels.find(m => m.id === selectedModel)
                    ?.description || 'No description available'}
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
