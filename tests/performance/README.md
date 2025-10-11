# Performance Tests

This directory contains Playwright-based performance tests for measuring the responsiveness of the PDF viewer's word hover functionality.

## Prerequisites

Before running the performance tests, you need to download the test PDF:

```bash
npm run test:download-pdf
```

This will download the sample PDF (`attention-is-all-you-need.pdf` from arXiv) to `public/test-pdfs/`.

## Running Tests

After downloading the test PDF, you can run the performance tests:

```bash
# Run all performance tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run with debug mode
npm run test:e2e:debug
```

## Test Files

- `hover-performance.spec.ts` - Measures word hover performance including highlight display and dictionary fetch times

## Expected Performance

The tests verify that:
- Word highlight appears within 200ms on average
- Dictionary definition appears within 1000ms on average

Current performance (after optimizations):
- Highlight display: ~63ms average
- Dictionary fetch: ~66ms average
