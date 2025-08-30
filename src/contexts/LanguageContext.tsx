import React, {createContext, useContext, useState, useEffect} from 'react';
import {settingsService, LanguageType} from '../services/settingsService';

interface LanguageContextType {
  language: LanguageType;
  setLanguage: (language: LanguageType) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

const translations = {
  en: {
    // Toolbar
    'toolbar.settings': 'Settings',
    'toolbar.uploadFile': 'Upload File',

    // PDF Viewer
    'pdf.pageOf': 'Page {current} of {total}',
    'pdf.noDocument': 'No PDF document loaded',
    'pdf.loading': 'Loading PDF...',
    'pdf.error': 'Error loading PDF',

    // File Uploader
    'upload.selectFile': 'Select PDF File',
    'upload.dragDrop': 'Drag and drop a PDF file here, or click to select',
    'upload.invalidFile': 'Please select a valid PDF file',

    // Settings Modal
    'settings.title': 'Settings',
    'settings.language': 'Interface Language',
    'settings.languageHelp':
      'Change the interface language for the application',
    'settings.aiProvider': 'AI Provider',
    'settings.geminiApiKey': 'Gemini API Key',
    'settings.ollamaEndpoint': 'Ollama Endpoint',
    'settings.aiModel': 'AI Model',
    'settings.cancel': 'Cancel',
    'settings.save': 'Save',
    'settings.validating': 'Validating...',
    'settings.saved': 'Saved!',

    // Chat
    'chat.typeMessage': 'Type your message...',
    'chat.send': 'Send',
    'chat.thinking': 'Thinking...',
  },
  ja: {
    // Toolbar
    'toolbar.settings': '設定',
    'toolbar.uploadFile': 'ファイルアップロード',

    // PDF Viewer
    'pdf.pageOf': '{current} / {total} ページ',
    'pdf.noDocument': 'PDFドキュメントが読み込まれていません',
    'pdf.loading': 'PDF読み込み中...',
    'pdf.error': 'PDF読み込みエラー',

    // File Uploader
    'upload.selectFile': 'PDFファイルを選択',
    'upload.dragDrop':
      'PDFファイルをここにドラッグ&ドロップするか、クリックして選択してください',
    'upload.invalidFile': '有効なPDFファイルを選択してください',

    // Settings Modal
    'settings.title': '設定',
    'settings.language': 'インターフェース言語',
    'settings.languageHelp': 'アプリケーションのインターフェース言語を変更',
    'settings.aiProvider': 'AIプロバイダー',
    'settings.geminiApiKey': 'Gemini APIキー',
    'settings.ollamaEndpoint': 'Ollamaエンドポイント',
    'settings.aiModel': 'AIモデル',
    'settings.cancel': 'キャンセル',
    'settings.save': '保存',
    'settings.validating': '検証中...',
    'settings.saved': '保存しました！',

    // Chat
    'chat.typeMessage': 'メッセージを入力...',
    'chat.send': '送信',
    'chat.thinking': '考え中...',
  },
};

export const LanguageProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [language, setLanguageState] = useState<LanguageType>('en');

  useEffect(() => {
    const savedLanguage = settingsService.getLanguage();
    setLanguageState(savedLanguage);
  }, []);

  const setLanguage = (newLanguage: LanguageType) => {
    setLanguageState(newLanguage);
    settingsService.updateLanguage(newLanguage);
  };

  const t = (key: string, params?: Record<string, string | number>) => {
    const translation =
      translations[language][
        key as keyof (typeof translations)[typeof language]
      ] || key;

    if (params) {
      return Object.entries(params).reduce(
        (result, [param, value]) => result.replace(`{${param}}`, String(value)),
        translation,
      );
    }

    return translation;
  };

  return (
    <LanguageContext.Provider value={{language, setLanguage, t}}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
