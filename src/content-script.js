(() => {
  'use strict';

  let state = {
    enabled: false,
    textLines: [],
    currentLineIndex: -1,
    anchor: null  // { node, rectIndex } the line the bar is glued to
  };

  // Default settings
  let settings = {
    shortcuts: {
      toggle: { key: ';', modifiers: ['ctrl'] }, // Cmd+; on Mac, Ctrl+; on Windows
      up: { key: 'f', modifiers: [] },
      down: { key: 'v', modifiers: [] }
    },
    color: 'yellow' // Default to original yellow
  };

  let highlighter = null;
  let rafPending = false;

  // Transition with a vertical glide, used for click/keyboard moves
  const TRANSITION_MOVE = 'top 0.12s cubic-bezier(0.25, 0.46, 0.45, 0.94), height 0.12s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.12s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.1s ease-out';
  // Transition without top/height glide, used while tracking scroll (1:1 follow)
  const TRANSITION_TRACK = 'transform 0.12s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.1s ease-out';

  async function init() {
    // Load settings from storage with fallback
    await loadSettings();

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeydown);

    // Keep the bar glued to its line when the page (or an inner container) scrolls.
    // Capture phase catches scroll events from inner scrollable containers, which do not bubble.
    window.addEventListener('scroll', scheduleRender, true);
    window.addEventListener('resize', scheduleRender);

    // Listen for settings changes from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'updateSettings') {
        settings = message.settings;
        saveSettings(settings);
        if (highlighter) {
          updateHighlighterColor();
        }
      } else if (message.type === 'setEnabled') {
        state.enabled = message.enabled;
        if (state.enabled) {
          createHighlighter();
        } else {
          removeHighlighter();
        }
      }
    });
  }

  async function loadSettings() {
    try {
      // Try sync storage first
      let result = await chrome.storage.sync.get('settings');
      if (result.settings && validateSettings(result.settings)) {
        settings = result.settings;
      } else {
        // Fallback to local storage
        result = await chrome.storage.local.get('settings');
        if (result.settings && validateSettings(result.settings)) {
          settings = result.settings;
        }
      }
    } catch (e) {
      // Use defaults on error
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

    return true;
  }

  async function saveSettings(newSettings) {
    try {
      // Save to both local and sync
      await chrome.storage.local.set({ settings: newSettings });
      try {
        await chrome.storage.sync.set({ settings: newSettings });
      } catch (e) {
        // Sync failed, but local is saved
        console.log('Settings saved locally only');
      }
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }

  function createHighlighter() {
    if (highlighter) return;

    highlighter = document.createElement('div');
    highlighter.id = 'line-highlighter-marker';
    highlighter.style.cssText = `
      position: fixed;
      left: 0;
      width: 100%;
      height: 24px;
      background-color: ${getColorValue(settings.color)};
      mix-blend-mode: multiply;
      pointer-events: none;
      z-index: 2147483647;
      display: none;
      transition: ${TRANSITION_TRACK};
    `;

    document.body.appendChild(highlighter);
  }

  function removeHighlighter() {
    if (highlighter) {
      highlighter.style.display = 'none';
      highlighter.remove();
      highlighter = null;
    }
    state.anchor = null;
    state.textLines = [];
    state.currentLineIndex = -1;
  }

  function handleClick(e) {
    if (!state.enabled) return;

    // Don't process clicks on our own elements
    if (e.target.id === 'line-highlighter-marker' || e.target.id === 'line-highlighter-cursor') {
      return;
    }

    const lineInfo = findLineAtClick(e.clientX, e.clientY);
    if (lineInfo) {
      positionHighlighter(lineInfo);
      scanTextLinesNearby(lineInfo);
    }
  }

  function findLineAtClick(clientX, clientY) {
    // Try caretPositionFromPoint first
    let caretPos = null;
    if (document.caretPositionFromPoint) {
      caretPos = document.caretPositionFromPoint(clientX, clientY);
    } else if (document.caretRangeFromPoint) {
      const range = document.caretRangeFromPoint(clientX, clientY);
      if (range) {
        caretPos = {
          offsetNode: range.startContainer,
          offset: range.startOffset
        };
      }
    }

    // If we got a caret position, use it
    if (caretPos && caretPos.offsetNode) {
      const textNode = caretPos.offsetNode.nodeType === Node.TEXT_NODE
        ? caretPos.offsetNode
        : caretPos.offsetNode.childNodes[caretPos.offset];

      if (textNode && textNode.nodeType === Node.TEXT_NODE) {
        // Create a range for just the clicked line
        const range = document.createRange();
        range.selectNodeContents(textNode);

        // Get all line rectangles for this text node
        const rects = Array.from(range.getClientRects());

        // Find the specific line that was clicked
        for (let i = 0; i < rects.length; i++) {
          const rect = rects[i];
          if (clientY >= rect.top && clientY <= rect.bottom &&
              clientX >= rect.left && clientX <= rect.right) {
            return {
              rect: rect,
              node: textNode,
              element: textNode.parentElement,
              rectIndex: i
            };
          }
        }
      }
    }

    // Fallback: find the closest text element
    const element = document.elementFromPoint(clientX, clientY);
    if (element && element.textContent && element.textContent.trim()) {
      // For inline elements, try to get specific line
      const range = document.createRange();
      range.selectNodeContents(element);
      const rects = Array.from(range.getClientRects());

      // Find closest line rect
      let closestRect = null;
      let closestIndex = -1;
      let minDistance = Infinity;

      for (let i = 0; i < rects.length; i++) {
        const rect = rects[i];
        const distance = Math.abs(clientY - (rect.top + rect.height / 2));
        if (distance < minDistance) {
          minDistance = distance;
          closestRect = rect;
          closestIndex = i;
        }
      }

      if (closestRect && minDistance < 50) { // Within 50px of a line
        return {
          rect: closestRect,
          node: element,
          element: element,
          rectIndex: closestIndex
        };
      }
    }

    return null;
  }

  // Class/id tokens that mark an element as page chrome (nav, sidebar, TOC) rather
  // than content. Matched per whitespace-delimited class token so color/utility
  // tokens like Tailwind's "bg-nav-bg-paper" do not trip a naive substring check.
  const NAV_KEYWORDS = ['nav', 'navbar', 'navigation', 'sidebar', 'breadcrumb', 'breadcrumbs', 'toc'];

  function isNavToken(token) {
    return NAV_KEYWORDS.some((k) =>
      token === k ||
      token.startsWith(k + '-') || token.startsWith(k + '_') ||
      token.endsWith('-' + k) || token.endsWith('_' + k)
    );
  }

  function isNavLike(element) {
    if (!element || !element.tagName) return false;
    if (element.tagName === 'NAV' || element.tagName === 'ASIDE') return true;

    const role = (element.getAttribute && element.getAttribute('role') || '').toLowerCase();
    if (role === 'navigation' || role === 'complementary') return true;

    // Use getAttribute('class') so SVG elements (className is an object there) work too.
    const cls = (element.getAttribute && element.getAttribute('class')) || '';
    const raw = (cls + ' ' + (element.id || '')).toLowerCase();
    const tokens = raw.split(/\s+/).filter(Boolean);
    return tokens.some(isNavToken);
  }

  function scanTextLinesNearby(currentLine) {
    state.textLines = [];
    state.currentLineIndex = -1;

    if (!currentLine || !currentLine.element) return;

    // Get the parent container - go higher up to catch all content
    let container = currentLine.element;
    let attempts = 0;
    while (container && container.parentElement && !isMainContent(container) && attempts < 10) {
      container = container.parentElement;
      attempts++;
    }

    // If we're in an article, make sure we get the whole article
    const article = container.closest('article');
    if (article) {
      container = article;
    }

    // Find all text nodes in the container
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const text = node.textContent.trim();
          if (text.length < 2) return NodeFilter.FILTER_REJECT;

          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;

          const style = window.getComputedStyle(parent);
          if (style.display === 'none' || style.visibility === 'hidden') {
            return NodeFilter.FILTER_REJECT;
          }

          // Skip if parent is script or style
          if (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') {
            return NodeFilter.FILTER_REJECT;
          }

          // Skip navigation, sidebar, breadcrumb, and TOC elements
          let checkElement = parent;
          while (checkElement && checkElement !== document.body) {
            if (isNavLike(checkElement)) {
              return NodeFilter.FILTER_REJECT;
            }
            checkElement = checkElement.parentElement;
          }

          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }

    // Get one entry per visible line rect across all text nodes
    const allLines = [];
    for (const textNode of textNodes) {
      const range = document.createRange();
      range.selectNodeContents(textNode);
      const rects = Array.from(range.getClientRects());

      for (let i = 0; i < rects.length; i++) {
        const rect = rects[i];
        if (rect.height > 5 && rect.height < 100 && rect.width > 20) {
          allLines.push({
            node: textNode,
            rectIndex: i,
            pageTop: window.pageYOffset + rect.top  // absolute page position, for ordering
          });
        }
      }
    }

    // Sort by vertical position
    allLines.sort((a, b) => a.pageTop - b.pageTop);

    // Remove duplicates (lines at same position)
    state.textLines = allLines.filter((line, index) => {
      if (index === 0) return true;
      const prev = allLines[index - 1];
      return Math.abs(line.pageTop - prev.pageTop) > 2;
    });

    // Find current line index by the exact node + line clicked
    for (let i = 0; i < state.textLines.length; i++) {
      const line = state.textLines[i];
      if (line.node === currentLine.node && line.rectIndex === currentLine.rectIndex) {
        state.currentLineIndex = i;
        break;
      }
    }

    // If we didn't find exact match, find closest by page position
    if (state.currentLineIndex === -1 && state.textLines.length > 0) {
      const currentPageTop = window.pageYOffset + currentLine.rect.top;
      let minDistance = Infinity;
      for (let i = 0; i < state.textLines.length; i++) {
        const distance = Math.abs(state.textLines[i].pageTop - currentPageTop);
        if (distance < minDistance) {
          minDistance = distance;
          state.currentLineIndex = i;
        }
      }
    }
  }

  function isMainContent(element) {
    const tag = element.tagName?.toLowerCase();
    return ['article', 'main', 'body', 'section'].includes(tag);
  }

  // Live viewport rect for the anchored line, recomputed from the DOM so it stays
  // correct through scrolling. Returns null if the line is gone.
  // Note: rectIndex is positional within the node's client rects, so a reflow that
  // re-wraps the text (e.g. a window resize) can shift it to a different line. Scroll,
  // the common case, never reflows, so tracking stays exact there.
  function rectForAnchor(anchor) {
    if (!anchor || !anchor.node || !anchor.node.isConnected) return null;
    const range = document.createRange();
    range.selectNodeContents(anchor.node);
    const rects = range.getClientRects();
    return rects[anchor.rectIndex] || null;
  }

  // Draw the bar at its anchor's current on-screen position (position: fixed = viewport coords).
  function renderHighlighter(animate) {
    if (!highlighter || !state.anchor) return;

    const rect = rectForAnchor(state.anchor);
    if (!rect) {
      highlighter.style.display = 'none';
      return;
    }

    highlighter.style.transition = animate ? TRANSITION_MOVE : TRANSITION_TRACK;

    if (animate) {
      highlighter.style.transform = 'scaleY(1.02)';
      highlighter.style.opacity = '0.7';
      setTimeout(() => {
        highlighter.style.transform = 'scaleY(1)';
        highlighter.style.opacity = '1';
      }, 150);
    }

    highlighter.style.top = `${rect.top}px`;
    highlighter.style.height = `${rect.height}px`;
    highlighter.style.display = 'block';
  }

  // Throttle scroll/resize repositioning to one update per frame.
  function scheduleRender() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      renderHighlighter(false);
    });
  }

  // Glue the bar to a line and draw it. animate=true adds the glide/pulse used for
  // click and keyboard moves; false snaps it (used while tracking scroll).
  function positionHighlighter(lineInfo, animate = false) {
    if (!highlighter || !lineInfo) return;

    state.anchor = { node: lineInfo.node, rectIndex: lineInfo.rectIndex };
    renderHighlighter(animate);
  }


  function navigateToLine(direction) {
    if (state.textLines.length === 0) return;

    let newIndex = state.currentLineIndex;

    if (direction === 'up') {
      newIndex = Math.max(0, state.currentLineIndex - 1);
    } else {
      newIndex = Math.min(state.textLines.length - 1, state.currentLineIndex + 1);
    }

    if (newIndex !== state.currentLineIndex && state.textLines[newIndex]) {
      state.currentLineIndex = newIndex;
      const lineInfo = state.textLines[newIndex];

      // Glue the bar to the new line and glide to it
      positionHighlighter(lineInfo, true);

      // Scroll into view if needed. scrollIntoView walks every scrollable ancestor,
      // so it works whether the page scrolls the window or an inner container.
      const rect = rectForAnchor(state.anchor);
      if (rect && (rect.top < 60 || rect.bottom > window.innerHeight - 60)) {
        const target = lineInfo.node.nodeType === Node.ELEMENT_NODE
          ? lineInfo.node
          : lineInfo.node.parentElement;
        if (target) {
          target.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }
    }
  }

  function getColorValue(colorName) {
    const colors = {
      yellow: 'yellow', // CSS yellow - the original bright yellow
      orange: '#FFB86C',
      pink: '#FF79C6',
      green: '#50FA7B',
      blue: '#8BE9FD',
      purple: '#BD93F9'
    };
    return colors[colorName] || 'yellow';
  }

  function updateHighlighterColor() {
    if (highlighter) {
      highlighter.style.backgroundColor = getColorValue(settings.color);
    }
  }

  function matchesShortcut(e, shortcut) {
    const keyMatches = e.key.toLowerCase() === shortcut.key.toLowerCase();

    // Check that modifiers match exactly
    const altMatches = shortcut.modifiers.includes('alt') === e.altKey;
    const ctrlMatches = shortcut.modifiers.includes('ctrl') === (e.ctrlKey || e.metaKey);
    const shiftMatches = shortcut.modifiers.includes('shift') === e.shiftKey;

    return keyMatches && altMatches && ctrlMatches && shiftMatches;
  }

  function handleKeydown(e) {
    // Toggle with custom shortcut (default Alt+L)
    if (matchesShortcut(e, settings.shortcuts.toggle)) {
      e.preventDefault();
      state.enabled = !state.enabled;

      if (state.enabled) {
        createHighlighter();
        console.log('Line Highlighter: Enabled - Click on text to highlight');
      } else {
        removeHighlighter();
        console.log('Line Highlighter: Disabled');
      }

      // Notify background script to update icon
      chrome.runtime.sendMessage({
        type: 'stateChanged',
        enabled: state.enabled
      });

      return;
    }

    if (!state.enabled) return;

    // Don't hijack keys while the user is typing in a field. composedPath()[0]
    // sees the real target even inside a shadow root (e.target is retargeted).
    const target = (e.composedPath && e.composedPath()[0]) || e.target;
    if (target && (target.isContentEditable ||
        /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) {
      return;
    }

    // Handle navigation with custom shortcuts
    if (matchesShortcut(e, settings.shortcuts.up)) {
      e.preventDefault();
      navigateToLine('up');
    } else if (matchesShortcut(e, settings.shortcuts.down)) {
      e.preventDefault();
      navigateToLine('down');
    }
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
