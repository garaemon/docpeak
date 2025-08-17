export interface WordDefinition {
  word: string;
  definitions: string[];
  phonetics?: string;
  partOfSpeech?: string;
}

interface DictionaryAPIDefinition {
  definition: string;
}

interface DictionaryAPIMeaning {
  partOfSpeech: string;
  definitions: DictionaryAPIDefinition[];
}

interface DictionaryAPIPhonetic {
  text: string;
}

interface DictionaryAPIEntry {
  meanings: DictionaryAPIMeaning[];
  phonetics: DictionaryAPIPhonetic[];
}

class DictionaryService {
  private cache = new Map<string, WordDefinition>();

  async fetchWordDefinition(word: string): Promise<WordDefinition | null> {
    const normalizedWord = word.toLowerCase().trim();

    if (this.cache.has(normalizedWord)) {
      return this.cache.get(normalizedWord) || null;
    }

    try {
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(normalizedWord)}`,
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        const entry = data[0] as DictionaryAPIEntry;
        const definitions: string[] = [];
        let phonetics = '';
        let partOfSpeech = '';

        if (entry.meanings && Array.isArray(entry.meanings)) {
          entry.meanings.forEach((meaning: DictionaryAPIMeaning) => {
            if (meaning.definitions && Array.isArray(meaning.definitions)) {
              meaning.definitions
                .slice(0, 3)
                .forEach((def: DictionaryAPIDefinition) => {
                  if (def.definition) {
                    definitions.push(def.definition);
                  }
                });
            }
            if (!partOfSpeech && meaning.partOfSpeech) {
              partOfSpeech = meaning.partOfSpeech;
            }
          });
        }

        if (entry.phonetics && Array.isArray(entry.phonetics)) {
          const phoneticEntry = entry.phonetics.find(
            (p: DictionaryAPIPhonetic) => p.text,
          );
          if (phoneticEntry) {
            phonetics = phoneticEntry.text;
          }
        }

        const wordDefinition: WordDefinition = {
          word: normalizedWord,
          definitions: definitions.slice(0, 3),
          phonetics,
          partOfSpeech,
        };

        this.cache.set(normalizedWord, wordDefinition);
        return wordDefinition;
      }
    } catch (error) {
      console.error('Error fetching word definition:', error);
    }

    return null;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const dictionaryService = new DictionaryService();
