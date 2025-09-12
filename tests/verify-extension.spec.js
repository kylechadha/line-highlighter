const { test, expect, chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test.describe('Verify Extension Loading', () => {
  let browser;
  let context;
  let page;

  test.beforeAll(async () => {
    // Launch browser with extension
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

  test('should inject content script directly and verify it works', async () => {
    const page = await browser.newPage();
    
    // Read the content script
    const scriptContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'content-script.js'), 'utf8');
    
    // Navigate to a test page
    await page.goto('https://example.com');
    
    // Inject the script
    await page.evaluate(scriptContent);
    
    // Wait a moment for initialization
    await page.waitForTimeout(500);
    
    // Try to enable the highlighter
    await page.keyboard.press('Control+e');
    
    // Check if console message appears or highlighter element is created
    let highlighterCreated = false;
    page.on('console', msg => {
      if (msg.text().includes('Line Highlighter: Enabled')) {
        highlighterCreated = true;
      }
    });
    
    await page.waitForTimeout(1000);
    
    // Check if highlighter element exists
    const hasHighlighter = await page.evaluate(() => {
      return document.querySelector('#line-highlighter-marker') !== null;
    });
    
    console.log('Highlighter element created:', hasHighlighter);
    console.log('Console message seen:', highlighterCreated);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'tests/screenshots/verify-extension.png', fullPage: true });
    
    expect(hasHighlighter).toBeTruthy();
  });

  test('should test on actual GitHub docs page', async () => {
    const page = await browser.newPage();
    
    // Navigate to GitHub docs
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
    
    // Click on main content text
    const mainText = await page.$('main p');
    if (mainText) {
      await mainText.click();
      await page.waitForTimeout(500);
    }
    
    // Try navigation
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('v');
      await page.waitForTimeout(300);
    }
    
    // Take screenshots
    await page.screenshot({ path: 'tests/screenshots/github-docs-test.png', fullPage: false });
    
    // Check if highlighter exists and is visible
    const highlighterVisible = await page.evaluate(() => {
      const highlighter = document.querySelector('#line-highlighter-marker');
      return highlighter && highlighter.style.display === 'block';
    });
    
    console.log('Highlighter visible on GitHub docs:', highlighterVisible);
  });
});