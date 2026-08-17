const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test.describe('Core Tests - Manifest and Build', () => {
  
  test('manifest.json should be valid', () => {
    const manifestPath = path.join(__dirname, '..', 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Check required fields
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.name).toBeTruthy();
    expect(manifest.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(manifest.content_scripts).toBeTruthy();
    expect(manifest.action).toBeTruthy();
    expect(manifest.background?.service_worker).toBeTruthy();
  });

  test('keyboard shortcuts should be properly configured', () => {
    const manifestPath = path.join(__dirname, '..', 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Check Chrome commands exist
    expect(manifest.commands).toBeTruthy();
    expect(manifest.commands['_execute_action']).toBeTruthy();
    expect(manifest.commands['toggle-highlighter']).toBeTruthy();
    
    // Check Mac shortcut for toggle
    const toggleMac = manifest.commands['toggle-highlighter'].suggested_key.mac;
    expect(toggleMac).toBe('Ctrl+E'); // Cmd+E on Mac
    
    // Check Windows/Linux shortcut
    const toggleWin = manifest.commands['toggle-highlighter'].suggested_key.windows;
    expect(toggleWin).toBe('Alt+L');
  });

  test('all source files should exist', () => {
    const requiredFiles = [
      'src/content-script.js',
      'src/popup.html',
      'src/popup.js',
      'src/popup-styles.css',
      'src/background.js',
      'assets/icons/active.png',
      'assets/icons/inactive.png'
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(__dirname, '..', file);
      expect(fs.existsSync(filePath)).toBeTruthy();
    }
  });

  test('popup.html should have correct structure', () => {
    const popupPath = path.join(__dirname, '..', 'src', 'popup.html');
    const popupContent = fs.readFileSync(popupPath, 'utf8');
    
    // Check for required elements
    expect(popupContent).toContain('id="toggle-btn"');
    expect(popupContent).toContain('id="toggle-shortcut"');
    expect(popupContent).toContain('id="shortcut-up"');
    expect(popupContent).toContain('id="shortcut-down"');
    expect(popupContent).toContain('class="color-btn"');
    
    // Check that popup shortcut row was removed
    expect(popupContent).not.toContain('id="popup-shortcut"');
    expect(popupContent).not.toContain('Open popup:');
    
    // Check that "Managed in browser settings" was removed
    expect(popupContent).not.toContain('Managed in browser settings');
  });

  test('test helpers should work correctly', () => {
    const { getToggleShortcut, getNavigationShortcuts } = require('./test-helpers');

    // Should return a shortcut
    const toggleShortcut = getToggleShortcut();
    expect(toggleShortcut).toBeTruthy();
    expect(toggleShortcut).toContain('+');

    // Should return navigation shortcuts
    const navShortcuts = getNavigationShortcuts();
    expect(navShortcuts.up).toBe('f');
    expect(navShortcuts.down).toBe('v');
  });
});

test.describe('Regression - content script fixes', () => {
  const csPath = path.join(__dirname, '..', 'src', 'content-script.js');
  const cs = fs.readFileSync(csPath, 'utf8');

  test('highlight bar uses fixed positioning so it tracks scroll', () => {
    // position:fixed + a live-rect recompute keeps the bar on its line when an
    // inner container scrolls (window.pageYOffset stays 0 on those sites, so the
    // old position:absolute + stored pageTop detached from the text).
    expect(cs).toContain('position: fixed');
    expect(cs).not.toContain('position: absolute');
  });

  test('scroll is tracked in capture phase to catch inner scroll containers', () => {
    // Inner-container scroll events do not bubble; capture phase is required.
    expect(cs).toMatch(/addEventListener\(\s*['"]scroll['"]\s*,\s*scheduleRender\s*,\s*true\s*\)/);
    expect(cs).toContain("addEventListener('resize', scheduleRender)");
  });

  test('nav filter matches class tokens, not raw substrings', () => {
    // Guards the bug where the Tailwind token "bg-nav-bg-paper" matched a naive
    // "nav-" substring (and "protocol" matched "toc"), hiding all page text and
    // breaking F/V navigation.
    expect(cs).toContain('isNavLike');
    expect(cs).not.toContain("includes('nav-')");
    expect(cs).not.toContain("includes('toc')");
  });
});