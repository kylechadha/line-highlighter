# Line Highlighter

Chrome extension that is a smart reading assistant that highlights your current line on any website, allowing you to keep track of where you are with ease.

## Features

- **Smart Line Detection**: Automatically detects and highlights the exact line of text you click on
- **Intelligent Navigation**: Move between actual lines of text with keyboard shortcuts
- **Clean Interface**: Minimal, distraction-free yellow highlight that blends naturally with any page
- **Scroll-Independent**: Highlight stays with text when you scroll
- **No Dependencies**: Pure vanilla JavaScript, lightweight and fast

## How It Works

Click on any text to highlight that line with a yellow bar. Use keyboard shortcuts to navigate between lines or fine-tune the position. Perfect for reading long articles, documentation, or keeping your place during interruptions.

![Line Highlighter Demo](demo.gif)

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + E` | Enable/disable Line Highlighter |
| `F` or `↑` | Move to previous line |
| `V` or `↓` | Move to next line |
| `G` | Toggle cursor visibility |
| `I` / `O` | Move cursor left/right |

## Technical Implementation

Line Highlighter uses a sophisticated algorithm to accurately detect and track individual lines of text:

### Line Detection Algorithm

1. **Click Position Analysis**: When you click, the extension uses `caretPositionFromPoint()` or `caretRangeFromPoint()` to identify the exact text node and character offset at the click coordinates.

2. **Line Boundary Detection**: Once a text node is identified, the extension creates a `Range` object around it and calls `getClientRects()`. This returns a collection of `DOMRect` objects, one for each visual line the text spans.

3. **Line Matching**: The algorithm iterates through the rectangles to find which one contains the click coordinates, ensuring we highlight the exact line clicked, not the entire paragraph.

4. **Fallback Strategy**: If caret position APIs aren't available or return null (common with certain CSS layouts), the extension falls back to:
   - Using `elementFromPoint()` to find the nearest text element
   - Creating ranges around text nodes within that element
   - Finding the closest line rectangle within 50px of the click

### Navigation System

1. **Text Tree Walking**: The extension uses `TreeWalker` API to efficiently traverse all text nodes in the reading area, filtering out hidden elements and empty text.

2. **Line Collection**: For each text node, it:
   - Creates a range and gets all line rectangles
   - Filters out lines that are too small (< 5px height) or too large (> 100px, likely containers)
   - Stores absolute page positions using `pageYOffset + rect.top`

3. **Deduplication**: Lines at the same vertical position (within 2px) are merged to handle multi-column layouts and inline elements.

4. **Smart Scrolling**: When navigating between lines, the extension:
   - Updates the highlighter position using absolute page coordinates
   - Automatically scrolls if the target line is near viewport edges
   - Uses smooth scrolling for better reading experience

### Position Persistence

The highlighter uses `position: absolute` with page coordinates rather than `position: fixed` with viewport coordinates. This ensures the highlight stays with the text when scrolling, solving a common issue with simpler implementations.

### Edge Case Handling

- **Whitespace Clicks**: Returns null if no text found within 50px
- **Multi-column Layouts**: Deduplicates lines at same vertical position
- **Dynamic Content**: Recalculates line positions on each navigation
- **Variable Line Heights**: Adapts to different text sizes within the same document

---

Created with ❤️ by [Kyle Chadha](https://twitter.com/kylechadha)