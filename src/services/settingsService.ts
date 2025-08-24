export interface GeminiModel {
  id: string;
  name: string;
  description: string;
}

export const AVAILABLE_GEMINI_MODELS: GeminiModel[] = [
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    description: 'Fast and efficient model for quick responses',
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    description: 'More capable model for complex tasks',
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    description: 'Balanced performance and capability',
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

  clearSettings(): void {
    localStorage.removeItem(this.storageKey);
  }
}

export const settingsService = new SettingsService();
