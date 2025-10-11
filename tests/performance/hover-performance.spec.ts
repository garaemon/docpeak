import {test, expect} from '@playwright/test';

interface PerformanceMetrics {
  hoverToHighlight: number;
  hoverToDictionary: number;
  highlightDuration: number;
  dictionaryFetchDuration: number;
}

test.describe('Word Hover Performance', () => {
  test.beforeEach(async ({page}) => {
    // Navigate to the app
    await page.goto('/');

    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Upload the test PDF directly to the file input
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('public/test-pdfs/attention-is-all-you-need.pdf');

    // Wait for PDF to load
    await page.waitForSelector('.react-pdf__Page__textContent', {
      timeout: 60000,
    });

    // Wait a bit more for all text layers to be ready
    await page.waitForTimeout(2000);
  });

  test('measure hover performance on multiple words', async ({page}) => {
    test.setTimeout(120000); // 2 minutes
    const metrics: PerformanceMetrics[] = [];
    const numSamples = 10;

    // Add performance measurement instrumentation
    await page.evaluate(() => {
      (window as any).performanceMarks = [];

      // Override console methods to capture timing data
      const originalLog = console.log;
      console.log = (...args: any[]) => {
        if (args[0]?.includes?.('Performance:')) {
          (window as any).performanceMarks.push(args);
        }
        originalLog.apply(console, args);
      };
    });

    // Pre-select valid English words only
    const textSpans = page.locator('.react-pdf__Page__textContent span');
    const validSpans: {index: number; text: string}[] = [];

    const count = await textSpans.count();
    for (let i = 0; i < Math.min(count, 200); i++) {
      const text = await textSpans.nth(i).textContent();
      const words = text?.trim().split(/\s+/) || [];
      // Only select spans with English words (single word preferred)
      if (words.length === 1 && /^[a-zA-Z]{3,}$/.test(words[0])) {
        validSpans.push({index: i, text: text!});
        if (validSpans.length >= numSamples) break;
      }
    }

    if (validSpans.length < numSamples) {
      console.log(`Warning: Only found ${validSpans.length} valid words`);
    }

    for (let i = 0; i < Math.min(numSamples, validSpans.length); i++) {
      console.log(`\n=== Sample ${i + 1}/${numSamples} ===`);

      const targetSpan = textSpans.nth(validSpans[i].index);
      const wordText = validSpans[i].text;
      console.log(`Hovering over word: "${wordText}"`);

      // Clear any existing highlights/definitions
      await page.mouse.move(0, 0);
      await page.waitForTimeout(200);

      // Start measuring
      const startTime = Date.now();

      // Mark the start in the browser
      await page.evaluate(() => {
        performance.mark('hover-start');
      });

      // Hover over the word with force option to bypass intercepting elements
      await targetSpan.hover({force: true});

      // Wait for highlight to appear and measure
      let highlightTime = 0;
      try {
        await page.waitForSelector('.word-highlight-overlay', {timeout: 1000});
        highlightTime = Date.now() - startTime;
        console.log(`Highlight appeared: ${highlightTime}ms`);

        await page.evaluate(() => {
          performance.mark('highlight-appeared');
        });
      } catch (error) {
        console.log('Highlight did not appear within 1000ms');
        highlightTime = -1;
      }

      // Wait for dictionary definition to appear and measure
      let dictionaryTime = 0;
      try {
        // Look for the word in the sidebar
        await page.waitForFunction(
          () => {
            const sidebar = document.querySelector('[class*="sidebar"]');
            return sidebar && sidebar.textContent && sidebar.textContent.length > 100;
          },
          {timeout: 3000},
        );
        dictionaryTime = Date.now() - startTime;
        console.log(`Dictionary appeared: ${dictionaryTime}ms`);

        await page.evaluate(() => {
          performance.mark('dictionary-appeared');
        });
      } catch (error) {
        console.log('Dictionary did not appear within 3000ms');
        dictionaryTime = -1;
      }

      // Get performance measures from browser
      const performanceData = await page.evaluate(() => {
        const marks = performance.getEntriesByType('mark');
        const hoverStart = marks.find(m => m.name === 'hover-start');
        const highlightAppeared = marks.find(m => m.name === 'highlight-appeared');
        const dictionaryAppeared = marks.find(m => m.name === 'dictionary-appeared');

        return {
          hoverStart: hoverStart?.startTime || 0,
          highlightAppeared: highlightAppeared?.startTime || 0,
          dictionaryAppeared: dictionaryAppeared?.startTime || 0,
        };
      });

      const metric: PerformanceMetrics = {
        hoverToHighlight: highlightTime,
        hoverToDictionary: dictionaryTime,
        highlightDuration:
          performanceData.highlightAppeared - performanceData.hoverStart,
        dictionaryFetchDuration:
          performanceData.dictionaryAppeared - performanceData.hoverStart,
      };

      metrics.push(metric);

      // Wait a bit before next sample
      await page.waitForTimeout(500);

      // Clear performance marks
      await page.evaluate(() => {
        performance.clearMarks();
      });
    }

    // Calculate statistics
    const validHighlightMetrics = metrics
      .filter(m => m.hoverToHighlight > 0)
      .map(m => m.hoverToHighlight);
    const validDictionaryMetrics = metrics
      .filter(m => m.hoverToDictionary > 0)
      .map(m => m.hoverToDictionary);

    const avgHighlight =
      validHighlightMetrics.reduce((a, b) => a + b, 0) / validHighlightMetrics.length;
    const avgDictionary =
      validDictionaryMetrics.reduce((a, b) => a + b, 0) / validDictionaryMetrics.length;

    const minHighlight = Math.min(...validHighlightMetrics);
    const maxHighlight = Math.max(...validHighlightMetrics);
    const minDictionary = Math.min(...validDictionaryMetrics);
    const maxDictionary = Math.max(...validDictionaryMetrics);

    console.log('\n=== Performance Summary ===');
    console.log(`\nHighlight Performance:`);
    console.log(`  Average: ${avgHighlight.toFixed(2)}ms`);
    console.log(`  Min: ${minHighlight}ms`);
    console.log(`  Max: ${maxHighlight}ms`);

    console.log(`\nDictionary Performance:`);
    console.log(`  Average: ${avgDictionary.toFixed(2)}ms`);
    console.log(`  Min: ${minDictionary}ms`);
    console.log(`  Max: ${maxDictionary}ms`);

    console.log('\nDetailed Metrics:');
    metrics.forEach((m, i) => {
      console.log(
        `  Sample ${i + 1}: Highlight=${m.hoverToHighlight}ms, Dictionary=${m.hoverToDictionary}ms`,
      );
    });

    // Performance assertions
    expect(avgHighlight).toBeLessThan(200); // Highlight should appear within 200ms on average
    expect(avgDictionary).toBeLessThan(1000); // Dictionary should appear within 1s on average
  });

  test('measure hover performance with browser DevTools', async ({page}) => {
    // Enable performance tracking
    await page.evaluate(() => {
      (window as any).hoverPerformanceLog = [];
    });

    // Inject performance monitoring
    await page.addInitScript(() => {
      const log = (window as any).hoverPerformanceLog || [];

      // Monitor DOM mutations for highlights
      const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          mutation.addedNodes.forEach(node => {
            if (
              node instanceof HTMLElement &&
              node.className.includes('word-highlight-overlay')
            ) {
              log.push({
                type: 'highlight-added',
                timestamp: performance.now(),
              });
            }
          });
        });
      });

      // Wait for document to be ready
      if (document.body) {
        observer.observe(document.body, {
          childList: true,
          subtree: true,
        });
      } else {
        document.addEventListener('DOMContentLoaded', () => {
          observer.observe(document.body, {
            childList: true,
            subtree: true,
          });
        });
      }
    });

    // Find and hover over a word
    const textSpan = page.locator('.react-pdf__Page__textContent span').nth(50);
    const wordText = await textSpan.textContent();
    console.log(`Testing with word: "${wordText}"`);

    await page.evaluate(() => {
      (window as any).hoverStartTime = performance.now();
    });

    await textSpan.hover();

    // Wait for operations to complete
    await page.waitForTimeout(2000);

    // Get the performance log
    const perfLog = await page.evaluate(() => {
      return (window as any).hoverPerformanceLog;
    });

    console.log('Performance log:', perfLog);
  });
});
