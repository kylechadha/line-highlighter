const { test, expect, chromium } = require('@playwright/test');
const path = require('path');

test.describe.skip('Navigation Fixes - GitHub Docs & Scrolling', () => {  // Skip until we verify extension loads properly
  let browser;
  let context;
  let page;

  test.beforeAll(async () => {
    // Launch browser with extension
    browser = await chromium.launch({
      headless: false,
      args: [
        `--disable-extensions-except=${path.join(__dirname, '..')}`,
        `--load-extension=${path.join(__dirname, '..')}`
      ],
    });
  });

  test.beforeEach(async () => {
    context = await browser.newContext();
    page = await context.newPage();
    
    // Inject the content script manually since extension loading is unreliable
    await page.addInitScript({ path: path.join(__dirname, '..', 'src', 'content-script.js') });
    
    // Wait for script to initialize
    await page.waitForTimeout(500);
  });

  test.afterEach(async () => {
    await context.close();
  });

  test.afterAll(async () => {
    await browser.close();
  });

  test('should exclude sidebar navigation on GitHub-like pages', async () => {
    // Create a page structure similar to GitHub docs
    await page.goto('data:text/html,' + encodeURIComponent(`
      <html>
        <body>
          <nav class="breadcrumb" aria-label="breadcrumb">
            <a href="#">Enterprise administrators</a>
            <a href="#">Identity and access management</a>
            <a href="#">Understand enterprise IAM</a>
          </nav>
          
          <aside class="in-this-article" style="position: fixed; right: 0; top: 100px;">
            <h3>In this article</h3>
            <ul>
              <li>Identity management systems</li>
              <li>Usernames and profile information</li>
              <li>Managing roles and access</li>
            </ul>
          </aside>
          
          <main>
            <article>
              <h1>About Enterprise Managed Users</h1>
              <p>Learn how your enterprise can manage the lifecycle and authentication of users on GitHub from your identity provider (IdP).</p>
              <p>With Enterprise Managed Users, you manage the lifecycle and authentication of your users on GitHub.com or GHE.com from an external identity management system, or IdP:</p>
              <ul>
                <li>Your IdP provisions new user accounts on GitHub, with access to your enterprise.</li>
                <li>Another line of main content here.</li>
                <li>And another line of content to navigate through.</li>
              </ul>
            </article>
          </main>
        </body>
      </html>
    `));

    // Enable the extension
    await page.keyboard.press('Control+e');
    await page.waitForTimeout(100);
    
    // Click on main content
    const mainParagraph = await page.$('main p:first-of-type');
    await mainParagraph.click();
    await page.waitForTimeout(100);

    // Verify highlighter is created and visible
    await page.waitForFunction(() => {
      const highlighter = document.querySelector('#line-highlighter-marker');
      return highlighter && highlighter.style.display === 'block';
    }, { timeout: 2000 });

    // Get initial position
    const initialPosition = await page.evaluate(() => {
      const highlighter = document.querySelector('#line-highlighter-marker');
      return highlighter ? parseInt(highlighter.style.top) : 0;
    });

    // Navigate down through lines
    let positions = [initialPosition];
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('v');
      await page.waitForTimeout(200);
      
      const newPosition = await page.evaluate(() => {
        const highlighter = document.querySelector('#line-highlighter-marker');
        return highlighter ? parseInt(highlighter.style.top) : 0;
      });
      positions.push(newPosition);
    }

    // Check that we're navigating within main content, not jumping to sidebar
    const mainBounds = await page.$eval('main', el => {
      const rect = el.getBoundingClientRect();
      return { top: rect.top + window.scrollY, bottom: rect.bottom + window.scrollY };
    });

    // All positions should be within main content bounds
    for (const pos of positions) {
      expect(pos).toBeGreaterThanOrEqual(mainBounds.top);
      expect(pos).toBeLessThanOrEqual(mainBounds.bottom);
    }

    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/github-docs-navigation.png', fullPage: true });
  });

  test('should maintain highlighter position during scrolling', async () => {
    // Create a long page with scrollable content
    await page.goto('data:text/html,' + encodeURIComponent(`
      <html>
        <body style="margin: 0; padding: 20px;">
          <main>
            <article>
              <h1>Long Scrollable Article</h1>
              ${Array.from({length: 50}, (_, i) => 
                `<p style="margin: 20px 0; line-height: 1.6;">
                  This is paragraph ${i + 1}. It contains some text that spans across 
                  multiple lines to simulate a real article. The content here is meant 
                  to be long enough to require scrolling through the page.
                </p>`
              ).join('')}
            </article>
          </main>
        </body>
      </html>
    `));

    // Enable the extension
    await page.keyboard.press('Control+e');
    await page.waitForTimeout(100);
    
    // Click on a paragraph in the middle of the page
    const targetParagraph = await page.$('p:nth-of-type(10)');
    await targetParagraph.click();
    await page.waitForTimeout(100);

    // Get initial highlighter position relative to the paragraph
    const initialRelativePosition = await page.evaluate(() => {
      const highlighter = document.querySelector('#line-highlighter-marker');
      const paragraph = document.querySelector('p:nth-of-type(10)');
      const paragraphTop = paragraph.getBoundingClientRect().top + window.scrollY;
      const highlighterTop = parseInt(highlighter.style.top);
      return highlighterTop - paragraphTop;
    });

    // Take screenshot before scrolling
    await page.screenshot({ path: 'tests/screenshots/before-scroll.png' });

    // Scroll down
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(500); // Wait for scroll handler

    // Check that highlighter stayed with the text
    const afterScrollRelativePosition = await page.evaluate(() => {
      const highlighter = document.querySelector('#line-highlighter-marker');
      const paragraph = document.querySelector('p:nth-of-type(10)');
      const paragraphTop = paragraph.getBoundingClientRect().top + window.scrollY;
      const highlighterTop = parseInt(highlighter.style.top);
      return highlighterTop - paragraphTop;
    });

    // The relative position should remain approximately the same
    expect(Math.abs(afterScrollRelativePosition - initialRelativePosition)).toBeLessThan(5);

    // Take screenshot after scrolling
    await page.screenshot({ path: 'tests/screenshots/after-scroll.png' });

    // Scroll back up
    await page.evaluate(() => window.scrollBy(0, -300));
    await page.waitForTimeout(500);

    const finalRelativePosition = await page.evaluate(() => {
      const highlighter = document.querySelector('#line-highlighter-marker');
      const paragraph = document.querySelector('p:nth-of-type(10)');
      const paragraphTop = paragraph.getBoundingClientRect().top + window.scrollY;
      const highlighterTop = parseInt(highlighter.style.top);
      return highlighterTop - paragraphTop;
    });

    expect(Math.abs(finalRelativePosition - initialRelativePosition)).toBeLessThan(5);
  });

  test('should handle Confluence-like page structure', async () => {
    // Simulate Confluence-like structure with nested content
    await page.goto('data:text/html,' + encodeURIComponent(`
      <html>
        <body>
          <div class="page-layout">
            <nav class="sidebar" style="position: fixed; left: 0; width: 200px;">
              <ul>
                <li>Page 1</li>
                <li>Page 2</li>
                <li>Page 3</li>
              </ul>
            </nav>
            
            <main style="margin-left: 220px;">
              <div class="wiki-content">
                <h2>Phase 2 - H2 2025 - ETA 12/31/2025</h2>
                <div class="panel">
                  <h3>Goals</h3>
                  <ul>
                    <li>Cut over all remaining repos (using migration tools) (807 minus 45, as of 11/22) to EMU org, see [1]</li>
                    <li>Clean up the public org</li>
                    <li>Secure the EMU org, remove access from public org</li>
                  </ul>
                </div>
                <p>Additional content after the goals section.</p>
                <p>More content to test navigation.</p>
              </div>
            </main>
          </div>
        </body>
      </html>
    `));

    // Enable the extension
    await page.keyboard.press('Control+e');
    await page.waitForTimeout(100);
    
    // Click on content in main area
    const listItem = await page.$('main li:first-of-type');
    await listItem.click();
    await page.waitForTimeout(100);

    // Navigate and verify we stay in main content
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('v');
      await page.waitForTimeout(200);
    }

    // Verify highlighter is visible and in correct area
    const isInMainContent = await page.evaluate(() => {
      const highlighter = document.querySelector('#line-highlighter-marker');
      const main = document.querySelector('main');
      const highlighterRect = highlighter.getBoundingClientRect();
      const mainRect = main.getBoundingClientRect();
      
      return highlighterRect.left >= mainRect.left && 
             highlighterRect.right <= mainRect.right;
    });

    expect(isInMainContent).toBeTruthy();

    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/confluence-like-page.png', fullPage: true });
  });
});