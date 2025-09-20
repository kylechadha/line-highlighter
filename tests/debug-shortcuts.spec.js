const { test, expect, chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test.describe('Debug Keyboard Shortcuts', () => {
  test('debug keyboard events and shortcuts', async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Create test page
    await page.goto('data:text/html,' + encodeURIComponent(`
      <html>
        <body style="padding: 40px; font-family: Arial;">
          <h1>Keyboard Shortcut Debug Test</h1>
          <p id="test-paragraph">Click here after enabling the highlighter.</p>
          <div id="log" style="margin-top: 20px; padding: 10px; background: #f0f0f0; font-family: monospace; white-space: pre-wrap;"></div>
        </body>
      </html>
    `));
    
    // Inject modified content script with debug logging
    const scriptContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'content-script.js'), 'utf8');
    
    // Add debug logging to the script
    const debugScript = scriptContent.replace(
      'function handleKeydown(e) {',
      `function handleKeydown(e) {
        const log = document.getElementById('log');
        if (log) {
          const keyInfo = \`Key: \${e.key}, Code: \${e.code}, Ctrl: \${e.ctrlKey}, Meta: \${e.metaKey}, Shift: \${e.shiftKey}, Alt: \${e.altKey}\`;
          log.textContent += keyInfo + '\\n';
          console.log('Keyboard Event:', keyInfo);
        }
      `
    ).replace(
      'if (matchesShortcut(e, settings.shortcuts.toggle)) {',
      `const matches = matchesShortcut(e, settings.shortcuts.toggle);
      if (log) {
        log.textContent += \`Toggle shortcut match: \${matches}, Looking for: \${JSON.stringify(settings.shortcuts.toggle)}\\n\`;
      }
      if (matches) {`
    );
    
    await page.evaluate(debugScript);
    await page.waitForTimeout(500);
    
    // Test various keyboard combinations
    console.log('\n=== Testing Keyboard Shortcuts ===\n');
    
    // Test 1: Ctrl+; (current default)
    console.log('Testing Ctrl+;...');
    await page.keyboard.press('Control+Semicolon');
    await page.waitForTimeout(500);
    
    let highlighterStatus = await page.evaluate(() => {
      const h = document.querySelector('#line-highlighter-marker');
      return { exists: !!h, enabled: window.state?.enabled };
    });
    console.log('After Ctrl+;:', highlighterStatus);
    
    // Test 2: Meta+; (Mac Cmd)
    console.log('\nTesting Meta+;...');
    await page.keyboard.press('Meta+Semicolon');
    await page.waitForTimeout(500);
    
    highlighterStatus = await page.evaluate(() => {
      const h = document.querySelector('#line-highlighter-marker');
      return { exists: !!h, enabled: window.state?.enabled };
    });
    console.log('After Meta+Shift+L:', highlighterStatus);
    
    // Test 3: Manually enable and test navigation
    console.log('\nManually enabling highlighter...');
    await page.evaluate(() => {
      if (typeof state !== 'undefined') {
        state.enabled = true;
        createHighlighter();
        console.log('Manually enabled highlighter');
      }
    });
    
    // Click on paragraph
    await page.click('#test-paragraph');
    await page.waitForTimeout(500);
    
    highlighterStatus = await page.evaluate(() => {
      const h = document.querySelector('#line-highlighter-marker');
      return {
        exists: !!h,
        visible: h ? h.style.display !== 'none' : false,
        top: h ? h.style.top : null,
        color: h ? h.style.backgroundColor : null
      };
    });
    console.log('After manual enable and click:', highlighterStatus);
    
    // Test 4: Try simpler shortcut (just Ctrl+L)
    console.log('\nTesting simpler Ctrl+L...');
    await page.evaluate(() => {
      // Temporarily change settings to test Ctrl+L
      if (typeof settings !== 'undefined') {
        settings.shortcuts.toggle = { key: 'l', modifiers: ['ctrl'] };
      }
    });
    
    // Disable first
    await page.evaluate(() => {
      if (typeof state !== 'undefined') {
        state.enabled = false;
        removeHighlighter();
      }
    });
    
    await page.keyboard.press('Control+l');
    await page.waitForTimeout(500);
    
    highlighterStatus = await page.evaluate(() => {
      const h = document.querySelector('#line-highlighter-marker');
      return { exists: !!h, enabled: window.state?.enabled };
    });
    console.log('After Ctrl+L:', highlighterStatus);
    
    // Test 5: Try Ctrl+Semicolon
    console.log('\nTesting Ctrl+Semicolon...');
    await page.evaluate(() => {
      if (typeof settings !== 'undefined') {
        settings.shortcuts.toggle = { key: ';', modifiers: ['ctrl'] };
      }
    });
    
    await page.keyboard.press('Control+Semicolon');
    await page.waitForTimeout(500);
    
    highlighterStatus = await page.evaluate(() => {
      const h = document.querySelector('#line-highlighter-marker');
      return { exists: !!h, enabled: window.state?.enabled };
    });
    console.log('After Ctrl+Semicolon:', highlighterStatus);
    
    // Get the debug log
    const debugLog = await page.evaluate(() => {
      const log = document.getElementById('log');
      return log ? log.textContent : 'No log found';
    });
    
    console.log('\n=== Debug Log ===\n');
    console.log(debugLog);
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/debug-shortcuts.png', fullPage: true });
    
    await browser.close();
  });
  
  test('test popup color display', async () => {
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
    
    // Open popup programmatically
    await page.goto(`chrome-extension://YOUR_EXTENSION_ID/src/popup.html`);
    
    // Check if colors are visible
    const colorStatus = await page.evaluate(() => {
      const buttons = document.querySelectorAll('.color-btn');
      const results = [];
      buttons.forEach(btn => {
        results.push({
          color: btn.dataset.color,
          backgroundColor: window.getComputedStyle(btn).backgroundColor,
          hasColorName: !!btn.querySelector('.color-name')
        });
      });
      return results;
    });
    
    console.log('Color button status:', colorStatus);
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/popup-colors.png' });
    
    await browser.close();
  });
});