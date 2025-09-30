// Background service worker for Line Highlighter
// Manages icon state and coordinates between tabs

// Track enabled state per tab
const tabStates = new Map();

// Update icon based on state
function updateIcon(tabId, enabled) {
  // Use PNG icon with absolute path
  const iconPath = enabled ? '/assets/icons/active.png' : '/assets/icons/inactive.png';
  
  chrome.action.setIcon({
    path: {
      "128": iconPath
    },
    tabId: tabId
  });
}

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'stateChanged') {
    // Update icon when extension is toggled
    if (sender.tab) {
      tabStates.set(sender.tab.id, message.enabled);
      updateIcon(sender.tab.id, message.enabled);
    }
  } else if (message.type === 'getState') {
    // Popup is asking for current state
    const tabId = message.tabId;
    sendResponse({ enabled: tabStates.get(tabId) || false });
  } else if (message.type === 'setState') {
    // Popup is setting state
    const tabId = message.tabId;
    tabStates.set(tabId, message.enabled);
    updateIcon(tabId, message.enabled);
    
    // Tell content script to update
    chrome.tabs.sendMessage(tabId, {
      type: 'setEnabled',
      enabled: message.enabled
    });
  } else if (message.type === 'getCommands') {
    // Popup is asking for Chrome commands
    chrome.commands.getAll().then(commands => {
      sendResponse(commands);
    });
    return true; // Keep channel open for async response
  }
  
  return true; // Keep message channel open for async response
});

// Clean up when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  tabStates.delete(tabId);
});

// Set default icon on install/update
chrome.runtime.onInstalled.addListener((details) => {
  // Set default inactive icon for all tabs
  chrome.action.setIcon({
    path: {
      "128": "/assets/icons/inactive.png"
    }
  });
  
  // Open popup on first install
  if (details.reason === 'install') {
    // Mark that we should show welcome animation
    chrome.storage.local.set({ showWelcome: true });
    
    // Open the popup
    chrome.action.openPopup();
  }
});

// Handle Chrome keyboard commands
chrome.commands.onCommand.addListener((command, tab) => {
  if (command === 'toggle-highlighter' && tab) {
    // Get current state
    const currentState = tabStates.get(tab.id) || false;
    const newState = !currentState;
    
    // Update state
    tabStates.set(tab.id, newState);
    updateIcon(tab.id, newState);
    
    // Send toggle message to content script
    chrome.tabs.sendMessage(tab.id, {
      type: 'setEnabled',
      enabled: newState
    });
  }
});