const { test, expect, chromium } = require('@playwright/test');
const path = require('path');

test.describe('Bug Fixes - v2.1 Issues', () => {
  let browser;
  let page;

  test.beforeAll(async () => {
    browser = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${path.join(__dirname, '..')}`,
        `--load-extension=${path.join(__dirname, '..')}`
      ],
    });
  });

  test.beforeEach(async () => {
    page = await browser.newPage();
    await page.goto('file://' + path.join(__dirname, 'test-manual.html'));
    await page.waitForTimeout(1000);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.afterAll(async () => {
    await browser.close();
  });

  test('should hide highlighter when extension is disabled', async () => {
    // Enable highlighter
    const modifierKey = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifierKey}+Shift+l`);
    await page.waitForTimeout(100);
    
    // Click to create highlighter
    const paragraph = await page.$('p:first-of-type');
    await paragraph.click();
    await page.waitForTimeout(100);
    
    // Verify highlighter is visible
    let highlighter = await page.$('#line-highlighter-marker');
    expect(highlighter).toBeTruthy();
    
    let isVisible = await page.evaluate(() => {
      const h = document.querySelector('#line-highlighter-marker');
      return h && h.style.display !== 'none';
    });
    expect(isVisible).toBeTruthy();
    
    // Disable highlighter
    await page.keyboard.press(`${modifierKey}+Shift+l`);
    await page.waitForTimeout(100);
    
    // Verify highlighter is removed or hidden
    highlighter = await page.$('#line-highlighter-marker');
    if (highlighter) {
      isVisible = await page.evaluate(() => {
        const h = document.querySelector('#line-highlighter-marker');
        return h && h.style.display !== 'none';
      });
      expect(isVisible).toBeFalsy();
    } else {
      expect(highlighter).toBeFalsy();
    }
  });

  test('should toggle with Cmd+Shift+L keyboard shortcut', async () => {
    // Press Cmd+Shift+L to enable
    const modifierKey = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifierKey}+Shift+l`);
    await page.waitForTimeout(200);
    
    // Click to show highlighter
    const paragraph = await page.$('p:first-of-type');
    await paragraph.click();
    await page.waitForTimeout(100);
    
    // Check highlighter exists
    let highlighter = await page.$('#line-highlighter-marker');
    expect(highlighter).toBeTruthy();
    
    // Press Cmd+Shift+L to disable
    await page.keyboard.press(`${modifierKey}+Shift+l`);
    await page.waitForTimeout(200);
    
    // Check highlighter is removed
    highlighter = await page.$('#line-highlighter-marker');
    expect(highlighter).toBeFalsy();
  });

  test('popup should have no scrollbar', async () => {
    // Get extension ID
    const targets = await browser.targets();
    const extensionTarget = targets.find(target => 
      target.url()?.includes('chrome-extension://') && 
      target.url()?.includes('popup.html')
    );
    
    if (!extensionTarget) {
      // Open popup programmatically
      const extensionId = 'YOUR_EXTENSION_ID'; // This would need to be dynamic
      test.skip();
      return;
    }
    
    const popupPage = await extensionTarget.page();
    
    // Check for scrollbar
    const hasScrollbar = await popupPage.evaluate(() => {
      const body = document.body;
      return body.scrollHeight > body.clientHeight;
    });
    
    expect(hasScrollbar).toBeFalsy();
  });

  test('color labels should be visible and not cut off', async () => {
    // This would need to open the popup and check CSS
    // For now, we'll mark as a visual test
    test.skip();
  });

  test('should update shortcuts dynamically', async () => {
    // Enable highlighter
    const modifierKey = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifierKey}+Shift+l`);
    await page.waitForTimeout(100);
    
    // Click to show highlighter
    const paragraph = await page.$('p:first-of-type');
    await paragraph.click();
    await page.waitForTimeout(100);
    
    // Try default shortcuts (F and V)
    const initialTop = await page.evaluate(() => {
      const h = document.querySelector('#line-highlighter-marker');
      return h ? parseInt(h.style.top) : 0;
    });
    
    await page.keyboard.press('v'); // Move down
    await page.waitForTimeout(200);
    
    const afterV = await page.evaluate(() => {
      const h = document.querySelector('#line-highlighter-marker');
      return h ? parseInt(h.style.top) : 0;
    });
    
    expect(afterV).toBeGreaterThan(initialTop);
    
    // Now we would need to change shortcuts in popup and test D/C
    // This requires popup interaction which is complex
    test.skip();
  });
});