(() => {
  'use strict';

  let state = {
    enabled: false,
    currentLineElement: null,
    currentLineRect: null,
    textLines: [],
    currentLineIndex: -1
  };

  let highlighter = null;
  let cursor = null;

  function init() {
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeydown);
  }

  function createHighlighter() {
    if (highlighter) return;
    
    highlighter = document.createElement('div');
    highlighter.id = 'line-highlighter-marker';
    highlighter.style.cssText = `
      position: fixed;
      left: 0;
      width: 100vw;
      height: 24px;
      background-color: yellow;
      mix-blend-mode: multiply;
      pointer-events: none;
      z-index: 2147483647;
      display: none;
      transition: top 0.2s ease-out, height 0.1s ease-out;
    `;
    
    cursor = document.createElement('div');
    cursor.id = 'line-highlighter-cursor';
    cursor.style.cssText = `
      position: absolute;
      width: 3px;
      height: 100%;
      background-color: #C6C600;
      display: none;
      animation: blink 1s infinite;
    `;
    
    highlighter.appendChild(cursor);
    document.body.appendChild(highlighter);
    
    // Add blink animation
    if (!document.getElementById('line-highlighter-styles')) {
      const style = document.createElement('style');
      style.id = 'line-highlighter-styles';
      style.textContent = `
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  function removeHighlighter() {
    if (highlighter) {
      highlighter.remove();
      highlighter = null;
      cursor = null;
    }
  }

  function handleClick(e) {
    if (!state.enabled) return;
    
    // Don't process clicks on our own elements
    if (e.target.id === 'line-highlighter-marker' || e.target.id === 'line-highlighter-cursor') {
      return;
    }
    
    const lineInfo = detectLineAtPoint(e.clientX, e.clientY);
    if (lineInfo) {
      positionHighlighter(lineInfo);
      findNearbyLines(lineInfo);
      updateCursorPosition(e.clientX);
    }
  }

  function detectLineAtPoint(x, y) {
    // Try caretPositionFromPoint first (better browser support)
    let caretPos = null;
    if (document.caretPositionFromPoint) {
      caretPos = document.caretPositionFromPoint(x, y);
    } else if (document.caretRangeFromPoint) {
      const range = document.caretRangeFromPoint(x, y);
      if (range) {
        caretPos = {
          offsetNode: range.startContainer,
          offset: range.startOffset
        };
      }
    }
    
    if (!caretPos || !caretPos.offsetNode) {
      // Fallback: find element at point
      const element = document.elementFromPoint(x, y);
      if (element && element.textContent) {
        return getElementLineInfo(element, y);
      }
      return null;
    }
    
    // Get the text node
    const textNode = caretPos.offsetNode.nodeType === Node.TEXT_NODE 
      ? caretPos.offsetNode 
      : caretPos.offsetNode.childNodes[caretPos.offset];
    
    if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
      return getElementLineInfo(caretPos.offsetNode, y);
    }
    
    // Create a range for the entire text node to find line boundaries
    const range = document.createRange();
    range.selectNodeContents(textNode);
    
    // Get all client rects (one per line)
    const rects = Array.from(range.getClientRects());
    
    // Find which rect contains our y coordinate
    for (const rect of rects) {
      if (y >= rect.top && y <= rect.bottom) {
        return {
          rect: rect,
          node: textNode,
          element: textNode.parentElement
        };
      }
    }
    
    // Fallback to element
    return getElementLineInfo(textNode.parentElement, y);
  }

  function getElementLineInfo(element, y) {
    if (!element) return null;
    
    // For block elements with text, try to find the specific line
    const range = document.createRange();
    range.selectNodeContents(element);
    
    const rects = Array.from(range.getClientRects());
    for (const rect of rects) {
      if (y >= rect.top && y <= rect.bottom) {
        return {
          rect: rect,
          node: element,
          element: element
        };
      }
    }
    
    // If no specific line found, use element's bounding rect
    const rect = element.getBoundingClientRect();
    if (rect.height > 0) {
      return {
        rect: rect,
        node: element,
        element: element
      };
    }
    
    return null;
  }

  function findNearbyLines(currentLine) {
    state.textLines = [];
    state.currentLineIndex = -1;
    
    if (!currentLine || !currentLine.element) return;
    
    // Get the parent container
    let container = currentLine.element;
    while (container && container.parentElement && !isMainContent(container)) {
      container = container.parentElement;
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
          
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );
    
    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }
    
    // Get line rects for all text nodes
    const allLines = [];
    for (const textNode of textNodes) {
      const range = document.createRange();
      range.selectNodeContents(textNode);
      const rects = Array.from(range.getClientRects());
      
      for (const rect of rects) {
        if (rect.height > 5 && rect.width > 20) {
          allLines.push({
            rect: rect,
            node: textNode,
            element: textNode.parentElement,
            top: rect.top
          });
        }
      }
    }
    
    // Sort by vertical position
    allLines.sort((a, b) => a.top - b.top);
    
    // Remove duplicates (lines at same position)
    state.textLines = allLines.filter((line, index) => {
      if (index === 0) return true;
      const prev = allLines[index - 1];
      return Math.abs(line.top - prev.top) > 2;
    });
    
    // Find current line index
    for (let i = 0; i < state.textLines.length; i++) {
      const line = state.textLines[i];
      if (Math.abs(line.top - currentLine.rect.top) < 2) {
        state.currentLineIndex = i;
        break;
      }
    }
  }

  function isMainContent(element) {
    const tag = element.tagName?.toLowerCase();
    return ['article', 'main', 'body', 'section', 'div'].includes(tag);
  }

  function positionHighlighter(lineInfo) {
    if (!highlighter || !lineInfo) return;
    
    const rect = lineInfo.rect;
    state.currentLineRect = rect;
    
    highlighter.style.top = `${rect.top}px`;
    highlighter.style.height = `${rect.height}px`;
    highlighter.style.display = 'block';
  }

  function updateCursorPosition(x) {
    if (!cursor || !highlighter) return;
    
    const highlighterRect = highlighter.getBoundingClientRect();
    const relativeX = x - highlighterRect.left;
    
    cursor.style.left = `${Math.max(0, Math.min(relativeX, highlighterRect.width - 3))}px`;
  }

  function moveToLine(direction) {
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
      positionHighlighter(lineInfo);
      
      // Scroll if necessary
      const rect = lineInfo.rect;
      if (rect.top < 50 || rect.bottom > window.innerHeight - 50) {
        window.scrollBy({
          top: rect.top - window.innerHeight / 2,
          behavior: 'smooth'
        });
      }
    }
  }

  function adjustLineHeight(delta) {
    if (!highlighter) return;
    
    const currentHeight = parseInt(highlighter.style.height) || 24;
    const newHeight = Math.max(10, Math.min(100, currentHeight + delta));
    
    highlighter.style.height = `${newHeight}px`;
    if (cursor) {
      cursor.style.height = '100%';
    }
  }

  function handleKeydown(e) {
    // Toggle with Ctrl/Cmd + E
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
      e.preventDefault();
      state.enabled = !state.enabled;
      
      if (state.enabled) {
        createHighlighter();
        console.log('Line Highlighter: Enabled - Click on text to highlight');
      } else {
        removeHighlighter();
        state.textLines = [];
        state.currentLineIndex = -1;
        console.log('Line Highlighter: Disabled');
      }
      return;
    }
    
    if (!state.enabled) return;
    
    // Handle navigation keys
    switch(e.key.toLowerCase()) {
      case 'f':
      case 'arrowup':
        e.preventDefault();
        moveToLine('up');
        break;
        
      case 'v':
      case 'arrowdown':
        e.preventDefault();
        moveToLine('down');
        break;
        
      case 'd':
        e.preventDefault();
        if (highlighter) {
          const top = parseInt(highlighter.style.top) || 0;
          highlighter.style.top = `${top - 2}px`;
        }
        break;
        
      case 'c':
        e.preventDefault();
        if (highlighter) {
          const top = parseInt(highlighter.style.top) || 0;
          highlighter.style.top = `${top + 2}px`;
        }
        break;
        
      case 'j':
        e.preventDefault();
        adjustLineHeight(2);
        break;
        
      case 'n':
        e.preventDefault();
        adjustLineHeight(-2);
        break;
        
      case 'g':
        e.preventDefault();
        if (cursor) {
          cursor.style.display = cursor.style.display === 'none' ? 'block' : 'none';
        }
        break;
        
      case 'i':
        e.preventDefault();
        if (cursor) {
          const left = parseInt(cursor.style.left) || 0;
          cursor.style.left = `${Math.max(0, left - 10)}px`;
        }
        break;
        
      case 'o':
        e.preventDefault();
        if (cursor) {
          const left = parseInt(cursor.style.left) || 0;
          cursor.style.left = `${left + 10}px`;
        }
        break;
    }
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();