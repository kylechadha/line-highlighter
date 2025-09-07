(() => {
  'use strict';

  let state = {
    enabled: false,
    currentLineElement: null,
    currentLineRect: null,
    textLines: [],
    currentLineIndex: -1,
    currentPageY: 0,  // Track absolute page position
    cursorPosition: 0  // Track cursor position
  };

  let highlighter = null;

  function init() {
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeydown);
  }

  function createHighlighter() {
    if (highlighter) return;
    
    highlighter = document.createElement('div');
    highlighter.id = 'line-highlighter-marker';
    highlighter.style.cssText = `
      position: absolute;
      left: 0;
      width: 100%;
      height: 24px;
      background-color: yellow;
      mix-blend-mode: multiply;
      pointer-events: none;
      z-index: 2147483647;
      display: none;
      transition: top 0.1s ease-out;
    `;
    
    document.body.appendChild(highlighter);
    
  }

  function removeHighlighter() {
    if (highlighter) {
      highlighter.remove();
      highlighter = null;
    }
  }

  function handleClick(e) {
    if (!state.enabled) return;
    
    // Don't process clicks on our own elements
    if (e.target.id === 'line-highlighter-marker' || e.target.id === 'line-highlighter-cursor') {
      return;
    }
    
    // Use pageY for absolute positioning
    const lineInfo = findLineAtClick(e.clientX, e.clientY, e.pageX, e.pageY);
    if (lineInfo) {
      state.currentPageY = lineInfo.pageY;
      positionHighlighter(lineInfo);
      scanTextLinesNearby(lineInfo);
    }
  }

  function findLineAtClick(clientX, clientY, pageX, pageY) {
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
        for (const rect of rects) {
          if (clientY >= rect.top && clientY <= rect.bottom && 
              clientX >= rect.left && clientX <= rect.right) {
            return {
              rect: rect,
              node: textNode,
              element: textNode.parentElement,
              pageY: pageY - clientY + rect.top + rect.height / 2
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
      let minDistance = Infinity;
      
      for (const rect of rects) {
        const distance = Math.abs(clientY - (rect.top + rect.height / 2));
        if (distance < minDistance) {
          minDistance = distance;
          closestRect = rect;
        }
      }
      
      if (closestRect && minDistance < 50) { // Within 50px of a line
        return {
          rect: closestRect,
          node: element,
          element: element,
          pageY: pageY - clientY + closestRect.top + closestRect.height / 2
        };
      }
    }
    
    return null;
  }

  function getElementLineInfo(element, clientY, pageY) {
    if (!element) return null;
    
    // Get all text nodes within this element
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          return node.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      }
    );
    
    let textNode;
    while (textNode = walker.nextNode()) {
      const range = document.createRange();
      range.selectNodeContents(textNode);
      const rects = Array.from(range.getClientRects());
      
      for (const rect of rects) {
        if (clientY >= rect.top && clientY <= rect.bottom) {
          return {
            rect: rect,
            node: textNode,
            element: textNode.parentElement,
            pageY: pageY - clientY + rect.top + rect.height / 2
          };
        }
      }
    }
    
    return null;
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
        if (rect.height > 5 && rect.height < 100 && rect.width > 20) {
          // Calculate absolute page position
          const pageTop = window.pageYOffset + rect.top;
          
          // Get the actual text content for this line to determine its real width
          const textContent = textNode.textContent;
          const textLength = textContent.trim().length;
          
          allLines.push({
            rect: rect,
            node: textNode,
            element: textNode.parentElement,
            top: rect.top,
            pageTop: pageTop,
            left: rect.left,
            width: rect.width,
            textLength: textLength
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
    
    // Find current line index
    const currentPageTop = window.pageYOffset + currentLine.rect.top;
    for (let i = 0; i < state.textLines.length; i++) {
      const line = state.textLines[i];
      if (Math.abs(line.pageTop - currentPageTop) < 5) {
        state.currentLineIndex = i;
        break;
      }
    }
    
    // If we didn't find exact match, find closest
    if (state.currentLineIndex === -1 && state.textLines.length > 0) {
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

  function positionHighlighter(lineInfo) {
    if (!highlighter || !lineInfo) return;
    
    const rect = lineInfo.rect;
    state.currentLineRect = rect;
    
    // Use absolute positioning with pageY
    const pageTop = window.pageYOffset + rect.top;
    highlighter.style.top = `${pageTop}px`;
    highlighter.style.height = `${rect.height}px`;
    highlighter.style.display = 'block';
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
      
      // Position using absolute page coordinates
      highlighter.style.top = `${lineInfo.pageTop}px`;
      highlighter.style.height = `${lineInfo.rect.height}px`;
      highlighter.style.display = 'block';
      
      // Scroll if necessary - only if line is not fully visible
      const rect = lineInfo.rect;
      const scrollTop = window.pageYOffset;
      const viewportTop = scrollTop;
      const viewportBottom = scrollTop + window.innerHeight;
      const lineTop = lineInfo.pageTop;
      const lineBottom = lineInfo.pageTop + rect.height;
      
      // Only scroll if line is not fully visible in viewport
      if (lineTop < viewportTop + 50 || lineBottom > viewportBottom - 50) {
        // Calculate scroll to center the line
        const targetScroll = lineInfo.pageTop - (window.innerHeight / 2);
        window.scrollTo({
          top: targetScroll,
          behavior: 'smooth'
        });
      }
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
        e.preventDefault();
        navigateToLine('up');
        break;
        
      case 'v':
        e.preventDefault();
        navigateToLine('down');
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