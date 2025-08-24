export interface AppSettings {
  geminiApiKey: string;
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
        };
      }
    } catch (error) {
      console.warn('Failed to load settings from storage:', error);
    }

    return {
      geminiApiKey: '',
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
