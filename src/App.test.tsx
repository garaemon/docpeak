import React from 'react';
import {render, screen} from '@testing-library/react';
import App from './App';

test('renders DocPeak header', () => {
  render(<App />);
  const headerElement = screen.getByText(/DocPeak PDF Viewer/i);
  expect(headerElement).toBeInTheDocument();
});

test('renders file upload area', () => {
  render(<App />);
  const uploadElement = screen.getByText(/Select or Drop PDF File/i);
  expect(uploadElement).toBeInTheDocument();
});
