const { test, expect, chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test.describe('Test if shortcuts actually work', () => {
  test('verify shortcut toggles extension', async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Create test page
    await page.goto('data:text/html,' + encodeURIComponent(`
      <html>
        <body style="padding: 40px; font-family: Arial;">
          <h1>Test Shortcuts Working</h1>
          <p>First paragraph to test highlighting.</p>
          <p>Second paragraph for navigation.</p>
          <p>Third paragraph.</p>
        </body>
      </html>
    `));
    
    // Inject content script
    const scriptContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'content-script.js'), 'utf8');
    await page.evaluate(scriptContent);
    await page.waitForTimeout(500);
    
    // Listen for console messages
    page.on('console', msg => {
      if (msg.text().includes('Line Highlighter')) {
        console.log('Console:', msg.text());
      }
    });
    
    console.log('\n=== Testing Current Default (Ctrl+Shift+L) ===\n');
    
    // Test the current default shortcut
    await page.keyboard.press('Control+Semicolon');
    await page.waitForTimeout(500);
    
    // Check if highlighter was created
    let highlighterStatus = await page.evaluate(() => {
      const h = document.querySelector('#line-highlighter-marker');
      return {
        exists: !!h,
        display: h ? h.style.display : 'not found'
      };
    });
    console.log('After Ctrl+;:', highlighterStatus);
    
    // If enabled, click to show highlighter
    if (highlighterStatus.exists) {
      await page.click('p:first-of-type');
      await page.waitForTimeout(500);
      
      highlighterStatus = await page.evaluate(() => {
        const h = document.querySelector('#line-highlighter-marker');
        return {
          exists: !!h,
          visible: h ? h.style.display === 'block' : false,
          top: h ? h.style.top : null,
          color: h ? h.style.backgroundColor : null
        };
      });
      console.log('After clicking paragraph:', highlighterStatus);
    }
    
    // Test Meta+; for Mac
    console.log('\n=== Testing Mac Cmd (Meta+;) ===\n');
    
    // First disable if enabled
    await page.keyboard.press('Control+Semicolon');
    await page.waitForTimeout(500);
    
    // Try Meta version
    await page.keyboard.press('Meta+Semicolon');
    await page.waitForTimeout(500);
    
    highlighterStatus = await page.evaluate(() => {
      const h = document.querySelector('#line-highlighter-marker');
      return {
        exists: !!h,
        display: h ? h.style.display : 'not found'
      };
    });
    console.log('After Meta+Shift+L:', highlighterStatus);
    
    // Test that Meta acts as Ctrl on Mac (via the e.ctrlKey || e.metaKey check)
    if (highlighterStatus.exists) {
      await page.click('p:nth-of-type(2)');
      await page.waitForTimeout(500);
      
      highlighterStatus = await page.evaluate(() => {
        const h = document.querySelector('#line-highlighter-marker');
        return {
          exists: !!h,
          visible: h ? h.style.display === 'block' : false,
          top: h ? h.style.top : null
        };
      });
      console.log('After clicking second paragraph:', highlighterStatus);
      
      // Test navigation
      await page.keyboard.press('f'); // Move up
      await page.waitForTimeout(200);
      
      const posAfterF = await page.evaluate(() => {
        const h = document.querySelector('#line-highlighter-marker');
        return h ? h.style.top : null;
      });
      console.log('Position after F key:', posAfterF);
      
      await page.keyboard.press('v'); // Move down
      await page.waitForTimeout(200);
      
      const posAfterV = await page.evaluate(() => {
        const h = document.querySelector('#line-highlighter-marker');
        return h ? h.style.top : null;
      });
      console.log('Position after V key:', posAfterV);
    }
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/shortcuts-working.png', fullPage: true });
    
    await browser.close();
  });
});