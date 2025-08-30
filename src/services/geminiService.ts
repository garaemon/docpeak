import {GoogleGenerativeAI} from '@google/generative-ai';
import {settingsService} from './settingsService';
import {promptService} from './promptService';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export class GeminiError extends Error {
  type: 'api_error' | 'no_api_key' | 'invalid_key' | 'network_error';

  constructor(options: {message: string; type: GeminiError['type']}) {
    super(options.message);
    this.name = 'GeminiError';
    this.type = options.type;
  }
}

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;

  initializeWithApiKey(apiKey: string): void {
    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
    } catch (error) {
      console.error('Failed to initialize Gemini AI:', error);
      this.genAI = null;
      throw new Error('Invalid API key format');
    }
  }

  private getInitializedClient(): GoogleGenerativeAI {
    const apiKey = settingsService.getGeminiApiKey();
    if (!apiKey) {
      throw new GeminiError({
        message: 'Gemini API key is not configured',
        type: 'no_api_key',
      });
    }

    if (!this.genAI) {
      this.initializeWithApiKey(apiKey);
    }

    if (!this.genAI) {
      throw new GeminiError({
        message: 'Failed to initialize Gemini client',
        type: 'invalid_key',
      });
    }

    return this.genAI;
  }

  async sendMessage(message: string, pdfContext?: string): Promise<string> {
    try {
      const genAI = this.getInitializedClient();
      const selectedModelId = settingsService.getSelectedModel();
      const model = genAI.getGenerativeModel({model: selectedModelId});

      const prompt = promptService.buildPrompt(message, pdfContext);

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error('Empty response from Gemini API');
      }

      return text;
    } catch (error: unknown) {
      console.error('Gemini API error:', error);

      const err = error as Error;
      if (err.message?.includes('API_KEY_INVALID')) {
        throw new GeminiError({
          message: 'Invalid API key. Please check your Gemini API key.',
          type: 'invalid_key',
        });
      }

      if (err.message?.includes('NETWORK')) {
        throw new GeminiError({
          message: 'Network error. Please check your internet connection.',
          type: 'network_error',
        });
      }

      throw new GeminiError({
        message: err.message || 'Failed to get response from Gemini API',
        type: 'api_error',
      });
    }
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const tempGenAI = new GoogleGenerativeAI(apiKey);
      const model = tempGenAI.getGenerativeModel({model: 'gemini-1.5-flash'});

      const result = await model.generateContent('Hello');
      await result.response;
      return true;
    } catch (error) {
      console.error('API key validation failed:', error);
      return false;
    }
  }

  isConfigured(): boolean {
    return settingsService.hasValidGeminiApiKey();
  }
}

export const geminiService = new GeminiService();
