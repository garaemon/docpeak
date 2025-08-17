import React, { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import styles from './PDFViewer.module.css';

// Configure PDF.js worker - use local worker file that matches react-pdf version
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface PDFViewerProps {
  fileUrl: string | null;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ fileUrl }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('Error loading PDF:', error);
  }, []);

  const goToPreviousPage = useCallback(() => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setPageNumber(prev => Math.min(prev + 1, numPages));
  }, [numPages]);


  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.1, 3.0));
  }, []);

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1.0);
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
        
        <div className={styles.zoomControls}>
          <button onClick={zoomOut} className={styles.zoomButton}>-</button>
          <span className={styles.zoomLevel}>{Math.round(scale * 100)}%</span>
          <button onClick={zoomIn} className={styles.zoomButton}>+</button>
          <button onClick={resetZoom} className={styles.resetButton}>Reset</button>
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
          <Page 
            pageNumber={pageNumber} 
            scale={scale}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            loading={<div className={styles.loading}>Loading page...</div>}
          />
        </Document>
      </div>
    </div>
  );
};

export default PDFViewer;