const { test, expect, chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test.describe('Regression Tests - BBC and IETF', () => {
  let browser;

  test.beforeAll(async () => {
    const extensionPath = path.join(__dirname, '..');
    browser = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`
      ],
    });
  });

  test.afterAll(async () => {
    await browser.close();
  });

  test('BBC - should handle article navigation correctly', async () => {
    const page = await browser.newPage();
    
    // Navigate to BBC article
    await page.goto('https://www.bbc.com/news/articles/cn0xe5dvp47o');
    
    // Wait for article content to load
    await page.waitForSelector('article', { timeout: 10000 });
    await page.waitForTimeout(2000); // Extra wait for dynamic content
    
    // Inject the content script
    const scriptContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'content-script.js'), 'utf8');
    await page.evaluate(scriptContent);
    
    await page.waitForTimeout(1000);
    
    // Enable the highlighter
    await page.keyboard.press('Control+Semicolon');
    await page.waitForTimeout(500);
    
    // Try different selectors for BBC's article structure
    let clicked = false;
    const selectors = [
      'article p:first-of-type',
      '[data-component="text-block"] p',
      'main p:first-of-type',
      'div[data-testid="article-body"] p'
    ];
    
    for (const selector of selectors) {
      const element = await page.$(selector);
      if (element) {
        const box = await element.boundingBox();
        if (box) {
          await page.mouse.click(box.x + 10, box.y + box.height / 2);
          clicked = true;
          console.log(`BBC - Clicked using selector: ${selector}`);
          break;
        }
      }
    }
    
    if (!clicked) {
      // Fallback: click somewhere in the middle of the page
      await page.mouse.click(400, 400);
      console.log('BBC - Used fallback click position');
    }
    
    await page.waitForTimeout(500);
    
    // Verify highlighter is visible
    const highlighterVisible = await page.evaluate(() => {
      const highlighter = document.querySelector('#line-highlighter-marker');
      return highlighter && highlighter.style.display === 'block';
    });
    expect(highlighterVisible).toBeTruthy();
    
    // Get initial position
    const initialPosition = await page.evaluate(() => {
      const highlighter = document.querySelector('#line-highlighter-marker');
      return highlighter ? parseInt(highlighter.style.top) : 0;
    });
    
    console.log('BBC - Initial position:', initialPosition);
    
    // Navigate down through the article
    const positions = [initialPosition];
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('v');
      await page.waitForTimeout(300);
      
      const newPosition = await page.evaluate(() => {
        const highlighter = document.querySelector('#line-highlighter-marker');
        return highlighter ? parseInt(highlighter.style.top) : 0;
      });
      positions.push(newPosition);
      console.log(`BBC - Position after nav ${i + 1}:`, newPosition);
    }
    
    // Verify we're moving down progressively
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i]).toBeGreaterThanOrEqual(positions[i - 1]);
    }
    
    // Navigate back up
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('f');
      await page.waitForTimeout(300);
    }
    
    const afterUpPosition = await page.evaluate(() => {
      const highlighter = document.querySelector('#line-highlighter-marker');
      return highlighter ? parseInt(highlighter.style.top) : 0;
    });
    
    console.log('BBC - After moving up:', afterUpPosition);
    expect(afterUpPosition).toBeLessThan(positions[positions.length - 1]);
    
    // Take screenshot for visual verification
    await page.screenshot({ path: 'tests/screenshots/bbc-article-test.png', fullPage: false });
  });

  test('IETF RFC - should not scroll to top when clicking between lines', async () => {
    const page = await browser.newPage();
    
    // Navigate to IETF RFC
    await page.goto('https://datatracker.ietf.org/doc/html/rfc6121#section-2.4.2');
    
    // Wait for content to load
    await page.waitForSelector('pre', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Inject the content script
    const scriptContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'content-script.js'), 'utf8');
    await page.evaluate(scriptContent);
    
    await page.waitForTimeout(1000);
    
    // Enable the highlighter
    await page.keyboard.press('Control+Semicolon');
    await page.waitForTimeout(500);
    
    // Scroll down a bit first
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(500);
    
    // Record initial scroll position
    const initialScroll = await page.evaluate(() => window.pageYOffset);
    console.log('IETF - Initial scroll position:', initialScroll);
    
    // Click on some text in the middle of the viewport
    const textElement = await page.$('pre');
    if (textElement) {
      const box = await textElement.boundingBox();
      // Click in the middle of the visible area
      await page.mouse.click(box.x + box.width / 2, 400);
      await page.waitForTimeout(500);
    }
    
    // Verify highlighter is created
    const highlighterVisible = await page.evaluate(() => {
      const highlighter = document.querySelector('#line-highlighter-marker');
      return highlighter && highlighter.style.display === 'block';
    });
    expect(highlighterVisible).toBeTruthy();
    
    // Get highlighter position
    const highlighterPos = await page.evaluate(() => {
      const highlighter = document.querySelector('#line-highlighter-marker');
      return highlighter ? parseInt(highlighter.style.top) : 0;
    });
    console.log('IETF - Highlighter position:', highlighterPos);
    
    // Try clicking between lines (in whitespace)
    await page.mouse.click(300, 450); // Click in potential whitespace area
    await page.waitForTimeout(500);
    
    // Check scroll didn't jump to top
    const scrollAfterClick = await page.evaluate(() => window.pageYOffset);
    console.log('IETF - Scroll after clicking between lines:', scrollAfterClick);
    
    // Scroll should not have changed dramatically (allow small adjustments)
    expect(Math.abs(scrollAfterClick - initialScroll)).toBeLessThan(100);
    
    // Now try navigating up with F key
    await page.keyboard.press('f');
    await page.waitForTimeout(300);
    
    const scrollAfterNav = await page.evaluate(() => window.pageYOffset);
    const highlighterPosAfterNav = await page.evaluate(() => {
      const highlighter = document.querySelector('#line-highlighter-marker');
      return highlighter ? parseInt(highlighter.style.top) : 0;
    });
    
    console.log('IETF - Scroll after F key:', scrollAfterNav);
    console.log('IETF - Highlighter pos after F key:', highlighterPosAfterNav);
    
    // Verify we didn't jump to top of page
    expect(scrollAfterNav).toBeGreaterThan(100); // Should still be scrolled down
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/ietf-rfc-test.png', fullPage: false });
  });

  test('Multiple sites - comprehensive navigation test', async () => {
    const testSites = [
      {
        name: 'Wikipedia',
        url: 'https://en.wikipedia.org/wiki/JavaScript',
        selector: '#mw-content-text p:first-of-type'
      },
      {
        name: 'MDN Docs',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Introduction',
        selector: 'article p:first-of-type'
      },
      {
        name: 'Hacker News',
        url: 'https://news.ycombinator.com',
        selector: '.title:first-of-type'
      }
    ];
    
    for (const site of testSites) {
      console.log(`\nTesting ${site.name}...`);
      const page = await browser.newPage();
      
      try {
        await page.goto(site.url);
        await page.waitForSelector(site.selector, { timeout: 10000 });
        await page.waitForTimeout(1000);
        
        // Inject content script
        const scriptContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'content-script.js'), 'utf8');
        await page.evaluate(scriptContent);
        
        // Enable highlighter
        await page.keyboard.press('Control+Semicolon');
        await page.waitForTimeout(500);
        
        // Click on content
        const element = await page.$(site.selector);
        if (element) {
          await element.click();
          await page.waitForTimeout(500);
        }
        
        // Verify highlighter works
        const highlighterVisible = await page.evaluate(() => {
          const highlighter = document.querySelector('#line-highlighter-marker');
          return highlighter && highlighter.style.display === 'block';
        });
        
        console.log(`${site.name} - Highlighter visible:`, highlighterVisible);
        expect(highlighterVisible).toBeTruthy();
        
        // Test navigation
        const initialPos = await page.evaluate(() => {
          const highlighter = document.querySelector('#line-highlighter-marker');
          return highlighter ? parseInt(highlighter.style.top) : 0;
        });
        
        await page.keyboard.press('v');
        await page.waitForTimeout(300);
        
        const newPos = await page.evaluate(() => {
          const highlighter = document.querySelector('#line-highlighter-marker');
          return highlighter ? parseInt(highlighter.style.top) : 0;
        });
        
        console.log(`${site.name} - Navigation works:`, newPos !== initialPos);
        
        // Take screenshot
        await page.screenshot({ 
          path: `tests/screenshots/${site.name.toLowerCase().replace(' ', '-')}-test.png`, 
          fullPage: false 
        });
        
      } catch (error) {
        console.error(`Error testing ${site.name}:`, error.message);
      } finally {
        await page.close();
      }
    }
  });

  test('Edge cases - whitespace and empty lines', async () => {
    const page = await browser.newPage();
    
    // Create a test page with various edge cases
    await page.goto('data:text/html,' + encodeURIComponent(`
      <html>
        <body style="margin: 20px; font-family: Arial;">
          <article>
            <h1>Edge Case Test Document</h1>
            <p>First paragraph with normal text.</p>
            
            <p></p> <!-- Empty paragraph -->
            
            <p>   </p> <!-- Paragraph with only spaces -->
            
            <p>Paragraph after empty lines.</p>
            
            <div style="height: 100px;"></div> <!-- Large gap -->
            
            <p>Paragraph after large gap.</p>
            
            <pre>
              Preformatted text
                with irregular spacing
                  and indentation
            </pre>
            
            <p>Final paragraph.</p>
          </article>
        </body>
      </html>
    `));
    
    // Inject content script
    const scriptContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'content-script.js'), 'utf8');
    await page.evaluate(scriptContent);
    
    // Enable highlighter
    await page.keyboard.press('Control+Semicolon');
    await page.waitForTimeout(500);
    
    // Click on first paragraph
    const firstP = await page.$('p:first-of-type');
    await firstP.click();
    await page.waitForTimeout(500);
    
    // Navigate through all the edge cases
    const positions = [];
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('v');
      await page.waitForTimeout(200);
      
      const pos = await page.evaluate(() => {
        const highlighter = document.querySelector('#line-highlighter-marker');
        if (!highlighter) return null;
        
        // Find what's under the highlighter
        const rect = highlighter.getBoundingClientRect();
        const element = document.elementFromPoint(rect.left + 10, rect.top + rect.height / 2);
        
        return {
          top: parseInt(highlighter.style.top),
          elementTag: element ? element.tagName : null,
          elementText: element ? element.textContent.substring(0, 50).trim() : null
        };
      });
      
      positions.push(pos);
      console.log(`Edge case position ${i + 1}:`, pos);
    }
    
    // Verify we navigated through content without getting stuck
    const uniquePositions = new Set(positions.map(p => p?.top).filter(Boolean));
    console.log('Unique positions visited:', uniquePositions.size);
    expect(uniquePositions.size).toBeGreaterThan(3); // Should have moved to at least 4 different positions
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/edge-cases-test.png', fullPage: true });
  });
});