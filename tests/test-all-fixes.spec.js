const { test, expect, chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test.describe('Test All v2.1 Fixes', () => {
  test('test new Cmd+Semicolon shortcut', async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Create test page
    await page.goto('data:text/html,' + encodeURIComponent(`
      <html>
        <body style="padding: 40px; font-family: Arial;">
          <h1>Test New Shortcut: Cmd+;</h1>
          <p>First paragraph - click here after enabling.</p>
          <p>Second paragraph for testing navigation.</p>
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
    
    console.log('\n=== Testing New Shortcut (Ctrl+;) ===\n');
    
    // Test Ctrl+Semicolon (Windows/Linux)
    await page.keyboard.press('Control+Semicolon');
    await page.waitForTimeout(500);
    
    let highlighterStatus = await page.evaluate(() => {
      const h = document.querySelector('#line-highlighter-marker');
      return {
        exists: !!h,
        display: h ? h.style.display : 'not found'
      };
    });
    console.log('After Ctrl+;:', highlighterStatus);
    
    if (highlighterStatus.exists) {
      // Click to show highlighter
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
      
      // Test navigation still works
      await page.keyboard.press('v'); // Move down
      await page.waitForTimeout(200);
      
      const posAfterV = await page.evaluate(() => {
        const h = document.querySelector('#line-highlighter-marker');
        return h ? h.style.top : null;
      });
      console.log('Position after V key:', posAfterV);
    }
    
    // Test Meta+Semicolon for Mac
    console.log('\n=== Testing Mac Version (Meta+;) ===\n');
    
    // First disable
    await page.keyboard.press('Control+Semicolon');
    await page.waitForTimeout(500);
    
    // Try Meta version (Cmd on Mac)
    await page.keyboard.press('Meta+Semicolon');
    await page.waitForTimeout(500);
    
    highlighterStatus = await page.evaluate(() => {
      const h = document.querySelector('#line-highlighter-marker');
      return {
        exists: !!h,
        display: h ? h.style.display : 'not found'
      };
    });
    console.log('After Meta+; (Cmd+; on Mac):', highlighterStatus);
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/new-shortcut-test.png', fullPage: true });
    
    await browser.close();
  });
  
  test('test popup display and colors', async () => {
    const extensionPath = path.join(__dirname, '..');
    const browser = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`
      ],
    });
    
    // Create a page to get extension ID
    const page = await browser.newPage();
    await page.goto('chrome://extensions');
    await page.waitForTimeout(1000);
    
    // Get the extension ID
    const extensionId = await page.evaluate(() => {
      const extensions = document.querySelector('extensions-manager').shadowRoot
        .querySelector('extensions-item-list').shadowRoot
        .querySelectorAll('extensions-item');
      
      for (const ext of extensions) {
        const name = ext.shadowRoot.querySelector('#name')?.textContent;
        if (name && name.includes('Line Highlighter')) {
          return ext.id;
        }
      }
      return null;
    }).catch(() => null);
    
    if (extensionId) {
      console.log('Extension ID:', extensionId);
      
      // Open the popup directly
      const popupPage = await browser.newPage();
      await popupPage.goto(`chrome-extension://${extensionId}/src/popup.html`);
      await popupPage.waitForTimeout(1000);
      
      // Check color buttons
      const colorStatus = await popupPage.evaluate(() => {
        const buttons = document.querySelectorAll('.color-btn');
        const results = [];
        buttons.forEach(btn => {
          const computed = window.getComputedStyle(btn);
          results.push({
            color: btn.dataset.color,
            backgroundColor: computed.backgroundColor,
            hasColorName: !!btn.querySelector('.color-name'),
            isVisible: computed.display !== 'none'
          });
        });
        return results;
      });
      
      console.log('\n=== Color Button Status ===');
      colorStatus.forEach(status => {
        console.log(`${status.color}:`, status);
      });
      
      // Check spacing
      const spacingInfo = await popupPage.evaluate(() => {
        const toggleSection = document.querySelector('.toggle-section');
        const statusText = document.querySelector('.status-text');
        const toggleBtn = document.querySelector('.toggle-btn');
        
        return {
          toggleSectionPadding: window.getComputedStyle(toggleSection).padding,
          toggleSectionMargin: window.getComputedStyle(toggleSection).marginBottom,
          statusTextMargin: window.getComputedStyle(statusText).marginTop,
          statusTextHeight: statusText.offsetHeight,
          toggleBtnHeight: toggleBtn.offsetHeight
        };
      });
      
      console.log('\n=== Spacing Info ===');
      console.log('Spacing:', spacingInfo);
      
      // Check shortcut display
      const shortcutDisplay = await popupPage.evaluate(() => {
        const toggleInput = document.querySelector('#shortcut-toggle');
        return toggleInput ? toggleInput.value : 'not found';
      });
      
      console.log('\n=== Shortcut Display ===');
      console.log('Toggle shortcut shown as:', shortcutDisplay);
      
      // Take screenshot
      await popupPage.screenshot({ path: 'tests/screenshots/popup-fixed.png' });
    } else {
      console.log('Could not find extension ID');
    }
    
    await browser.close();
  });
});