# Line Highlighter

Lose track of how far you've read on a web page? Line Highlighter is a browser extension that highlights your current position on any website, allowing you to easily keep track of where you are. The highlighter snaps to text and allows you to easily move through the page.

<img src="assets/demo.gif" alt="Line Highlighter Demo" width="400">

## How It Works

Press `⌘E` (Mac) or `Alt+L` (Windows/Linux) to turn the highlighter on, then click any line of text. Move up or down line by line with the keyboard. The highlight stays on its line while you scroll, including inside scrollable panels.

| Shortcut | Action |
|----------|--------|
| `⌘E` (Mac) / `Alt+L` (PC) | Turn Line Highlighter on or off |
| `⌥L` (Mac) / `Alt+H` (PC) | Open the extension popup |
| `F` | Move to previous line |
| `V` | Move to next line |

**Note:** Change `F` and `V` in the extension popup. Change the on/off and popup shortcuts at `chrome://extensions/shortcuts`.

## Features

- **Smart Line Detection**: Automatically detects and highlights the line of text you click on
- **Intelligent Navigation**: Move between lines of text on a page with keyboard shortcuts
- **Customizable Shortcuts**: Change keyboard shortcuts to your preference via the popup
- **Multiple Colors**: Choose from 6 highlighter colors (yellow, orange, pink, green, blue, purple)
- **Visual Feedback**: Extension icon shows when highlighter is active
- **No Dependencies**: Pure vanilla JavaScript, lightweight and fast

## Technical Implementation

Line Highlighter uses the following algorithm to detect and track individual lines of text:

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
   - Skips navigation, sidebar, breadcrumb, and table-of-contents elements by matching whole class names

3. **Deduplication**: Lines at the same vertical position (within 2px) are merged to handle multi-column layouts and inline elements.

4. **Line Tracking**: The highlight is anchored to a line (its text node and line index), not to a pixel position. It uses `position: fixed`, and on every scroll it recomputes the line's on-screen rectangle. A capture-phase scroll listener catches scrolling inside inner containers too. A resize that re-wraps text can shift the anchor to a nearby line.

5. **Smart Scrolling**: When you move to a line near the top or bottom edge, the extension calls `scrollIntoView` with smooth scrolling. This works whether the page or an inner container scrolls.

---

Created with ❤️ by [Kyle Chadha](https://twitter.com/kylechadha)