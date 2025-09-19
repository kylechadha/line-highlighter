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
**CRITICAL**: ALWAYS test changes before committing. Run tests after EVERY change.

### Test Commands
```bash
# Run all tests
npm test

# Run specific test file  
npx playwright test tests/extension.spec.js

# Run tests with visual browser (for debugging)
npx playwright test --headed --workers 1

# Test specific functionality
npx playwright test --grep "Alt+L"
```

### RED-GREEN Testing Process
When fixing bugs:
1. Write a test that demonstrates the bug (RED phase - test should fail)
2. Fix the bug in the code
3. Verify the test passes (GREEN phase)
4. Run full test suite to ensure no regressions

### Key Test Scenarios
- Alt+L toggle functionality
- Navigation between lines (F/V keys)  
- Custom keyboard shortcuts
- Popup UI (no scrollbar, proper spacing)
- Color selection and persistence
- Sidebar/breadcrumb exclusion on GitHub

## Keyboard Controls Implementation
Controls are handled in content-script.js (v2.1 defaults):
- Enable/disable toggle: Cmd+; (Mac) / Ctrl+; (Windows/Linux) - customizable
- Previous line: F (customizable)
- Next line: V (customizable)
- All shortcuts can be customized via the popup UI

## Recent Fixes and Improvements (v2.1)

### Critical Bugs Fixed
1. **Keyboard Shortcut Issues**
   - **Problem**: Alt+L and Cmd+Shift+L weren't working on Mac due to browser conflicts
   - **Solution**: Changed default to Cmd+; (semicolon) which avoids conflicts
   - **Files**: `content-script.js:17`, `popup.js:6,238`

2. **Shortcut Recording Bug**
   - **Problem**: Recording shortcuts with modifiers showed "Shift+SHIFT" or "⌘+META"
   - **Solution**: Added logic to ignore pure modifier key presses, improved key code mapping
   - **Files**: `popup.js:145-176`

3. **Colors Not Displaying**
   - **Problem**: Color buttons in popup appeared blank/transparent
   - **Solution**: Force CSS application with `!important` flag and direct style setting
   - **Files**: `popup.js:291`

4. **Popup Spacing Issues**
   - **Problem**: Excessive/uneven spacing below OFF button
   - **Solution**: Made status text height dynamic (0px empty, 18px with text)
   - **Files**: `popup-styles.css:81-90`

5. **SVG Icon Loading Errors**
   - **Problem**: Chrome couldn't load SVG icons with "Failed to fetch" errors
   - **Solution**: Added SVG paths to manifest with badge text fallback
   - **Files**: `manifest.json:20-25`, `background.js:10-25`

6. **Highlighter Not Hiding**
   - **Problem**: Highlighter stayed visible when extension was disabled
   - **Solution**: Fixed removeHighlighter function to properly hide element
   - **Files**: `content-script.js:107-113`

7. **Storage Corruption**
   - **Problem**: Corrupted settings could break the extension
   - **Solution**: Added validateSettings() function to verify structure
   - **Files**: `popup.js:62-81`, `content-script.js:67-82`

### Navigation Improvements
1. **GitHub Breadcrumb Navigation**
   - **Problem**: F/V navigation would jump to sidebar/breadcrumbs
   - **Solution**: Enhanced text filtering to exclude navigation elements
   - **Files**: `content-script.js:286-303`

2. **Scroll Position Preservation**
   - **Problem**: Page would jump to top when navigating between lines
   - **Solution**: Use absolute page positioning instead of viewport-relative
   - **Files**: `content-script.js:326,391-406`

### Testing Infrastructure
1. **Added Comprehensive Tests**
   - Bug fix verification tests: `tests/bug-fixes.spec.js`
   - Shortcut debugging: `tests/debug-shortcuts.spec.js`
   - Final validation: `tests/final-test.spec.js`

2. **Test Updates**
   - Updated all tests to use new Ctrl+Semicolon shortcut
   - Added screenshot capture for visual verification

### Repository Organization
- Moved test HTML files to `tests/` directory
- Created `assets/` for demo.gif
- Created `scripts/` for utility scripts
- Updated all file references to match new structure

### Recent UI Polish Fixes (2024-09-19)
1. **Status Text Spacing**
   - **Problem**: Status text element had margin even when empty (OFF state)
   - **Solution**: Moved margin-top to only apply when text is present
   - **Files**: `popup-styles.css:82-93`

2. **Color Grid Bottom Spacing**
   - **Problem**: Uneven spacing below bottom row due to absolute positioned labels
   - **Solution**: Adjusted padding-bottom in color-grid container
   - **Files**: `popup-styles.css:205`

3. **Multiple Selected Colors Bug**
   - **Problem**: Previous and current colors both showed as selected after reopening popup
   - **Solution**: Explicitly remove selected class from non-current colors on init
   - **Files**: `popup.js:307-312`

### Known Issues and Workarounds
1. **SVG Icons**: Chrome has intermittent issues with SVG icons in extensions. Using badge text as fallback.
2. **Ctrl+L Conflict**: Browser uses this for address bar focus, avoided by using semicolon.
3. **Alt/Option on Mac**: System intercepts many Alt combinations, using Cmd instead.
4. **Extension Popup DevTools**: Can't edit styles directly in popup inspector. Use debugger pause trick or open popup.html in separate tab.

## Development Workflow

### Branching Strategy
- **develop**: Default branch for development
- **master**: Production branch for releases
- Feature branches created from develop
- PRs from develop to master for releases

### Pull Request Guidelines
When creating PRs:
- Use concise, descriptive title
- Brief summary of changes (2-3 sentences)
- Bullet points for key features/fixes
- Do NOT include test plans or checklists
- Keep focus on what changed, not process

### Commit Message Convention
Use clear, descriptive commit messages:
- Start with imperative verb (Add, Fix, Update, Remove)
- Keep first line under 72 characters
- Add bullet points for multiple changes
- Example: "Fix popup UI spacing issues"