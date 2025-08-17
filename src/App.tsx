import React, {useState, useCallback} from 'react';
import PDFViewer from './components/PDFViewer';
import FileUploader from './components/FileUploader';
import './App.css';

function App() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const handleFileSelect = useCallback((file: File) => {
    const fileUrl = URL.createObjectURL(file);
    setSelectedFile(fileUrl);
  }, []);

  const handleClearFile = useCallback(() => {
    if (selectedFile) {
      URL.revokeObjectURL(selectedFile);
    }
    setSelectedFile(null);
  }, [selectedFile]);

  return (
    <div className="App">
      {selectedFile ? (
        <div>
          <div className="app-header">
            <h1>DocPeak PDF Viewer</h1>
            <button onClick={handleClearFile} className="clear-button">
              Select New File
            </button>
          </div>
          <PDFViewer fileUrl={selectedFile} />
        </div>
      ) : (
        <div>
          <div className="app-header">
            <h1>DocPeak PDF Viewer</h1>
            <p>A PDF viewer for English language learners</p>
          </div>
          <FileUploader onFileSelect={handleFileSelect} />
        </div>
      )}
    </div>
  );
}

export default App;
