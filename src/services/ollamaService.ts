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
      const response = await fetch(`${endpoint}/api/tags`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.models?.map((model: any) => model.name) || [];
    } catch (error: unknown) {
      console.error('Error listing Ollama models:', error);

      const err = error as Error;
      if (
        err.message?.includes('NetworkError') ||
        err.message?.includes('Failed to fetch')
      ) {
        throw new OllamaError({
          message:
            'Cannot connect to Ollama. Please check if Ollama is running and the endpoint is correct.',
          type: 'network_error',
        });
      }

      throw new OllamaError({
        message: err.message || 'Failed to list models from Ollama',
        type: 'api_error',
      });
    }
  }

  async sendMessage(
    message: string,
    model: string,
    pdfContext?: string,
  ): Promise<string> {
    try {
      const endpoint = this.getEndpoint();

      let prompt = message;
      if (pdfContext) {
        prompt = `PDF Context:\n${pdfContext.slice(0, 3000)}\n\nUser Question:\n${message}\n\nPlease answer the question based on the PDF content if relevant, or provide general English learning help if the question is not related to the PDF content.`;
      } else {
        prompt = `User Question:\n${message}\n\nPlease provide helpful English learning assistance.`;
      }

      const requestBody = {
        model,
        prompt,
        stream: false,
      };

      const response = await fetch(`${endpoint}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: OllamaResponse = await response.json();

      if (!data.response) {
        throw new Error('Empty response from Ollama API');
      }

      return data.response;
    } catch (error: unknown) {
      console.error('Ollama API error:', error);

      const err = error as Error;
      if (
        err.message?.includes('model') &&
        err.message?.includes('not found')
      ) {
        throw new OllamaError({
          message: `Model "${model}" not found. Please ensure the model is installed in Ollama.`,
          type: 'model_not_found',
        });
      }

      if (
        err.message?.includes('NetworkError') ||
        err.message?.includes('Failed to fetch')
      ) {
        throw new OllamaError({
          message:
            'Network error. Please check if Ollama is running and accessible.',
          type: 'network_error',
        });
      }

      throw new OllamaError({
        message: err.message || 'Failed to get response from Ollama API',
        type: 'api_error',
      });
    }
  }

  async validateConnection(endpoint: string): Promise<boolean> {
    try {
      const testEndpoint = endpoint.endsWith('/')
        ? endpoint.slice(0, -1)
        : endpoint;
      const response = await fetch(`${testEndpoint}/api/tags`);
      return response.ok;
    } catch (error) {
      console.error('Ollama connection validation failed:', error);
      return false;
    }
  }

  isConfigured(): boolean {
    return this.endpoint !== null && this.endpoint.trim() !== '';
  }
}

export const ollamaService = new OllamaService();
