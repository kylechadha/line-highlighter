const { test, expect, chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test.describe('Test Custom Shortcut Recording', () => {
  test('verify shortcuts can be customized', async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Create test page
    await page.goto('data:text/html,' + encodeURIComponent(`
      <html>
        <body style="padding: 40px; font-family: Arial;">
          <h1>Test Custom Shortcuts</h1>
          <p>Test paragraph 1</p>
          <p>Test paragraph 2</p>
        </body>
      </html>
    `));
    
    // Inject content script with ability to change settings
    const scriptContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'content-script.js'), 'utf8');
    await page.evaluate(scriptContent);
    await page.waitForTimeout(500);
    
    console.log('\n=== Test 1: Default Shortcut (Ctrl+;) ===');
    
    // Test default shortcut works
    await page.keyboard.press('Control+Semicolon');
    await page.waitForTimeout(500);
    
    let enabled = await page.evaluate(() => {
      const h = document.querySelector('#line-highlighter-marker');
      return !!h;
    });
    console.log('Enabled with Ctrl+;:', enabled);
    
    // Disable
    await page.keyboard.press('Control+Semicolon');
    await page.waitForTimeout(500);
    
    console.log('\n=== Test 2: Change to Custom Shortcut (Ctrl+L) ===');
    
    // Simulate changing the shortcut
    await page.evaluate(() => {
      if (typeof settings !== 'undefined') {
        settings.shortcuts.toggle = { key: 'l', modifiers: ['ctrl'] };
        console.log('Changed shortcut to Ctrl+L');
      }
    });
    
    // Test new shortcut
    await page.keyboard.press('Control+l');
    await page.waitForTimeout(500);
    
    enabled = await page.evaluate(() => {
      const h = document.querySelector('#line-highlighter-marker');
      return !!h;
    });
    console.log('Enabled with Ctrl+L:', enabled);
    
    // Click to show highlighter
    if (enabled) {
      await page.click('p:first-of-type');
      await page.waitForTimeout(500);
      
      const visible = await page.evaluate(() => {
        const h = document.querySelector('#line-highlighter-marker');
        return h && h.style.display === 'block';
      });
      console.log('Highlighter visible after click:', visible);
    }
    
    console.log('\n=== Test 3: Change to Alt+A ===');
    
    // Disable first
    await page.keyboard.press('Control+l');
    await page.waitForTimeout(500);
    
    // Change to Alt+A
    await page.evaluate(() => {
      if (typeof settings !== 'undefined') {
        settings.shortcuts.toggle = { key: 'a', modifiers: ['alt'] };
        console.log('Changed shortcut to Alt+A');
      }
    });
    
    // Test Alt+A
    await page.keyboard.press('Alt+a');
    await page.waitForTimeout(500);
    
    enabled = await page.evaluate(() => {
      const h = document.querySelector('#line-highlighter-marker');
      return !!h;
    });
    console.log('Enabled with Alt+A:', enabled);
    
    console.log('\n=== Test 4: Change Navigation Keys ===');
    
    if (enabled) {
      // Click to show highlighter
      await page.click('p:first-of-type');
      await page.waitForTimeout(500);
      
      // Change navigation keys
      await page.evaluate(() => {
        if (typeof settings !== 'undefined') {
          settings.shortcuts.up = { key: 'd', modifiers: [] };
          settings.shortcuts.down = { key: 'c', modifiers: [] };
          console.log('Changed navigation to D/C');
        }
      });
      
      // Test new navigation keys
      const initialPos = await page.evaluate(() => {
        const h = document.querySelector('#line-highlighter-marker');
        return h ? h.style.top : null;
      });
      console.log('Initial position:', initialPos);
      
      await page.keyboard.press('c'); // New down key
      await page.waitForTimeout(200);
      
      const posAfterC = await page.evaluate(() => {
        const h = document.querySelector('#line-highlighter-marker');
        return h ? h.style.top : null;
      });
      console.log('Position after C (down):', posAfterC);
      
      await page.keyboard.press('d'); // New up key
      await page.waitForTimeout(200);
      
      const posAfterD = await page.evaluate(() => {
        const h = document.querySelector('#line-highlighter-marker');
        return h ? h.style.top : null;
      });
      console.log('Position after D (up):', posAfterD);
    }
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/custom-shortcuts.png', fullPage: true });
    
    await browser.close();
  });
});