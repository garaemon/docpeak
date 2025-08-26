export interface GeminiModel {
  id: string;
  name: string;
  description: string;
}

export const AVAILABLE_GEMINI_MODELS: GeminiModel[] = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Fast and efficient model with improved performance',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    description: 'Most capable model for complex reasoning tasks',
  },
];

export const DEFAULT_GEMINI_MODEL = AVAILABLE_GEMINI_MODELS[0];

export interface AppSettings {
  geminiApiKey: string;
  selectedModel: string;
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
        };
      }
    } catch (error) {
      console.warn('Failed to load settings from storage:', error);
    }

    return {
      geminiApiKey: '',
      selectedModel: DEFAULT_GEMINI_MODEL.id,
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
    this.saveSettings({
      ...currentSettings,
      selectedModel: modelId,
    });
  }

  getSelectedModelInfo(): GeminiModel {
    const modelId = this.getSelectedModel();
    return (
      AVAILABLE_GEMINI_MODELS.find(model => model.id === modelId) ||
      DEFAULT_GEMINI_MODEL
    );
  }

  clearSettings(): void {
    localStorage.removeItem(this.storageKey);
  }
}

export const settingsService = new SettingsService();
