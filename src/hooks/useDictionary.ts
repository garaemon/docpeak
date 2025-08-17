import {useState, useCallback} from 'react';
import {dictionaryService, WordDefinition} from '../services/dictionaryService';

interface DictionaryState {
  definition: WordDefinition | null;
  loading: boolean;
  error: string | null;
}

export const useDictionary = () => {
  const [state, setState] = useState<DictionaryState>({
    definition: null,
    loading: false,
    error: null,
  });

  const fetchDefinition = useCallback(async (word: string) => {
    if (!word || word.length < 2) {
      setState({definition: null, loading: false, error: null});
      return;
    }

    setState(prev => ({...prev, loading: true, error: null}));

    try {
      const definition = await dictionaryService.fetchWordDefinition(word);

      if (definition) {
        setState({
          definition,
          loading: false,
          error: null,
        });
      } else {
        setState({
          definition: null,
          loading: false,
          error: 'Word not found',
        });
      }
    } catch (error) {
      setState({
        definition: null,
        loading: false,
        error: 'Failed to fetch definition',
      });
    }
  }, []);

  const clearDefinition = useCallback(() => {
    setState({
      definition: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    definition: state.definition,
    loading: state.loading,
    error: state.error,
    fetchDefinition,
    clearDefinition,
  };
};
