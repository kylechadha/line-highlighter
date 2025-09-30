// Popup script for Line Highlighter
// Handles all UI interactions in the extension popup

let currentSettings = {
  shortcuts: {
    toggle: { key: ';', modifiers: ['ctrl'] },
    up: { key: 'f', modifiers: [] },
    down: { key: 'v', modifiers: [] }
  },
  color: 'yellow'
};

const colors = {
  yellow: { hex: '#FFFF00', name: 'Yellow' }, // CSS yellow - bright
  orange: { hex: '#FFB86C', name: 'Orange' },
  pink: { hex: '#FF79C6', name: 'Pink' },
  green: { hex: '#50FA7B', name: 'Green' },
  blue: { hex: '#8BE9FD', name: 'Blue' },
  purple: { hex: '#BD93F9', name: 'Purple' }
};

// Determine platform for display
const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

document.addEventListener('DOMContentLoaded', async () => {
  // Load settings
  await loadSettings();
  
  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  // Get current state from background
  const response = await chrome.runtime.sendMessage({ 
    type: 'getState', 
    tabId: tab.id 
  });
  
  const isEnabled = response?.enabled || false;
  
  // Initialize UI
  initToggleButton(isEnabled, tab.id);
  initShortcutInputs();
  initColorPicker();
  updateShortcutDisplay();
  initChromeCommand();
  
  // Check if we should show welcome animation
  checkWelcomeAnimation();
});

async function checkWelcomeAnimation() {
  const result = await chrome.storage.local.get('showWelcome');
  if (result.showWelcome) {
    // Add pulse animation to the whole Chrome shortcut section
    const chromeSection = document.querySelector('.chrome-shortcut-section');
    if (chromeSection) {
      chromeSection.classList.add('pulse-welcome');
      
      // Remove the animation class after it completes (1s)
      setTimeout(() => {
        chromeSection.classList.remove('pulse-welcome');
        // Reset background to normal
        chromeSection.style.background = '';
      }, 1000);
    }
    
    // Clear the flag so it doesn't show again
    chrome.storage.local.remove('showWelcome');
  }
}

async function loadSettings() {
  try {
    // Try sync first, then local
    let result = await chrome.storage.sync.get('settings');
    if (result.settings && validateSettings(result.settings)) {
      currentSettings = result.settings;
    } else {
      result = await chrome.storage.local.get('settings');
      if (result.settings && validateSettings(result.settings)) {
        currentSettings = result.settings;
      }
    }
  } catch (e) {
    console.log('Using default settings');
  }
}

function validateSettings(settings) {
  // Check if settings has the required structure
  if (!settings || typeof settings !== 'object') return false;
  if (!settings.shortcuts || typeof settings.shortcuts !== 'object') return false;
  if (!settings.color || typeof settings.color !== 'string') return false;
  
  // Check each shortcut
  const requiredShortcuts = ['toggle', 'up', 'down'];
  for (const shortcut of requiredShortcuts) {
    if (!settings.shortcuts[shortcut]) return false;
    const s = settings.shortcuts[shortcut];
    if (!s.key || typeof s.key !== 'string') return false;
    if (!Array.isArray(s.modifiers)) return false;
  }
  
  // Check color is valid
  if (!colors[settings.color]) return false;
  
  return true;
}

async function saveSettings() {
  try {
    await chrome.storage.local.set({ settings: currentSettings });
    try {
      await chrome.storage.sync.set({ settings: currentSettings });
    } catch (e) {
      console.log('Settings saved locally only');
    }
    
    // Tell all tabs to update settings
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      try {
        await chrome.tabs.sendMessage(tab.id, {
          type: 'updateSettings',
          settings: currentSettings
        });
      } catch (e) {
        // Tab might not have content script
      }
    }
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

function initToggleButton(initialState, tabId) {
  const toggleBtn = document.getElementById('toggle-btn');
  const statusText = document.getElementById('status-text');
  
  function updateButton(enabled) {
    toggleBtn.classList.toggle('active', enabled);
    toggleBtn.textContent = enabled ? 'ON' : 'OFF';
    statusText.textContent = enabled ? 'Highlighter is active' : '';
  }
  
  updateButton(initialState);
  
  toggleBtn.addEventListener('click', async () => {
    const newState = !toggleBtn.classList.contains('active');
    updateButton(newState);
    
    // Tell background to update state
    chrome.runtime.sendMessage({
      type: 'setState',
      tabId: tabId,
      enabled: newState
    });
  });
}

function initShortcutInputs() {
  const inputs = {
    up: document.getElementById('shortcut-up'),
    down: document.getElementById('shortcut-down')
  };
  
  Object.entries(inputs).forEach(([action, input]) => {
    let recording = false;
    
    input.addEventListener('click', () => {
      if (!recording) {
        recording = true;
        input.value = 'Press any key';
        input.classList.add('recording');
      }
    });
    
    input.addEventListener('keydown', (e) => {
      if (!recording) return;
      
      e.preventDefault();
      
      if (e.key === 'Escape') {
        recording = false;
        input.classList.remove('recording');
        updateShortcutDisplay();
        return;
      }
      
      // Ignore pure modifier key presses
      if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
        return;
      }
      
      // Build shortcut object
      let key = '';
      
      // Use e.code to get the physical key
      if (e.code.startsWith('Key')) {
        key = e.code.substring(3).toLowerCase();
      } else if (e.code.startsWith('Digit')) {
        key = e.code.substring(5);
      } else if (e.code.startsWith('Numpad')) {
        key = e.code.substring(6).toLowerCase();
      } else {
        // For other keys, use a simplified version of the code
        const codeMap = {
          'Space': 'space',
          'Enter': 'enter',
          'Tab': 'tab',
          'Backspace': 'backspace',
          'Delete': 'delete',
          'ArrowUp': 'up',
          'ArrowDown': 'down',
          'ArrowLeft': 'left',
          'ArrowRight': 'right',
          'Minus': '-',
          'Equal': '=',
          'BracketLeft': '[',
          'BracketRight': ']',
          'Semicolon': ';',
          'Quote': "'",
          'Backquote': '`',
          'Backslash': '\\',
          'Comma': ',',
          'Period': '.',
          'Slash': '/'
        };
        key = codeMap[e.code] || e.key.toLowerCase();
      }
      
      const shortcut = {
        key: key,
        modifiers: []
      };
      
      if (e.altKey) shortcut.modifiers.push('alt');
      if (e.ctrlKey || e.metaKey) shortcut.modifiers.push('ctrl');
      if (e.shiftKey) shortcut.modifiers.push('shift');
      
      // Update settings
      currentSettings.shortcuts[action] = shortcut;
      saveSettings();
      
      recording = false;
      input.classList.remove('recording');
      updateShortcutDisplay();
    });
    
    input.addEventListener('blur', () => {
      if (recording) {
        recording = false;
        input.classList.remove('recording');
        updateShortcutDisplay();
      }
    });
  });
  
  // Reset button
  document.getElementById('reset-shortcuts').addEventListener('click', () => {
    currentSettings.shortcuts = {
      toggle: { key: ';', modifiers: ['ctrl'] },
      up: { key: 'f', modifiers: [] },
      down: { key: 'v', modifiers: [] }
    };
    saveSettings();
    updateShortcutDisplay();
  });
}

function updateShortcutDisplay() {
  const inputs = {
    up: document.getElementById('shortcut-up'),
    down: document.getElementById('shortcut-down')
  };
  
  Object.entries(inputs).forEach(([action, input]) => {
    const shortcut = currentSettings.shortcuts[action];
    input.value = formatShortcut(shortcut);
  });
}

function formatShortcut(shortcut) {
  const parts = [];
  
  if (shortcut.modifiers.includes('ctrl')) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (shortcut.modifiers.includes('alt')) {
    parts.push(isMac ? '⌥' : 'Alt');
  }
  if (shortcut.modifiers.includes('shift')) {
    parts.push('Shift');
  }
  
  parts.push(shortcut.key.toUpperCase());
  
  return parts.join('+');
}

function initColorPicker() {
  const colorButtons = document.querySelectorAll('.color-btn');
  
  console.log('Color buttons found:', colorButtons.length);
  console.log('Colors object:', colors);
  
  colorButtons.forEach(btn => {
    const colorKey = btn.dataset.color;
    const color = colors[colorKey];
    
    if (!color) {
      console.error(`Color not found for key: ${colorKey}`);
      return;
    }
    
    // Debug log
    console.log(`Setting color ${colorKey}:`, color.hex);
    
    // Set background color directly
    btn.style.cssText += `background-color: ${color.hex} !important;`;
    
    // Add color name for accessibility (only if not already added)
    if (!btn.querySelector('.color-name')) {
      const nameSpan = document.createElement('span');
      nameSpan.className = 'color-name';
      nameSpan.textContent = color.name;
      btn.appendChild(nameSpan);
    }
    
    // Set initial selection
    if (colorKey === currentSettings.color) {
      btn.classList.add('selected');
    } else {
      btn.classList.remove('selected');
    }
    
    btn.addEventListener('click', () => {
      // Remove previous selection
      colorButtons.forEach(b => b.classList.remove('selected'));
      
      // Set new selection
      btn.classList.add('selected');
      currentSettings.color = colorKey;
      saveSettings();
    });
  });
}

// Initialize Chrome command display and clickable shortcut
async function initChromeCommand() {
  // Get Chrome commands
  const commands = await chrome.runtime.sendMessage({ type: 'getCommands' });
  
  // Find the toggle command
  const toggleCommand = commands?.find(cmd => cmd.name === 'toggle-highlighter');
  
  // Display toggle shortcut
  const toggleBtn = document.getElementById('toggle-shortcut');
  if (toggleBtn) {
    if (toggleCommand && toggleCommand.shortcut) {
      toggleBtn.textContent = toggleCommand.shortcut;
    } else {
      toggleBtn.textContent = 'Not set';
    }
    
    // Make clickable to open Chrome settings
    toggleBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
    });
  }
}