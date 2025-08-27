import {useState, useCallback} from 'react';
import {geminiService, GeminiError} from '../services/geminiService';
import {
  ollamaService,
  OllamaError,
  ChatMessage,
} from '../services/ollamaService';
import {settingsService} from '../services/settingsService';

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (message: string, pdfContext?: string) => Promise<void>;
  clearChat: () => void;
  clearError: () => void;
}

export const useChat = (): UseChatReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (message: string, pdfContext?: string) => {
      if (!message.trim()) return;

      setIsLoading(true);
      setError(null);

      const userMessage: ChatMessage = {
        role: 'user',
        content: message.trim(),
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, userMessage]);

      try {
        const providerType = settingsService.getProviderType();
        let response: string;

        if (providerType === 'gemini') {
          response = await geminiService.sendMessage(
            message.trim(),
            pdfContext,
          );
        } else {
          const selectedModel = settingsService.getSelectedModel();
          const ollamaEndpoint = settingsService.getOllamaEndpoint();
          ollamaService.setEndpoint(ollamaEndpoint);
          response = await ollamaService.sendMessage(
            message.trim(),
            selectedModel,
            pdfContext,
          );
        }

        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response,
          timestamp: Date.now(),
        };

        setMessages(prev => [...prev, assistantMessage]);
      } catch (err: unknown) {
        let errorMessage = 'Failed to get response from AI';

        if (err instanceof Error && 'type' in err) {
          const errorWithType = err as unknown as GeminiError | OllamaError;

          if (
            errorWithType instanceof GeminiError ||
            (errorWithType as any).name === 'GeminiError'
          ) {
            const geminiError = errorWithType as GeminiError;
            switch (geminiError.type) {
              case 'no_api_key':
                errorMessage =
                  'Please configure your Gemini API key in settings';
                break;
              case 'invalid_key':
                errorMessage = 'Invalid API key. Please check your settings';
                break;
              case 'network_error':
                errorMessage = 'Network error. Please check your connection';
                break;
              default:
                errorMessage = geminiError.message;
            }
          } else if (
            errorWithType instanceof OllamaError ||
            (errorWithType as any).name === 'OllamaError'
          ) {
            const ollamaError = errorWithType as OllamaError;
            switch (ollamaError.type) {
              case 'no_endpoint':
                errorMessage =
                  'Please configure your Ollama endpoint in settings';
                break;
              case 'model_not_found':
                errorMessage =
                  'Selected model not found. Please install the model in Ollama';
                break;
              case 'network_error':
                errorMessage =
                  'Cannot connect to Ollama. Please ensure Ollama is running';
                break;
              default:
                errorMessage = ollamaError.message;
            }
          } else if (
            errorWithType &&
            typeof errorWithType === 'object' &&
            'message' in errorWithType
          ) {
            errorMessage = (errorWithType as Error).message;
          }
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }

        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
    clearError,
  };
};
