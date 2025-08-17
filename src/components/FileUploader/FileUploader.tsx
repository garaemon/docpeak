import React, {useCallback, useRef} from 'react';
import styles from './FileUploader.module.css';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({onFileSelect}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && file.type === 'application/pdf') {
        onFileSelect(file);
      } else {
        alert('Please select a valid PDF file');
      }
    },
    [onFileSelect],
  );

  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
    },
    [],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      const files = event.dataTransfer.files;
      const file = files[0];

      if (file && file.type === 'application/pdf') {
        onFileSelect(file);
      } else {
        alert('Please drop a valid PDF file');
      }
    },
    [onFileSelect],
  );

  return (
    <div className={styles.container}>
      <div
        className={styles.dropZone}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <div className={styles.content}>
          <div className={styles.icon}>📄</div>
          <h3 className={styles.title}>Select or Drop PDF File</h3>
          <p className={styles.description}>
            Click here or drag and drop a PDF file to start viewing
          </p>
          <button className={styles.selectButton}>Choose PDF File</button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileChange}
        className={styles.hiddenInput}
      />
    </div>
  );
};

export default FileUploader;
