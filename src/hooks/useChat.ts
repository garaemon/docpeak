import {useState, useCallback} from 'react';
import {
  geminiService,
  ChatMessage,
  GeminiError,
} from '../services/geminiService';

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
        const response = await geminiService.sendMessage(
          message.trim(),
          pdfContext,
        );

        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response,
          timestamp: Date.now(),
        };

        setMessages(prev => [...prev, assistantMessage]);
      } catch (err: unknown) {
        let errorMessage = 'Failed to get response from AI';

        if (err instanceof Error && 'type' in err) {
          const geminiError = err as unknown as GeminiError;
          switch (geminiError.type) {
            case 'no_api_key':
              errorMessage = 'Please configure your Gemini API key in settings';
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
