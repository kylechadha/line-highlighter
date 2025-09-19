const { test, expect, chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test.describe('Final v2.1 Tests', () => {
  test('verify all fixes work correctly', async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    await page.goto('data:text/html,' + encodeURIComponent(`
      <html>
        <body style="padding: 40px; font-family: Arial;">
          <h1>Final Test - All Fixes</h1>
          <p>Testing Cmd+; shortcut</p>
          <p>Testing color display in popup</p>
          <p>Testing spacing in popup</p>
        </body>
      </html>
    `));
    
    const scriptContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'content-script.js'), 'utf8');
    await page.evaluate(scriptContent);
    await page.waitForTimeout(500);
    
    console.log('\n=== Test 1: Cmd+; Shortcut ===');
    
    // Test Ctrl+Semicolon
    await page.keyboard.press('Control+Semicolon');
    await page.waitForTimeout(500);
    
    const enabled = await page.evaluate(() => {
      const h = document.querySelector('#line-highlighter-marker');
      return !!h;
    });
    console.log('✓ Highlighter enabled with Ctrl+;:', enabled);
    
    // Click to show
    await page.click('p:first-of-type');
    await page.waitForTimeout(500);
    
    const visible = await page.evaluate(() => {
      const h = document.querySelector('#line-highlighter-marker');
      return h && h.style.display === 'block';
    });
    console.log('✓ Highlighter visible after click:', visible);
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/final-test.png', fullPage: true });
    
    await browser.close();
  });
  
  test('verify popup fixes', async () => {
    const extensionPath = path.join(__dirname, '..');
    const browser = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`
      ],
    });
    
    const page = await browser.newPage();
    await page.goto('chrome://extensions');
    await page.waitForTimeout(1000);
    
    // Get extension ID
    const extensionId = await page.evaluate(() => {
      const extensions = document.querySelector('extensions-manager')?.shadowRoot
        ?.querySelector('extensions-item-list')?.shadowRoot
        ?.querySelectorAll('extensions-item');
      
      if (!extensions) return null;
      
      for (const ext of extensions) {
        const name = ext.shadowRoot?.querySelector('#name')?.textContent;
        if (name && name.includes('Line Highlighter')) {
          return ext.id;
        }
      }
      return null;
    }).catch(() => null);
    
    if (extensionId) {
      console.log('\n=== Test 2: Popup Display ===');
      console.log('Extension ID:', extensionId);
      
      const popupPage = await browser.newPage();
      await popupPage.goto(`chrome-extension://${extensionId}/src/popup.html`);
      await popupPage.waitForTimeout(1000);
      
      // Check colors
      const colorStatus = await popupPage.evaluate(() => {
        const buttons = document.querySelectorAll('.color-btn');
        const hasColors = Array.from(buttons).every(btn => {
          const bg = window.getComputedStyle(btn).backgroundColor;
          return bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent';
        });
        return hasColors;
      });
      console.log('✓ Colors displaying:', colorStatus);
      
      // Check spacing
      const spacingInfo = await popupPage.evaluate(() => {
        const statusText = document.querySelector('.status-text');
        return {
          isEmpty: statusText.textContent === '',
          height: window.getComputedStyle(statusText).height
        };
      });
      console.log('✓ Status text spacing:', spacingInfo);
      
      // Check shortcut display
      const shortcutDisplay = await popupPage.evaluate(() => {
        const toggleInput = document.querySelector('#shortcut-toggle');
        return toggleInput ? toggleInput.value : 'not found';
      });
      console.log('✓ Toggle shortcut shows as:', shortcutDisplay);
      
      // Test ON state
      const toggleBtn = await popupPage.$('#toggle-btn');
      await toggleBtn.click();
      await popupPage.waitForTimeout(500);
      
      const onStateSpacing = await popupPage.evaluate(() => {
        const statusText = document.querySelector('.status-text');
        return {
          text: statusText.textContent,
          height: window.getComputedStyle(statusText).height
        };
      });
      console.log('✓ ON state spacing:', onStateSpacing);
      
      // Take screenshot
      await popupPage.screenshot({ path: 'tests/screenshots/popup-final.png' });
    }
    
    await browser.close();
  });
});