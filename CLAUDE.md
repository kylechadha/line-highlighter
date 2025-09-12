# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Line Highlighter is a Chrome extension that helps users track their reading position on web pages by displaying a full-width yellow highlight line wherever they click, along with an optional blinking cursor.

## Architecture
- **manifest.json**: Chrome extension manifest (v2) defining permissions, content scripts, and browser action
- **content-script.js**: Core logic injected into all web pages, handles user interactions and line positioning
- **styles.css**: Styling for the highlight line, cursor, and popup controls
- **popup.html**: Browser action popup displaying keyboard controls
- **jquery.min.js**: jQuery library dependency for DOM manipulation

## Key Implementation Details
- The extension uses jQuery for DOM manipulation and event handling
- Line marker is positioned absolutely with max z-index (2147483647) to stay on top
- CSS blend mode (multiply) is used to make the yellow line blend naturally with page content
- Pointer events are disabled on the line marker to prevent interference with page interactions
- State management tracks enabled/disabled status and first-time initialization

## Development Notes
- No build process required - this is a vanilla JavaScript Chrome extension
- Extension uses Manifest V2 (consider migration to V3 for future Chrome compatibility)
- Testing requires loading the extension as an unpacked extension in Chrome Developer Mode
- The extension works on all HTTP/HTTPS sites as defined in the content script matches

## Testing Requirements
- **IMPORTANT**: Run Playwright tests after every code change to ensure no regressions
- Test command: `npm test` or `npx playwright test`
- Tests should include screenshots for visual verification
- Key test scenarios:
  - Navigation between lines (f/v keys)
  - Scrolling behavior (highlighter should stick to text)
  - Sidebar/breadcrumb exclusion (e.g., GitHub docs pages)
  - Line height adjustment (j/n keys)
  - Cursor toggle (g key)
- When fixing bugs, add specific test cases for the reported issues

## Keyboard Controls Implementation
Controls are handled in content-script.js:
- Enable/disable toggle: ctrl/cmd + e
- Line movement: f/v (fast), d/c (slow)
- Line height adjustment: j/n
- Cursor visibility: g
- Cursor position: i/o