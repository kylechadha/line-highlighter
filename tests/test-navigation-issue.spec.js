const { test, expect, chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test.describe('Test Navigation Issues', () => {
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

  test('should test navigation on GitHub docs - does it jump to breadcrumbs?', async () => {
    const page = await browser.newPage();
    
    // Navigate to the exact page you mentioned
    await page.goto('https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/understanding-iam-for-enterprises/about-enterprise-managed-users');
    
    // Wait for page to load
    await page.waitForSelector('main', { timeout: 10000 });
    
    // Inject the content script
    const scriptContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'content-script.js'), 'utf8');
    await page.evaluate(scriptContent);
    
    await page.waitForTimeout(1000);
    
    // Enable the highlighter
    await page.keyboard.press('Control+e');
    await page.waitForTimeout(500);
    
    // Click on the first line of main content
    const firstParagraph = await page.$('main p:first-of-type');
    if (firstParagraph) {
      await firstParagraph.click();
      await page.waitForTimeout(500);
    }
    
    // Take initial screenshot
    await page.screenshot({ path: 'tests/screenshots/nav-test-1-initial.png', fullPage: false });
    
    // Track positions as we navigate
    const positions = [];
    
    // Get initial position
    const initialData = await page.evaluate(() => {
      const highlighter = document.querySelector('#line-highlighter-marker');
      if (!highlighter) return null;
      
      const rect = highlighter.getBoundingClientRect();
      
      // Find what element is under the highlighter
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const elementUnder = document.elementFromPoint(x, y);
      
      return {
        top: parseInt(highlighter.style.top),
        element: elementUnder ? {
          tag: elementUnder.tagName,
          text: elementUnder.textContent.substring(0, 100),
          isInMain: elementUnder.closest('main') !== null,
          isInSidebar: elementUnder.closest('.in-this-article, aside, nav') !== null
        } : null
      };
    });
    
    positions.push(initialData);
    console.log('Initial position:', initialData);
    
    // Navigate down 10 times and track where we go
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('v');
      await page.waitForTimeout(300);
      
      const positionData = await page.evaluate(() => {
        const highlighter = document.querySelector('#line-highlighter-marker');
        if (!highlighter) return null;
        
        const rect = highlighter.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        const elementUnder = document.elementFromPoint(x, y);
        
        return {
          top: parseInt(highlighter.style.top),
          element: elementUnder ? {
            tag: elementUnder.tagName,
            text: elementUnder.textContent.substring(0, 100),
            isInMain: elementUnder.closest('main') !== null,
            isInSidebar: elementUnder.closest('.in-this-article, aside, nav, [aria-label*="breadcrumb"]') !== null,
            parent: elementUnder.parentElement ? elementUnder.parentElement.className : ''
          } : null
        };
      });
      
      positions.push(positionData);
      console.log(`Position ${i + 1}:`, positionData);
      
      // Take screenshot if we jumped to sidebar
      if (positionData && positionData.element && positionData.element.isInSidebar) {
        await page.screenshot({ 
          path: `tests/screenshots/nav-test-jumped-to-sidebar-${i}.png`, 
          fullPage: false 
        });
        console.log('WARNING: Jumped to sidebar/breadcrumb!');
      }
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'tests/screenshots/nav-test-2-after-navigation.png', fullPage: false });
    
    // Check if we ever left main content
    const leftMainContent = positions.some(p => 
      p && p.element && !p.element.isInMain
    );
    
    const jumpedToSidebar = positions.some(p => 
      p && p.element && p.element.isInSidebar
    );
    
    console.log('\n=== Navigation Summary ===');
    console.log('Total positions tracked:', positions.length);
    console.log('Ever left main content:', leftMainContent);
    console.log('Ever jumped to sidebar/breadcrumbs:', jumpedToSidebar);
    
    // Test should fail if we jumped to sidebar
    expect(jumpedToSidebar).toBeFalsy();
  });

  test('should test scrolling behavior on long page', async () => {
    const page = await browser.newPage();
    
    // Create a long test page
    await page.goto('data:text/html,' + encodeURIComponent(`
      <html>
        <body style="margin: 0; padding: 20px;">
          <main>
            <article>
              <h1>Long Scrollable Article</h1>
              ${Array.from({length: 100}, (_, i) => 
                `<p style="margin: 20px 0; line-height: 1.6;">
                  Paragraph ${i + 1}: This is a test paragraph with enough text to span 
                  multiple lines. The content here is meant to be long enough to require 
                  scrolling through the page. We want to test if the highlighter stays 
                  with the text when scrolling.
                </p>`
              ).join('')}
            </article>
          </main>
        </body>
      </html>
    `));
    
    // Inject the content script
    const scriptContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'content-script.js'), 'utf8');
    await page.evaluate(scriptContent);
    
    await page.waitForTimeout(500);
    
    // Enable highlighter
    await page.keyboard.press('Control+e');
    await page.waitForTimeout(500);
    
    // Click on paragraph 20
    await page.evaluate(() => {
      const p = document.querySelector('p:nth-of-type(20)');
      if (p) p.click();
    });
    await page.waitForTimeout(500);
    
    // Get initial position relative to the paragraph
    const initialRelative = await page.evaluate(() => {
      const highlighter = document.querySelector('#line-highlighter-marker');
      const paragraph = document.querySelector('p:nth-of-type(20)');
      if (!highlighter || !paragraph) return null;
      
      const paragraphRect = paragraph.getBoundingClientRect();
      const highlighterTop = parseInt(highlighter.style.top);
      const paragraphTop = paragraphRect.top + window.pageYOffset;
      
      return {
        highlighterTop,
        paragraphTop,
        relative: highlighterTop - paragraphTop
      };
    });
    
    console.log('Initial position:', initialRelative);
    await page.screenshot({ path: 'tests/screenshots/scroll-test-1-before.png' });
    
    // Scroll down significantly
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(1000); // Wait for scroll handler
    
    // Check position after scroll
    const afterScroll = await page.evaluate(() => {
      const highlighter = document.querySelector('#line-highlighter-marker');
      const paragraph = document.querySelector('p:nth-of-type(20)');
      if (!highlighter || !paragraph) return null;
      
      const paragraphRect = paragraph.getBoundingClientRect();
      const highlighterTop = parseInt(highlighter.style.top);
      const paragraphTop = paragraphRect.top + window.pageYOffset;
      
      return {
        highlighterTop,
        paragraphTop,
        relative: highlighterTop - paragraphTop
      };
    });
    
    console.log('After scroll:', afterScroll);
    await page.screenshot({ path: 'tests/screenshots/scroll-test-2-after.png' });
    
    // Check if relative position changed significantly
    if (initialRelative && afterScroll) {
      const drift = Math.abs(afterScroll.relative - initialRelative.relative);
      console.log('Position drift:', drift, 'pixels');
      
      // Fail if drift is more than 5 pixels
      expect(drift).toBeLessThan(5);
    }
  });
});