export interface WordDefinition {
  word: string;
  definitions: string[];
  phonetics?: string;
  partOfSpeech?: string;
}

interface CacheEntry {
  value: WordDefinition;
  timestamp: number;
  accessCount: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  entries: number;
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
  private cache = new Map<string, CacheEntry>();
  private readonly maxCacheSize: number = 1000;
  private readonly cacheExpirationMs: number = 24 * 60 * 60 * 1000; // 24 hours
  private stats: CacheStats = {hits: 0, misses: 0, entries: 0};
  private readonly persistenceKey = 'docpeak_dictionary_cache';

  constructor() {
    this.loadCacheFromStorage();
    this.startPeriodicCleanup();
  }

  async fetchWordDefinition(word: string): Promise<WordDefinition | null> {
    const normalizedWord = word.toLowerCase().trim();

    const cachedEntry = this.getCachedEntry(normalizedWord);
    if (cachedEntry) {
      this.stats.hits++;
      cachedEntry.accessCount++;
      this.persistCacheToStorage();
      return cachedEntry.value;
    }

    this.stats.misses++;

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

        this.setCacheEntry(normalizedWord, wordDefinition);
        return wordDefinition;
      }
    } catch (error) {
      console.error('Error fetching word definition:', error);
    }

    return null;
  }

  private getCachedEntry(word: string): CacheEntry | null {
    const entry = this.cache.get(word);
    if (!entry) return null;

    const now = Date.now();
    const isExpired = now - entry.timestamp > this.cacheExpirationMs;

    if (isExpired) {
      this.cache.delete(word);
      this.stats.entries = this.cache.size;
      return null;
    }

    return entry;
  }

  private setCacheEntry(word: string, definition: WordDefinition): void {
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLeastRecentlyUsed();
    }

    const entry: CacheEntry = {
      value: definition,
      timestamp: Date.now(),
      accessCount: 1,
    };

    this.cache.set(word, entry);
    this.stats.entries = this.cache.size;
    this.persistCacheToStorage();
  }

  private evictLeastRecentlyUsed(): void {
    let lruKey = '';
    let minAccessCount = Infinity;
    let oldestTimestamp = Date.now();

    this.cache.forEach((entry, key) => {
      if (
        entry.accessCount < minAccessCount ||
        (entry.accessCount === minAccessCount &&
          entry.timestamp < oldestTimestamp)
      ) {
        lruKey = key;
        minAccessCount = entry.accessCount;
        oldestTimestamp = entry.timestamp;
      }
    });

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  private loadCacheFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.persistenceKey);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.cache && data.stats) {
          for (const [key, entry] of Object.entries(data.cache)) {
            this.cache.set(key, entry as CacheEntry);
          }
          this.stats = data.stats;
        }
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }

  private persistCacheToStorage(): void {
    try {
      const cacheObj: Record<string, CacheEntry> = {};
      this.cache.forEach((value, key) => {
        cacheObj[key] = value;
      });
      const data = {
        cache: cacheObj,
        stats: this.stats,
        timestamp: Date.now(),
      };
      localStorage.setItem(this.persistenceKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to persist cache to storage:', error);
    }
  }

  clearCache(): void {
    this.cache.clear();
    this.stats = {hits: 0, misses: 0, entries: 0};
    localStorage.removeItem(this.persistenceKey);
  }

  getCacheStats(): CacheStats {
    return {...this.stats};
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  private startPeriodicCleanup(): void {
    setInterval(
      () => {
        this.cleanupExpiredEntries();
      },
      60 * 60 * 1000,
    ); // Run every hour
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let removedCount = 0;
    const expiredKeys: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > this.cacheExpirationMs) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => {
      this.cache.delete(key);
      removedCount++;
    });

    if (removedCount > 0) {
      this.stats.entries = this.cache.size;
      this.persistCacheToStorage();
    }
  }

  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    return total === 0 ? 0 : this.stats.hits / total;
  }
}

export const dictionaryService = new DictionaryService();
