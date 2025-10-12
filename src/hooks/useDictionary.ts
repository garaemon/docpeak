import {useState, useCallback} from 'react';
import {dictionaryService, WordDefinition} from '../services/dictionaryService';

interface DictionaryState {
  definition: WordDefinition | null;
  error: string | null;
}

export const useDictionary = () => {
  const [state, setState] = useState<DictionaryState>({
    definition: null,
    error: null,
  });

  const fetchDefinition = useCallback(async (word: string) => {
    if (!word || word.length < 2) {
      setState({definition: null, error: null});
      return;
    }

    setState(prev => ({...prev, error: null}));

    try {
      const definition = await dictionaryService.fetchWordDefinition(word);

      if (definition) {
        setState({
          definition,
          error: null,
        });
      } else {
        setState({
          definition: null,
          error: 'Word not found',
        });
      }
    } catch (error) {
      setState({
        definition: null,
        error: 'Failed to fetch definition',
      });
    }
  }, []);

  const clearDefinition = useCallback(() => {
    setState({
      definition: null,
      error: null,
    });
  }, []);

  return {
    definition: state.definition,
    error: state.error,
    fetchDefinition,
    clearDefinition,
  };
};
