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