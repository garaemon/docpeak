import {useState, useCallback, useEffect, useRef} from 'react';

interface WordPosition {
  word: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const useWordDetection = () => {
  const [hoveredWord, setHoveredWord] = useState<WordPosition | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentElementRef = useRef<HTMLElement | null>(null);
  const currentWordRef = useRef<string | null>(null);

  const extractWordAtPosition = useCallback(
    (event: MouseEvent): WordPosition | null => {
      const target = event.target as HTMLElement;

      // Try different selectors to find text content
      const textElement =
        target.closest('.react-pdf__Page__textContent span') ||
        target.closest('.react-pdf__Page__textContent') ||
        (target.classList.contains('react-pdf__Page__textContent')
          ? target
          : null) ||
        (target.tagName === 'SPAN' && target.textContent ? target : null);

      if (textElement && textElement.textContent) {
        const text = textElement.textContent.trim();
        const words = text.split(/\s+/);

        // For elements containing multiple words, try to find the specific word under cursor
        if (words.length > 1) {
          const wordInfo = findWordAtMousePosition(
            textElement as HTMLElement,
            text,
            event.clientX,
          );
          if (wordInfo && isEnglishWord(wordInfo.word)) {
            return {
              word: cleanWord(wordInfo.word),
              x: wordInfo.x,
              y: wordInfo.y,
              width: wordInfo.width,
              height: wordInfo.height,
            };
          }
        } else if (words.length === 1 && isEnglishWord(words[0])) {
          const rect = textElement.getBoundingClientRect();
          return {
            word: cleanWord(words[0]),
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
          };
        }
      }

      return null;
    },
    [],
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Find the text element that might contain words
      const textElement =
        (target.closest('.react-pdf__Page__textContent span') as HTMLElement) ||
        (target.closest('.react-pdf__Page__textContent') as HTMLElement) ||
        (target.classList.contains('react-pdf__Page__textContent')
          ? target
          : null) ||
        (target.tagName === 'SPAN' && target.textContent ? target : null);

      // If we're still over the same element, don't recalculate word detection
      if (textElement === currentElementRef.current && currentWordRef.current) {
        return;
      }

      // Clear any existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Update current element reference
      currentElementRef.current = textElement;

      // Debounce the word detection to prevent flickering
      debounceTimeoutRef.current = setTimeout(() => {
        const wordInfo = extractWordAtPosition(event);

        if (wordInfo) {
          currentWordRef.current = wordInfo.word;
          // Only update if the word has actually changed
          setHoveredWord(prevWord => {
            if (prevWord?.word !== wordInfo.word) {
              return wordInfo;
            }
            return prevWord;
          });
        } else {
          currentWordRef.current = null;
          setHoveredWord(null);
        }
      }, 50); // Reduced debounce time for better responsiveness
    },
    [extractWordAtPosition],
  );

  const handleMouseLeave = useCallback(() => {
    // Clear any pending debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    // Clear references
    currentElementRef.current = null;
    currentWordRef.current = null;
    setHoveredWord(null);
  }, []);

  useEffect(() => {
    const pdfContainer = document.querySelector('.react-pdf__Document');

    if (pdfContainer) {
      pdfContainer.addEventListener(
        'mousemove',
        handleMouseMove as EventListener,
      );
      pdfContainer.addEventListener(
        'mouseleave',
        handleMouseLeave as EventListener,
      );

      return () => {
        // Clean up timeout on unmount
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
        pdfContainer.removeEventListener(
          'mousemove',
          handleMouseMove as EventListener,
        );
        pdfContainer.removeEventListener(
          'mouseleave',
          handleMouseLeave as EventListener,
        );
      };
    }

    return () => {
      // Clean up timeout even if no container found
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [handleMouseMove, handleMouseLeave]);

  return {
    hoveredWord,
  };
};

const isEnglishWord = (text: string): boolean => {
  // Remove common punctuation and check if the core word is English
  const cleanedText = text.replace(/[.,;:!?'"()[\]{}]/g, '');
  const englishWordRegex = /^[a-zA-Z]+$/;
  return englishWordRegex.test(cleanedText) && cleanedText.length > 1;
};

const findWordAtMousePosition = (
  element: HTMLElement,
  text: string,
  mouseX: number,
): {
  word: string;
  x: number;
  y: number;
  width: number;
  height: number;
} | null => {
  // Create a temporary element to measure individual words
  const tempDiv = document.createElement('div');
  tempDiv.style.visibility = 'hidden';
  tempDiv.style.position = 'absolute';
  tempDiv.style.whiteSpace = 'nowrap';
  tempDiv.style.font = window.getComputedStyle(element).font;
  tempDiv.style.fontSize = window.getComputedStyle(element).fontSize;
  tempDiv.style.fontFamily = window.getComputedStyle(element).fontFamily;
  tempDiv.style.fontWeight = window.getComputedStyle(element).fontWeight;
  document.body.appendChild(tempDiv);

  const elementRect = element.getBoundingClientRect();
  const relativeX = mouseX - elementRect.left;

  const words = text.split(/(\s+)/); // Keep whitespace
  let accumulatedWidth = 0;

  try {
    for (let i = 0; i < words.length; i++) {
      const word = words[i];

      // Skip whitespace
      if (/^\s+$/.test(word)) {
        tempDiv.textContent = word;
        accumulatedWidth += tempDiv.getBoundingClientRect().width;
        continue;
      }

      tempDiv.textContent = word;
      const wordWidth = tempDiv.getBoundingClientRect().width;

      // Check if mouse is over this word
      if (
        relativeX >= accumulatedWidth &&
        relativeX <= accumulatedWidth + wordWidth
      ) {
        return {
          word: word.trim(),
          x: elementRect.left + accumulatedWidth,
          y: elementRect.top,
          width: wordWidth,
          height: elementRect.height,
        };
      }

      accumulatedWidth += wordWidth;
    }
  } finally {
    document.body.removeChild(tempDiv);
  }

  return null;
};

const cleanWord = (text: string): string => {
  return text.replace(/[^\w]/g, '').toLowerCase();
};
