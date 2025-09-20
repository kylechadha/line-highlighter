// Background service worker for Line Highlighter
// Manages icon state and coordinates between tabs

// Track enabled state per tab
const tabStates = new Map();

// Update icon based on state
function updateIcon(tabId, enabled) {
  // Use PNG icon
  const iconPath = enabled ? 'assets/icons/active.png' : 'assets/icons/inactive.png';
  
  chrome.action.setIcon({
    path: {
      "128": iconPath
    },
    tabId: tabId
  }).catch(err => {
    // Fallback to badge if icon fails
    console.log('Icon failed, using badge:', err);
    chrome.action.setBadgeText({
      text: enabled ? 'ON' : '',
      tabId: tabId
    });
    
    chrome.action.setBadgeBackgroundColor({
      color: enabled ? '#FFE066' : '#666666',
      tabId: tabId
    });
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
  }
  
  return true; // Keep message channel open for async response
});

// Clean up when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  tabStates.delete(tabId);
});

// Set default icon on install/update
chrome.runtime.onInstalled.addListener(() => {
  // Set default inactive icon for all tabs
  chrome.action.setIcon({
    path: {
      "128": "assets/icons/inactive.png"
    }
  });
});