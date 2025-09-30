const fs = require('fs');
const path = require('path');

/**
 * Get the toggle shortcut for the current platform from manifest.json
 * @returns {string} The keyboard shortcut string (e.g., 'Ctrl+E' or 'Alt+L')
 */
function getToggleShortcut() {
  const manifestPath = path.join(__dirname, '..', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  const platform = process.platform === 'darwin' ? 'mac' : 
                   process.platform === 'win32' ? 'windows' : 'linux';
  
  const toggleCommand = manifest.commands['toggle-highlighter'];
  if (!toggleCommand || !toggleCommand.suggested_key) {
    throw new Error('Toggle highlighter command not found in manifest');
  }
  
  // Get platform-specific shortcut or fallback to default
  const shortcut = toggleCommand.suggested_key[platform] || 
                   toggleCommand.suggested_key.default ||
                   toggleCommand.suggested_key.windows;
  
  if (!shortcut) {
    throw new Error(`No shortcut found for platform: ${platform}`);
  }
  
  return shortcut;
}

/**
 * Convert manifest shortcut format to Playwright keyboard format
 * @param {string} shortcut - Shortcut from manifest (e.g., 'Ctrl+E')
 * @returns {string} Playwright-compatible shortcut (e.g., 'Control+E')
 */
function formatShortcutForPlaywright(shortcut) {
  // For testing, we need to use the content script's keyboard handling
  // Since Chrome commands don't work in test mode, we fall back to
  // the original Ctrl+; / Cmd+; that the content script listens for
  
  // HACK: Until we can properly test Chrome commands, use the 
  // content script's built-in shortcut
  if (process.platform === 'darwin') {
    return 'Meta+Semicolon';
  } else {
    return 'Control+Semicolon';
  }
}

/**
 * Get the formatted toggle shortcut for Playwright
 * @returns {string} Playwright-compatible shortcut
 */
function getPlaywrightToggleShortcut() {
  const shortcut = getToggleShortcut();
  return formatShortcutForPlaywright(shortcut);
}

/**
 * Get navigation shortcuts from storage or defaults
 * @returns {Object} Object with 'up' and 'down' shortcuts
 */
function getNavigationShortcuts() {
  // Default shortcuts - these can be customized by users
  return {
    up: 'f',
    down: 'v'
  };
}

module.exports = {
  getToggleShortcut,
  formatShortcutForPlaywright,
  getPlaywrightToggleShortcut,
  getNavigationShortcuts
};