const { test, expect, chromium } = require('@playwright/test');
const path = require('path');

test.describe('Line Highlighter Extension', () => {
  let browser;
  let page;

  test.beforeAll(async () => {
    // Launch browser with extension
    browser = await chromium.launchPersistentContext('', {
      headless: false, // Extensions don't work properly in headless mode
      args: [
        `--disable-extensions-except=${path.join(__dirname, '..')}`,
        `--load-extension=${path.join(__dirname, '..')}`
      ],
    });
  });

  test.beforeEach(async () => {
    // browser is already a context when using launchPersistentContext
    page = await browser.newPage();
    
    // Navigate to a test page with text content
    await page.goto('data:text/html,<html><body><article><h1>Test Page</h1><p>This is the first line of text in the paragraph.</p><p>This is the second line of text.</p><p>This is the third line of text.</p><p>This is the fourth line of text.</p><p>This is the fifth line of text.</p></article></body></html>');
    
    // Wait for extension to load
    await page.waitForTimeout(500);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.afterAll(async () => {
    await browser.close();
  });

  test('should enable/disable with keyboard shortcut', async () => {
    // Press Cmd+Shift+L to enable
    const modifierKey = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifierKey}+Shift+l`);
    
    // Check for console message
    const consoleMessage = await page.waitForEvent('console', {
      predicate: msg => msg.text().includes('Line Highlighter: Enabled'),
      timeout: 2000
    });
    expect(consoleMessage).toBeTruthy();
    
    // Check that highlighter element was created
    const highlighter = await page.$('#line-highlighter-marker');
    expect(highlighter).toBeTruthy();
    
    // Press Cmd+Shift+L again to disable
    await page.keyboard.press(`${modifierKey}+Shift+l`);
    
    // Check for disable message
    const disableMessage = await page.waitForEvent('console', {
      predicate: msg => msg.text().includes('Line Highlighter: Disabled'),
      timeout: 2000
    });
    expect(disableMessage).toBeTruthy();
  });

  test('should highlight clicked line', async () => {
    // Enable the extension
    const modifierKey = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifierKey}+Shift+l`);
    await page.waitForTimeout(100);
    
    // Click on a paragraph
    const paragraph = await page.$('p:first-of-type');
    await paragraph.click();
    
    // Check that highlighter is visible
    const isVisible = await page.evaluate(() => {
      const highlighter = document.querySelector('#line-highlighter-marker');
      return highlighter && highlighter.style.display === 'block';
    });
    expect(isVisible).toBeTruthy();
    
    // Check that highlighter is positioned correctly
    const position = await page.evaluate(() => {
      const highlighter = document.querySelector('#line-highlighter-marker');
      return {
        top: parseInt(highlighter.style.top),
        height: parseInt(highlighter.style.height)
      };
    });
    expect(position.top).toBeGreaterThan(0);
    expect(position.height).toBeGreaterThan(0);
  });

  test('should navigate between lines with keyboard', async () => {
    // Enable and click on second paragraph
    const modifierKey = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifierKey}+Shift+l`);
    await page.waitForTimeout(100);
    
    const secondParagraph = await page.$('p:nth-of-type(2)');
    await secondParagraph.click();
    await page.waitForTimeout(100);
    
    // Get initial position
    const initialPosition = await page.evaluate(() => {
      const highlighter = document.querySelector('#line-highlighter-marker');
      return parseInt(highlighter.style.top);
    });
    
    // Press V to move down
    await page.keyboard.press('v');
    await page.waitForTimeout(200);
    
    const newPosition = await page.evaluate(() => {
      const highlighter = document.querySelector('#line-highlighter-marker');
      return parseInt(highlighter.style.top);
    });
    
    // Should have moved down
    expect(newPosition).toBeGreaterThan(initialPosition);
    
    // Press F to move back up
    await page.keyboard.press('f');
    await page.waitForTimeout(200);
    
    const finalPosition = await page.evaluate(() => {
      const highlighter = document.querySelector('#line-highlighter-marker');
      return parseInt(highlighter.style.top);
    });
    
    // Should be back near original position
    expect(Math.abs(finalPosition - initialPosition)).toBeLessThan(5);
  });


});