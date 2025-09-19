const { test, expect, chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test.describe('Debug BBC Issue', () => {
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

  test('BBC - debug highlighter creation', async () => {
    const page = await browser.newPage();
    
    // Navigate to BBC article
    await page.goto('https://www.bbc.com/news/articles/cn0xe5dvp47o');
    
    // Wait for page to stabilize
    await page.waitForTimeout(3000);
    
    // Inject the content script and check for errors
    const scriptContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'content-script.js'), 'utf8');
    
    // Listen for console messages
    page.on('console', msg => {
      console.log('Console:', msg.type(), msg.text());
    });
    
    // Inject script
    const scriptResult = await page.evaluate(scriptContent);
    console.log('Script injection result:', scriptResult);
    
    await page.waitForTimeout(1000);
    
    // Try to enable the highlighter
    await page.keyboard.press('Control+Semicolon');
    await page.waitForTimeout(1000);
    
    // Check if highlighter element was created
    const highlighterExists = await page.evaluate(() => {
      const highlighter = document.querySelector('#line-highlighter-marker');
      return {
        exists: highlighter !== null,
        display: highlighter ? highlighter.style.display : 'not found',
        cssText: highlighter ? highlighter.style.cssText : 'not found'
      };
    });
    
    console.log('Highlighter status after enable:', highlighterExists);
    
    // Try clicking on different parts of the page
    const clickTests = [
      { x: 400, y: 400, name: 'center' },
      { x: 200, y: 600, name: 'left-lower' },
      { x: 600, y: 300, name: 'right-upper' }
    ];
    
    for (const clickTest of clickTests) {
      await page.mouse.click(clickTest.x, clickTest.y);
      await page.waitForTimeout(500);
      
      const status = await page.evaluate(() => {
        const highlighter = document.querySelector('#line-highlighter-marker');
        return {
          exists: highlighter !== null,
          display: highlighter ? highlighter.style.display : 'not found',
          top: highlighter ? highlighter.style.top : 'not found'
        };
      });
      
      console.log(`After clicking ${clickTest.name}:`, status);
    }
    
    // Take screenshot for manual inspection
    await page.screenshot({ path: 'tests/screenshots/bbc-debug.png', fullPage: false });
    
    // Also try using the actual article text
    const hasArticleText = await page.evaluate(() => {
      const articles = document.querySelectorAll('article');
      const paragraphs = document.querySelectorAll('p');
      return {
        articleCount: articles.length,
        paragraphCount: paragraphs.length,
        firstParagraphText: paragraphs[0] ? paragraphs[0].textContent.substring(0, 100) : null
      };
    });
    
    console.log('Page structure:', hasArticleText);
  });
});