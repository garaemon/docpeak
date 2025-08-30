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

// Fallback models in case Ollama server is not reachable
export const FALLBACK_OLLAMA_MODELS: Model[] = [
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

export const DEFAULT_GEMINI_MODEL = AVAILABLE_GEMINI_MODELS[0];
export const DEFAULT_OLLAMA_MODEL = FALLBACK_OLLAMA_MODELS[0];

export interface AppSettings {
  geminiApiKey: string;
  selectedModel: string;
  providerType: ProviderType;
  ollamaEndpoint: string;
}

class SettingsService {
  private readonly storageKey = 'docpeak_settings';
  private cachedOllamaModels: Model[] | null = null;
  private lastOllamaFetch = 0;
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

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
    // Find the model in either Gemini models or cached Ollama models
    const geminiModel = AVAILABLE_GEMINI_MODELS.find(m => m.id === modelId);
    const ollamaModel =
      this.cachedOllamaModels?.find(m => m.id === modelId) ||
      FALLBACK_OLLAMA_MODELS.find(m => m.id === modelId);
    const model = geminiModel || ollamaModel;

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

    console.log('updateProviderType called:', {
      newProviderType: providerType,
      currentSettings,
    });

    // Don't automatically change the selected model when switching providers
    // Let the UI handle model selection based on available models
    this.saveSettings({
      ...currentSettings,
      providerType,
      // Keep the current selectedModel, the UI will update it if needed
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
    const providerType = this.getProviderType();

    // Check Gemini models
    const geminiModel = AVAILABLE_GEMINI_MODELS.find(
      model => model.id === modelId,
    );
    if (geminiModel) return geminiModel;

    // Check cached Ollama models
    const ollamaModel = this.cachedOllamaModels?.find(
      model => model.id === modelId,
    );
    if (ollamaModel) return ollamaModel;

    // Check fallback Ollama models
    const fallbackModel = FALLBACK_OLLAMA_MODELS.find(
      model => model.id === modelId,
    );
    if (fallbackModel) return fallbackModel;

    // Return default based on provider type
    return providerType === 'gemini'
      ? DEFAULT_GEMINI_MODEL
      : DEFAULT_OLLAMA_MODEL;
  }

  async getSelectedModelInfoAsync(): Promise<Model> {
    const modelId = this.getSelectedModel();
    const providerType = this.getProviderType();

    if (providerType === 'gemini') {
      return (
        AVAILABLE_GEMINI_MODELS.find(model => model.id === modelId) ||
        DEFAULT_GEMINI_MODEL
      );
    }

    const ollamaModels = await this.getOllamaModels();
    return (
      ollamaModels.find(model => model.id === modelId) ||
      ollamaModels[0] ||
      DEFAULT_OLLAMA_MODEL
    );
  }

  async getOllamaModels(): Promise<Model[]> {
    const now = Date.now();

    // Return cached models if they're still fresh
    if (
      this.cachedOllamaModels &&
      now - this.lastOllamaFetch < this.cacheTimeout
    ) {
      return this.cachedOllamaModels;
    }

    try {
      // Dynamically import ollamaService to avoid circular dependencies
      const {ollamaService} = await import('./ollamaService');

      const endpoint = this.getOllamaEndpoint();
      ollamaService.setEndpoint(endpoint);

      const modelNames = await ollamaService.listModels();

      const dynamicModels: Model[] = modelNames.map(modelName => ({
        id: modelName,
        name: this.formatModelName(modelName),
        description: `Ollama model: ${modelName}`,
        provider: 'ollama' as const,
      }));

      // Cache the results
      this.cachedOllamaModels = dynamicModels;
      this.lastOllamaFetch = now;

      return dynamicModels;
    } catch (error) {
      console.warn('Failed to fetch Ollama models, using fallbacks:', error);
      // Return fallback models if fetching fails
      return FALLBACK_OLLAMA_MODELS;
    }
  }

  private formatModelName(modelId: string): string {
    // Convert model IDs like "llama3:latest" to "Llama 3 (Latest)"
    const parts = modelId.split(':');
    const modelName = parts[0];
    const tag = parts[1] || 'latest';

    // Capitalize and format common model names
    const formatted = modelName
      .replace(/llama(\d+)/i, 'Llama $1')
      .replace(/mistral/i, 'Mistral')
      .replace(/codellama/i, 'Code Llama')
      .replace(/phi/i, 'Phi')
      .replace(/qwen/i, 'Qwen')
      .replace(/gemma/i, 'Gemma');

    return tag === 'latest' ? `${formatted} (Latest)` : `${formatted} (${tag})`;
  }

  getAvailableModelsForProvider(provider: ProviderType): Model[] {
    if (provider === 'gemini') {
      return AVAILABLE_GEMINI_MODELS;
    }

    // For Ollama, return cached models or fallback models
    return this.cachedOllamaModels || FALLBACK_OLLAMA_MODELS;
  }

  async getAvailableModelsForProviderAsync(
    provider: ProviderType,
  ): Promise<Model[]> {
    if (provider === 'gemini') {
      return AVAILABLE_GEMINI_MODELS;
    }

    return await this.getOllamaModels();
  }

  clearSettings(): void {
    localStorage.removeItem(this.storageKey);
  }
}

export const settingsService = new SettingsService();
