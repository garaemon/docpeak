import {useState, useEffect, useCallback} from 'react';
import {pdfjs} from 'react-pdf';
import type {PDFDocumentProxy} from 'pdfjs-dist';

interface PDFTextContent {
  pageText: string;
  allText: string;
  isLoading: boolean;
  error: string | null;
}

interface TextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
}

export const usePDFTextExtraction = (
  fileUrl: string | null,
  currentPage: number,
) => {
  const [textContent, setTextContent] = useState<PDFTextContent>({
    pageText: '',
    allText: '',
    isLoading: false,
    error: null,
  });

  const extractTextFromPage = useCallback(
    async (pdfDocument: unknown, pageNumber: number): Promise<string> => {
      try {
        const page = await (pdfDocument as PDFDocumentProxy).getPage(
          pageNumber,
        );
        const textContent = await page.getTextContent();

        const textItems = textContent.items;
        let pageText = '';

        textItems.forEach(item => {
          if ('str' in item) {
            const textItem = item as TextItem;
            pageText += textItem.str + ' ';
          }
        });

        return pageText.trim();
      } catch (error) {
        console.error(`Error extracting text from page ${pageNumber}:`, error);
        return '';
      }
    },
    [],
  );

  const extractAllText = useCallback(
    async (pdfDocument: unknown): Promise<string> => {
      const numPages = (pdfDocument as PDFDocumentProxy).numPages;
      let allText = '';

      for (let i = 1; i <= numPages; i++) {
        const pageText = await extractTextFromPage(pdfDocument, i);
        if (pageText) {
          allText += `Page ${i}:\n${pageText}\n\n`;
        }
      }

      return allText.trim();
    },
    [extractTextFromPage],
  );

  useEffect(() => {
    if (!fileUrl) {
      setTextContent({
        pageText: '',
        allText: '',
        isLoading: false,
        error: null,
      });
      return;
    }

    const extractText = async () => {
      setTextContent(prev => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      try {
        const loadingTask = pdfjs.getDocument(fileUrl);
        const pdfDocument = await loadingTask.promise;

        const currentPageText = await extractTextFromPage(
          pdfDocument,
          currentPage,
        );
        const allDocumentText = await extractAllText(pdfDocument);

        setTextContent({
          pageText: currentPageText,
          allText: allDocumentText,
          isLoading: false,
          error: null,
        });
      } catch (error: unknown) {
        console.error('Error extracting PDF text:', error);
        setTextContent(prev => ({
          ...prev,
          isLoading: false,
          error: (error as Error).message || 'Failed to extract text from PDF',
        }));
      }
    };

    void extractText();
  }, [fileUrl, currentPage, extractTextFromPage, extractAllText]);

  const getContextualText = useCallback((): string => {
    if (textContent.pageText) {
      return `Current page text:\n${textContent.pageText}`;
    }
    return textContent.allText;
  }, [textContent.pageText, textContent.allText]);

  return {
    pageText: textContent.pageText,
    allText: textContent.allText,
    contextualText: getContextualText(),
    isLoading: textContent.isLoading,
    error: textContent.error,
  };
};
