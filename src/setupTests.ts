// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock react-pdf for Jest tests
jest.mock('react-pdf', () => ({
  Document: 'div',
  Page: 'div',
  pdfjs: {
    GlobalWorkerOptions: {
      workerSrc: '',
    },
  },
}));

// Mock react-markdown for Jest tests
jest.mock('react-markdown', () => {
  const mockReact = require('react');
  return function ReactMarkdown({children}: {children: string}) {
    return mockReact.createElement('div', {}, children);
  };
});

// Mock Prism for highlighting
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).Prism = {};
jest.mock('prismjs', () => ({}));
jest.mock('prismjs/components/prism-javascript', () => ({}));
jest.mock('prismjs/components/prism-typescript', () => ({}));
jest.mock('prismjs/components/prism-python', () => ({}));
jest.mock('prismjs/components/prism-json', () => ({}));
jest.mock('prismjs/components/prism-bash', () => ({}));
jest.mock('prismjs/components/prism-css', () => ({}));
jest.mock('prismjs/components/prism-markup', () => ({}));
jest.mock('prismjs/components/prism-markdown', () => ({}));
jest.mock('rehype-highlight', () => () => () => {});
