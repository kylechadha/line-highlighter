const { test, expect, chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test.describe('Line Highlighter v2.1 Features', () => {
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

  test('should toggle with Ctrl+; keyboard shortcut', async () => {
    const page = await browser.newPage();
    
    // Create test page
    await page.goto('data:text/html,' + encodeURIComponent(`
      <html>
        <body style="padding: 40px; font-family: Arial;">
          <h1>Test Page for Line Highlighter v2.1</h1>
          <p>This is the first paragraph of text to test highlighting.</p>
          <p>This is the second paragraph with more content.</p>
          <p>And a third paragraph to test navigation.</p>
        </body>
      </html>
    `));
    
    // Inject content script
    const scriptContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'content-script.js'), 'utf8');
    await page.evaluate(scriptContent);
    
    await page.waitForTimeout(500);
    
    // Test Ctrl+; (or Cmd+; on Mac) toggle
    const modifierKey = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifierKey}+Semicolon`);
    await page.waitForTimeout(500);
    
    // Click on text
    const paragraph = await page.$('p:first-of-type');
    await paragraph.click();
    await page.waitForTimeout(500);
    
    // Check highlighter exists and is visible
    const highlighterVisible = await page.evaluate(() => {
      const highlighter = document.querySelector('#line-highlighter-marker');
      return highlighter && highlighter.style.display === 'block';
    });
    
    expect(highlighterVisible).toBeTruthy();
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/v2.1-highlighter-active.png' });
    
    // Test navigation still works
    await page.keyboard.press('v'); // Next line
    await page.waitForTimeout(300);
    
    const movedDown = await page.evaluate(() => {
      const highlighter = document.querySelector('#line-highlighter-marker');
      return highlighter ? parseInt(highlighter.style.top) : 0;
    });
    
    expect(movedDown).toBeGreaterThan(0);
  });

  test('should show popup UI with all features', async () => {
    const page = await browser.newPage();
    
    // Navigate to popup
    const popupPath = path.join(__dirname, '..', 'src', 'popup.html');
    await page.goto(`file://${popupPath}`);
    
    // Add popup.js script manually
    await page.addScriptTag({ path: path.join(__dirname, '..', 'src', 'popup.js') });
    
    await page.waitForTimeout(1000);
    
    // Check all elements exist
    const elements = await page.evaluate(() => {
      return {
        toggleButton: !!document.querySelector('#toggle-btn'),
        shortcutInputs: document.querySelectorAll('.shortcut-input').length,
        colorButtons: document.querySelectorAll('.color-btn').length,
        colorNames: document.querySelectorAll('.color-name').length
      };
    });
    
    expect(elements.toggleButton).toBeTruthy();
    expect(elements.shortcutInputs).toBe(3); // Toggle, Up, Down
    expect(elements.colorButtons).toBe(6); // 6 colors
    
    // Take screenshot of popup
    await page.setViewportSize({ width: 400, height: 600 });
    await page.screenshot({ path: 'tests/screenshots/v2.1-popup-ui.png' });
  });

  test('should apply different colors', async () => {
    const page = await browser.newPage();
    
    await page.goto('data:text/html,' + encodeURIComponent(`
      <html>
        <body style="padding: 40px;">
          <h1>Color Test</h1>
          <p>Testing different highlighter colors.</p>
        </body>
      </html>
    `));
    
    // Inject content script with different color settings
    const scriptContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'content-script.js'), 'utf8');
    
    // Test with orange color
    await page.evaluate((script) => {
      // Mock settings with orange color
      window.mockSettings = { 
        shortcuts: {
          toggle: { key: 'l', modifiers: ['alt'] },
          up: { key: 'f', modifiers: [] },
          down: { key: 'v', modifiers: [] }
        },
        color: 'orange' 
      };
      eval(script);
    }, scriptContent);
    
    await page.waitForTimeout(500);
    
    // Enable and click
    await page.keyboard.press('Alt+l');
    await page.waitForTimeout(300);
    
    const paragraph = await page.$('p');
    await paragraph.click();
    await page.waitForTimeout(300);
    
    // Verify highlighter has correct color
    const colorApplied = await page.evaluate(() => {
      const highlighter = document.querySelector('#line-highlighter-marker');
      return highlighter ? highlighter.style.backgroundColor : null;
    });
    
    console.log('Applied color:', colorApplied);
    
    // Take screenshot with colored highlighter
    await page.screenshot({ path: 'tests/screenshots/v2.1-color-test.png' });
  });

  test('should have working extension icons', async () => {
    // Check that icon files exist
    const iconPaths = [
      'assets/icons/inactive.png',
      'assets/icons/active.png'
    ];
    
    for (const iconPath of iconPaths) {
      const fullPath = path.join(__dirname, '..', iconPath);
      const exists = fs.existsSync(fullPath);
      expect(exists).toBeTruthy();
      
      if (exists) {
        const stats = fs.statSync(fullPath);
        expect(stats.size).toBeGreaterThan(0);
        console.log(`${iconPath} exists and is ${stats.size} bytes`);
      }
    }
  });
});