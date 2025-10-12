import {useEffect, useCallback, useRef} from 'react';
import styles from '../components/PDFViewer/PDFViewer.module.css';

interface WordPosition {
  word: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Cache for text spans to avoid repeated querySelectorAll
let cachedTextSpans: HTMLElement[] = [];
let cacheInvalidated = true;

export const useWordHighlight = () => {
  const animationFrameRef = useRef<number | null>(null);

  const updateCache = useCallback(() => {
    if (cacheInvalidated) {
      const textSpans = document.querySelectorAll(
        '.react-pdf__Page__textContent span',
      );
      cachedTextSpans = Array.from(textSpans) as HTMLElement[];
      cacheInvalidated = false;
    }
  }, []);

  const highlightWord = useCallback(
    (wordInfo: WordPosition | null) => {
      // Cancel any pending animation frame
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Remove existing highlights
      clearHighlights();

      if (!wordInfo) return;

      // Use requestAnimationFrame for immediate rendering without blocking
      animationFrameRef.current = requestAnimationFrame(() => {
        // Update cache if needed
        updateCache();

        // Use cached text spans
        cachedTextSpans.forEach(span => {
          const text = span.textContent?.trim() || '';
          if (text) {
            addHighlightOverlay(span, text, wordInfo.word);
          }
        });
      });
    },
    [updateCache],
  );

  const clearHighlights = useCallback(() => {
    // Cancel any pending animation frame
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Remove all highlight overlays
    const highlightOverlays = document.querySelectorAll(
      '.word-highlight-overlay',
    );
    highlightOverlays.forEach(overlay => {
      overlay.remove();
    });
  }, []);

  const invalidateCache = useCallback(() => {
    cacheInvalidated = true;
  }, []);

  // Clean up highlights when component unmounts
  useEffect(() => {
    return () => {
      clearHighlights();
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [clearHighlights]);

  return {
    highlightWord,
    clearHighlights,
    invalidateCache,
  };
};

const addHighlightOverlay = (
  span: HTMLElement,
  text: string,
  targetWord: string,
) => {
  const cleanTarget = targetWord.replace(/[^\w]/g, '').toLowerCase();
  const words = text.split(/(\s+)/);

  const spanRect = span.getBoundingClientRect();
  const pageContainer = span.closest('.react-pdf__Page');

  if (!pageContainer) return;

  let currentOffset = 0;

  words.forEach(word => {
    const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();

    if (cleanWord === cleanTarget && cleanWord.length > 0) {
      // Calculate the approximate position of this word within the span
      const wordStartRatio = currentOffset / text.length;
      const wordLength = word.length;
      const wordEndRatio = (currentOffset + wordLength) / text.length;

      // Create highlight overlay
      const overlay = document.createElement('div');
      overlay.className = `word-highlight-overlay ${styles.highlightActive}`;
      overlay.style.position = 'absolute';
      overlay.style.left = `${spanRect.left - pageContainer.getBoundingClientRect().left + spanRect.width * wordStartRatio}px`;
      overlay.style.top = `${spanRect.top - pageContainer.getBoundingClientRect().top}px`;
      overlay.style.width = `${spanRect.width * (wordEndRatio - wordStartRatio)}px`;
      overlay.style.height = `${spanRect.height}px`;
      overlay.style.pointerEvents = 'none';
      overlay.style.zIndex = '3';

      pageContainer.appendChild(overlay);
    }

    currentOffset += word.length;
  });
};
