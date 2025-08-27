export type ProviderType = 'gemini' | 'ollama';

export interface Model {
  id: string;
  name: string;
  description: string;
  provider: ProviderType;
}

export const AVAILABLE_GEMINI_MODELS: Model[] = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Fast and efficient model with improved performance',
    provider: 'gemini',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    description: 'Most capable model for complex reasoning tasks',
    provider: 'gemini',
  },
];

export const AVAILABLE_OLLAMA_MODELS: Model[] = [
  {
    id: 'llama3:latest',
    name: 'Llama 3 (Latest)',
    description: "Meta's Llama 3 model (requires local installation)",
    provider: 'ollama',
  },
  {
    id: 'mistral:latest',
    name: 'Mistral (Latest)',
    description: 'Mistral AI model (requires local installation)',
    provider: 'ollama',
  },
  {
    id: 'codellama:latest',
    name: 'Code Llama (Latest)',
    description:
      'Specialized for code generation (requires local installation)',
    provider: 'ollama',
  },
];

export const ALL_AVAILABLE_MODELS = [
  ...AVAILABLE_GEMINI_MODELS,
  ...AVAILABLE_OLLAMA_MODELS,
];

export const DEFAULT_GEMINI_MODEL = AVAILABLE_GEMINI_MODELS[0];
export const DEFAULT_OLLAMA_MODEL = AVAILABLE_OLLAMA_MODELS[0];

export interface AppSettings {
  geminiApiKey: string;
  selectedModel: string;
  providerType: ProviderType;
  ollamaEndpoint: string;
}

class SettingsService {
  private readonly storageKey = 'docpeak_settings';

  loadSettings(): AppSettings {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          geminiApiKey: parsed.geminiApiKey || '',
          selectedModel: parsed.selectedModel || DEFAULT_GEMINI_MODEL.id,
          providerType: parsed.providerType || 'gemini',
          ollamaEndpoint: parsed.ollamaEndpoint || 'http://localhost:11434',
        };
      }
    } catch (error) {
      console.warn('Failed to load settings from storage:', error);
    }

    return {
      geminiApiKey: '',
      selectedModel: DEFAULT_GEMINI_MODEL.id,
      providerType: 'gemini',
      ollamaEndpoint: 'http://localhost:11434',
    };
  }

  saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings to storage:', error);
      throw new Error('Failed to save settings');
    }
  }

  updateGeminiApiKey(apiKey: string): void {
    const currentSettings = this.loadSettings();
    this.saveSettings({
      ...currentSettings,
      geminiApiKey: apiKey,
    });
  }

  getGeminiApiKey(): string {
    const settings = this.loadSettings();
    return settings.geminiApiKey;
  }

  hasValidGeminiApiKey(): boolean {
    const apiKey = this.getGeminiApiKey();
    return apiKey.length > 0 && apiKey.startsWith('AIza');
  }

  getSelectedModel(): string {
    const settings = this.loadSettings();
    return settings.selectedModel;
  }

  updateSelectedModel(modelId: string): void {
    const currentSettings = this.loadSettings();
    const model = ALL_AVAILABLE_MODELS.find(m => m.id === modelId);
    this.saveSettings({
      ...currentSettings,
      selectedModel: modelId,
      providerType: model?.provider || currentSettings.providerType,
    });
  }

  getProviderType(): ProviderType {
    const settings = this.loadSettings();
    return settings.providerType;
  }

  updateProviderType(providerType: ProviderType): void {
    const currentSettings = this.loadSettings();
    const defaultModel =
      providerType === 'gemini' ? DEFAULT_GEMINI_MODEL : DEFAULT_OLLAMA_MODEL;
    this.saveSettings({
      ...currentSettings,
      providerType,
      selectedModel: defaultModel.id,
    });
  }

  getOllamaEndpoint(): string {
    const settings = this.loadSettings();
    return settings.ollamaEndpoint;
  }

  updateOllamaEndpoint(endpoint: string): void {
    const currentSettings = this.loadSettings();
    this.saveSettings({
      ...currentSettings,
      ollamaEndpoint: endpoint,
    });
  }

  getSelectedModelInfo(): Model {
    const modelId = this.getSelectedModel();
    return (
      ALL_AVAILABLE_MODELS.find(model => model.id === modelId) ||
      DEFAULT_GEMINI_MODEL
    );
  }

  getAvailableModelsForProvider(provider: ProviderType): Model[] {
    return ALL_AVAILABLE_MODELS.filter(model => model.provider === provider);
  }

  clearSettings(): void {
    localStorage.removeItem(this.storageKey);
  }
}

export const settingsService = new SettingsService();
