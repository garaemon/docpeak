import React, {useState, useCallback, useEffect} from 'react';
import {Document, Page, pdfjs} from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import {useWordDetection} from '../../hooks/useWordDetection';
import {useDictionary} from '../../hooks/useDictionary';
import {useWordHighlight} from '../../hooks/useWordHighlight';
import {usePDFTextExtraction} from '../../hooks/usePDFTextExtraction';
import {useChat} from '../../hooks/useChat';
import Sidebar from '../Sidebar';
import SettingsModal from '../SettingsModal';
import styles from './PDFViewer.module.css';

// Configure PDF.js worker - use local worker file that matches react-pdf version
// Check if running in Electron and adjust path accordingly
const isElectron = navigator.userAgent.toLowerCase().indexOf(' electron/') > -1;
if (isElectron) {
  // In Electron, use file protocol with absolute path
  pdfjs.GlobalWorkerOptions.workerSrc = './pdf.worker.min.js';
} else {
  // In browser, use relative path
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

interface PDFViewerProps {
  fileUrl: string | null;
}

const PDFViewer: React.FC<PDFViewerProps> = ({fileUrl}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [viewMode, setViewMode] = useState<'single' | 'all'>('all');
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const {hoveredWord} = useWordDetection();
  const {definition, loading, error, fetchDefinition, clearDefinition} =
    useDictionary();
  const {highlightWord, clearHighlights} = useWordHighlight();

  const {contextualText} = usePDFTextExtraction(
    fileUrl,
    viewMode === 'single' ? pageNumber : 1,
  );

  const {
    messages: chatMessages,
    isLoading: chatLoading,
    error: chatError,
    sendMessage: sendChatMessage,
    clearChat,
    clearError: clearChatError,
  } = useChat();

  const onDocumentLoadSuccess = useCallback(
    ({numPages}: {numPages: number}) => {
      setNumPages(numPages);
      setPageNumber(1);
    },
    [],
  );

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('Error loading PDF:', error);
  }, []);

  const goToPreviousPage = useCallback(() => {
    setPageNumber(prev => Math.max(prev - 1, 1));
    clearHighlights();
  }, [clearHighlights]);

  const goToNextPage = useCallback(() => {
    setPageNumber(prev => Math.min(prev + 1, numPages));
    clearHighlights();
  }, [numPages, clearHighlights]);

  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.1, 3.0));
  }, []);

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1.0);
  }, []);

  const fitToWidth = useCallback(() => {
    if (containerWidth > 0) {
      // Estimate page width (typically 595 points for A4)
      const pageWidth = 595;
      const padding = 40; // Account for padding
      const newScale = (containerWidth - padding) / pageWidth;
      setScale(Math.max(0.5, Math.min(newScale, 3.0)));
    }
  }, [containerWidth]);

  const toggleViewMode = useCallback(() => {
    setViewMode(prev => (prev === 'single' ? 'all' : 'single'));
    clearHighlights();
  }, [clearHighlights]);

  useEffect(() => {
    if (hoveredWord) {
      void fetchDefinition(hoveredWord.word);
      highlightWord(hoveredWord);
    } else {
      clearDefinition();
      clearHighlights();
    }
  }, [
    hoveredWord,
    fetchDefinition,
    clearDefinition,
    highlightWord,
    clearHighlights,
  ]);

  useEffect(() => {
    const updateContainerWidth = () => {
      const container = document.querySelector(`.${styles.documentContainer}`);
      if (container) {
        setContainerWidth(container.clientWidth);
      }
    };

    updateContainerWidth();
    window.addEventListener('resize', updateContainerWidth);

    return () => {
      window.removeEventListener('resize', updateContainerWidth);
    };
  }, []);

  const handleSendMessage = useCallback(
    (message: string) => {
      void sendChatMessage(message, contextualText);
    },
    [sendChatMessage, contextualText],
  );

  const handleOpenSettings = useCallback(() => {
    setIsSettingsOpen(true);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setIsSettingsOpen(false);
  }, []);

  const handleSaveSettings = useCallback(() => {
    // Settings are automatically saved in the modal
  }, []);

  if (!fileUrl) {
    return (
      <div className={styles.emptyState}>
        <p>Please select a PDF file to view</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <button onClick={toggleViewMode} className={styles.viewModeButton}>
          {viewMode === 'all' ? 'Show Single Page' : 'Show All Pages'}
        </button>

        {viewMode === 'single' && (
          <>
            <button
              onClick={goToPreviousPage}
              disabled={pageNumber <= 1}
              className={styles.navButton}
            >
              Previous
            </button>

            <span className={styles.pageInfo}>
              Page {pageNumber} of {numPages}
            </span>

            <button
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
              className={styles.navButton}
            >
              Next
            </button>
          </>
        )}

        <div className={styles.zoomControls}>
          <button onClick={zoomOut} className={styles.zoomButton}>
            -
          </button>
          <span className={styles.zoomLevel}>{Math.round(scale * 100)}%</span>
          <button onClick={zoomIn} className={styles.zoomButton}>
            +
          </button>
          <button onClick={resetZoom} className={styles.resetButton}>
            Reset
          </button>
          <button onClick={fitToWidth} className={styles.fitButton}>
            Fit to Width
          </button>
        </div>
      </div>

      <div className={styles.documentContainer}>
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={<div className={styles.loading}>Loading PDF...</div>}
          error={<div className={styles.error}>Failed to load PDF</div>}
        >
          {viewMode === 'all' ? (
            <div className={styles.allPagesContainer}>
              {Array.from(new Array(numPages), (el, index) => (
                <div key={`page_${index + 1}`} className={styles.pageWrapper}>
                  <div className={styles.pageNumber}>Page {index + 1}</div>
                  <Page
                    pageNumber={index + 1}
                    scale={scale}
                    renderTextLayer={true}
                    renderAnnotationLayer={false}
                    loading={
                      <div className={styles.loading}>Loading page...</div>
                    }
                  />
                </div>
              ))}
            </div>
          ) : (
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={false}
              loading={<div className={styles.loading}>Loading page...</div>}
            />
          )}
        </Document>
      </div>

      <Sidebar
        definition={definition}
        loading={loading}
        error={error}
        hoveredWord={hoveredWord?.word || null}
        chatMessages={chatMessages}
        chatLoading={chatLoading}
        chatError={chatError}
        onSendMessage={handleSendMessage}
        onClearChat={clearChat}
        onClearChatError={clearChatError}
        onOpenSettings={handleOpenSettings}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={handleCloseSettings}
        onSave={handleSaveSettings}
      />
    </div>
  );
};

export default PDFViewer;
