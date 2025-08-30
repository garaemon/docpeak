# DocPeak - TypeScript PDF Viewer

## Project Overview
A PDF viewer for English language learners that displays word meanings in tooltips when hovering over words.

## Implementation Steps

### Phase 1: Basic PDF Viewer
1. **Project Initialization**
   - Create React TypeScript project (`npx create-react-app docpeak --template typescript`)
   - Add necessary dependencies (react-pdf, @types/react-pdf, pdfjs-dist)
   - Set up basic directory structure

2. **Core Components Creation**
   - `PDFViewer` component for main display
   - `Toolbar` component for navigation controls
   - `PageNavigation` component for page controls
   - `FileUploader` component for PDF file selection

3. **PDF Display Functionality**
   - Integrate react-pdf library
   - Implement PDF file loading with state management
   - Add page rendering with React hooks
   - Create page navigation (previous/next/jump to page)

4. **Basic Operations**
   - Zoom functionality with React state
   - Page jump feature
   - File upload/selection component
   - Error handling for invalid PDFs

### Phase 2: Advanced Features (Future)
5. **Text Extraction & Word Detection**
   - Extract text layer from PDF using PDF.js
   - Create custom hook for mouse hover detection
   - Word boundary detection logic

6. **Dictionary Integration**
   - Dictionary API service
   - Tooltip component with positioning logic
   - Loading states and error handling

7. **Usability Improvements**
   - Search history
   - Favorite words storage
   - Settings panel (font size, dictionary selection, etc.)

## Tech Stack
- **Framework**: React 18 + TypeScript
- **PDF Library**: react-pdf + PDF.js
- **State Management**: React hooks (useState, useEffect, useContext)
- **Styling**: CSS Modules
- **Build Tool**: Create React App (Webpack)
- **Testing**: Jest + React Testing Library

## Directory Structure
```
docpeak/
├── src/
│   ├── components/
│   │   ├── PDFViewer/
│   │   │   ├── PDFViewer.tsx
│   │   │   ├── PDFViewer.module.css
│   │   │   └── index.ts
│   │   ├── Toolbar/
│   │   │   ├── Toolbar.tsx
│   │   │   ├── Toolbar.module.css
│   │   │   └── index.ts
│   │   ├── PageNavigation/
│   │   ├── FileUploader/
│   │   └── Tooltip/
│   ├── hooks/
│   │   ├── usePDFLoader.ts
│   │   ├── useWordDetection.ts
│   │   └── useDictionary.ts
│   ├── services/
│   │   ├── pdfService.ts
│   │   └── dictionaryService.ts
│   ├── types/
│   │   └── pdf.types.ts
│   └── App.tsx
├── public/
├── package.json
├── tsconfig.json
└── README.md
```

## Implementation Guidelines
- Keep functions under 90 lines
- Start function/method names with verbs
- Use descriptive variable names
- Avoid class inheritance (except when required by libraries)
- Don't implement many features at once - work incrementally
- Always compile and test after modifications
- Check linter and fix the linter errorr before making pull requests