import {promptService} from './promptService';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export class OllamaError extends Error {
  type: 'api_error' | 'no_endpoint' | 'network_error' | 'model_not_found';

  constructor(options: {message: string; type: OllamaError['type']}) {
    super(options.message);
    this.name = 'OllamaError';
    this.type = options.type;
  }
}

interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

class OllamaService {
  private endpoint: string | null = null;

  setEndpoint(endpoint: string): void {
    this.endpoint = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
  }

  private getEndpoint(): string {
    if (!this.endpoint) {
      throw new OllamaError({
        message: 'Ollama endpoint is not configured',
        type: 'no_endpoint',
      });
    }
    return this.endpoint;
  }

  async listModels(): Promise<string[]> {
    try {
      const endpoint = this.getEndpoint();

      console.log('Fetching Ollama models from:', `${endpoint}/api/tags`);

      const response = await fetch(`${endpoint}/api/tags`);

      console.log('List models response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('List models error response:', errorText);
        throw new Error(
          `HTTP ${response.status}: ${response.statusText} - ${errorText}`,
        );
      }

      const data = await response.json();
      console.log('Models data received:', data);

      const models =
        data.models?.map((model: {name: string}) => model.name) || [];
      console.log('Extracted model names:', models);

      return models;
    } catch (error: unknown) {
      console.error('Error listing Ollama models:', {
        error,
        errorType: typeof error,
        errorString: String(error),
      });

      const err = error as Error;
      if (
        err.message?.includes('NetworkError') ||
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('ECONNREFUSED') ||
        err.message?.includes('ENOTFOUND')
      ) {
        throw new OllamaError({
          message: `Cannot connect to Ollama server. Please check if Ollama is running and the endpoint is correct. Error: ${err.message}`,
          type: 'network_error',
        });
      }

      throw new OllamaError({
        message: `Failed to list models from Ollama: ${err.message || 'Unknown error'}`,
        type: 'api_error',
      });
    }
  }

  async sendMessage(
    message: string,
    model: string,
    pdfContext?: string,
  ): Promise<string> {
    const endpoint = this.getEndpoint();

    const prompt = promptService.buildPrompt(message, pdfContext);

    // Try the generate endpoint first
    try {
      return await this.sendGenerateMessage(endpoint, model, prompt);
    } catch (error) {
      const err = error as Error;
      // If generate endpoint fails with 404, try chat endpoint as fallback
      if (err.message?.includes('404') || err.message?.includes('Not Found')) {
        console.warn('Generate endpoint not available, trying chat endpoint');
        try {
          return await this.sendChatMessage(endpoint, model, prompt);
        } catch (chatError) {
          // If both endpoints fail, use error handling
          return await this.handleOllamaError(chatError, model);
        }
      }

      // Handle other errors
      return await this.handleOllamaError(error, model);
    }
  }

  private async sendGenerateMessage(
    endpoint: string,
    model: string,
    prompt: string,
  ): Promise<string> {
    const requestBody = {
      model,
      prompt,
      stream: false,
    };

    console.log('Attempting Ollama /api/generate request:', {
      endpoint: `${endpoint}/api/generate`,
      model,
      requestBody,
    });

    try {
      const response = await fetch(`${endpoint}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log(
        'Generate API response status:',
        response.status,
        response.statusText,
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Generate API error response:', errorText);
        throw new Error(
          `HTTP ${response.status}: ${response.statusText} - ${errorText}`,
        );
      }

      const data: OllamaResponse = await response.json();
      console.log(
        'Generate API success, response length:',
        data.response?.length || 0,
      );

      if (!data.response) {
        console.error('Generate API returned empty response:', data);
        throw new Error('Empty response from Ollama /api/generate endpoint');
      }

      return data.response;
    } catch (error) {
      console.error('Generate API request failed:', error);
      throw error;
    }
  }

  private async sendChatMessage(
    endpoint: string,
    model: string,
    prompt: string,
  ): Promise<string> {
    const requestBody = {
      model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      stream: false,
    };

    console.log('Attempting Ollama /api/chat request:', {
      endpoint: `${endpoint}/api/chat`,
      model,
      requestBody,
    });

    try {
      const response = await fetch(`${endpoint}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log(
        'Chat API response status:',
        response.status,
        response.statusText,
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Chat API error response:', errorText);
        throw new Error(
          `HTTP ${response.status}: ${response.statusText} - ${errorText}`,
        );
      }

      interface ChatResponse {
        model: string;
        created_at: string;
        message: {
          role: string;
          content: string;
        };
        done: boolean;
        total_duration?: number;
        load_duration?: number;
        prompt_eval_count?: number;
        prompt_eval_duration?: number;
        eval_count?: number;
        eval_duration?: number;
      }

      const data: ChatResponse = await response.json();
      console.log(
        'Chat API success, response length:',
        data.message?.content?.length || 0,
      );

      if (!data.message?.content) {
        console.error('Chat API returned empty response:', data);
        throw new Error('Empty response from Ollama /api/chat endpoint');
      }

      return data.message.content;
    } catch (error) {
      console.error('Chat API request failed:', error);
      throw error;
    }
  }

  private async handleOllamaError(
    error: unknown,
    model: string,
  ): Promise<never> {
    console.error('Detailed Ollama API error:', {
      error,
      model,
      errorType: typeof error,
      errorString: String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    const err = error as Error;

    // Enhanced error detection
    if (
      err.message?.toLowerCase().includes('model') &&
      (err.message?.toLowerCase().includes('not found') ||
        err.message?.toLowerCase().includes('not available'))
    ) {
      // Try to get available models to help user
      let availableModelsMessage = '';
      try {
        const availableModels = await this.listModels();
        if (availableModels.length > 0) {
          availableModelsMessage = ` Available models: ${availableModels.join(', ')}`;
        } else {
          availableModelsMessage =
            ' No models are currently installed. Please install a model first using "ollama pull <model-name>".';
        }
      } catch (listError) {
        console.warn('Could not fetch available models:', listError);
        availableModelsMessage =
          ' Could not fetch available models. Please check your Ollama installation.';
      }

      throw new OllamaError({
        message: `Model "${model}" not found. Please ensure the model is installed in Ollama.${availableModelsMessage} Error: ${err.message}`,
        type: 'model_not_found',
      });
    }

    if (
      err.message?.includes('NetworkError') ||
      err.message?.includes('Failed to fetch') ||
      err.message?.includes('fetch is not defined') ||
      err.message?.includes('ECONNREFUSED') ||
      err.message?.includes('ENOTFOUND')
    ) {
      throw new OllamaError({
        message: `Network error connecting to Ollama server. Please check if Ollama is running and accessible. Error: ${err.message}`,
        type: 'network_error',
      });
    }

    // Check for specific HTTP errors
    if (err.message?.includes('404')) {
      throw new OllamaError({
        message: `API endpoint not found. This may indicate an incompatible Ollama version. Error: ${err.message}`,
        type: 'api_error',
      });
    }

    if (err.message?.includes('500') || err.message?.includes('503')) {
      throw new OllamaError({
        message: `Ollama server error. The server may be overloaded or encountering issues. Error: ${err.message}`,
        type: 'api_error',
      });
    }

    throw new OllamaError({
      message: `Unexpected error communicating with Ollama: ${err.message || 'Unknown error'}`,
      type: 'api_error',
    });
  }

  async validateConnection(endpoint: string): Promise<boolean> {
    try {
      const testEndpoint = endpoint.endsWith('/')
        ? endpoint.slice(0, -1)
        : endpoint;

      console.log('Validating Ollama connection:', `${testEndpoint}/api/tags`);

      const response = await fetch(`${testEndpoint}/api/tags`);

      console.log('Connection validation response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Connection validation failed - response:', errorText);
      }

      return response.ok;
    } catch (error) {
      console.error('Ollama connection validation failed:', {
        endpoint,
        error,
        errorType: typeof error,
        errorString: String(error),
      });
      return false;
    }
  }

  isConfigured(): boolean {
    return this.endpoint !== null && this.endpoint.trim() !== '';
  }
}

export const ollamaService = new OllamaService();
