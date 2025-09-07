# Line Highlighter

Lose track of how far you've read on a web page? Line Highlighter is a Chrome extension that highlights your current position on any website, allowing you to keep track of where you are.

## Features

- **Smart Line Detection**: Automatically detects and highlights the line of text you click on
- **Intelligent Navigation**: Move between lines of text on a page with keyboard shortcuts
- **No Dependencies**: Pure vanilla JavaScript, lightweight and fast

## How It Works

Click on any text to highlight that line with a yellow bar. Then use keyboard shortcuts to navigate between lines. Perfect for reading long articles, documentation, or anywhere else you might want to keep your place during interruptions.

![Line Highlighter Demo](demo.gif)

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + E` | Enable/disable Line Highlighter |
| `F` | Move to previous line |
| `V` | Move to next line |

## Technical Implementation

Line Highlighter uses the following algorithm to accurately detect and track individual lines of text:

1. **Click Position Analysis**: When you click, the extension uses `caretPositionFromPoint()` or `caretRangeFromPoint()` to identify the exact text node and character offset at the click coordinates.

2. **Line Boundary Detection**: Once a text node is identified, the extension creates a `Range` object around it and calls `getClientRects()`. This returns a collection of `DOMRect` objects, one for each visual line the text spans.

3. **Line Matching**: The algorithm iterates through the rectangles to find which one contains the click coordinates, ensuring we highlight the line clicked, not the entire paragraph.

4. **Fallback Strategy**: If caret position APIs aren't available or return null (common with certain CSS layouts), the extension falls back to:
   - Using `elementFromPoint()` to find the nearest text element
   - Creating ranges around text nodes within that element
   - Finding the closest line rectangle within 50px of the click

### Navigation System

1. **Text Tree Walking**: The extension uses `TreeWalker` API to traverse all text nodes in the reading area, filtering out hidden elements and empty text.

2. **Line Collection**: For each text node, it:
   - Creates a range and gets all line rectangles
   - Filters out lines that are too small (< 5px height) or too large (> 100px, likely containers)
   - Stores absolute page positions using `pageYOffset + rect.top`

3. **Deduplication**: Lines at the same vertical position (within 2px) are merged to handle multi-column layouts and inline elements.

4. **Smart Scrolling**: When navigating between lines, the extension:
   - Updates the highlighter position using absolute page coordinates
   - Automatically scrolls if the target line is near viewport edges
   - Uses smooth scrolling for better reading experience

---

Created with ❤️ by [Kyle Chadha](https://twitter.com/kylechadha)