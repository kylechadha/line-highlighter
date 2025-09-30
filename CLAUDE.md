# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Line Highlighter is a Chrome extension that helps users track their reading position on web pages by displaying a full-width highlight line wherever they click.

## Architecture
- **manifest.json**: Chrome extension manifest (v3) defining permissions, content scripts, and commands
- **src/content-script.js**: Core logic injected into web pages, handles user interactions and line positioning
- **src/popup.js**: Popup script handling UI interactions and settings management
- **src/popup.html**: Extension popup displaying controls and settings
- **src/popup-styles.css**: Styling for the popup interface
- **src/background.js**: Service worker managing extension state, icon updates, and Chrome commands

## Current Keyboard Shortcuts (v2.2)
### Chrome-Managed Shortcuts (manifest.json)
- **Mac**: ⌥L (Alt+L) opens popup, ⌘E (Cmd+E) toggles highlighter
- **Windows/Linux**: Alt+H opens popup, Alt+L toggles highlighter

### User-Customizable Navigation (stored in settings)
- **Previous line**: F key (default, customizable)
- **Next line**: V key (default, customizable)

## Key Implementation Details
- Extension uses vanilla JavaScript (no frameworks or jQuery)
- Line marker positioned absolutely with max z-index (2147483647) to stay on top
- CSS blend mode (multiply) makes the highlight blend naturally with page content
- Pointer events disabled on line marker to prevent interference
- State management tracks enabled/disabled status per tab in background service worker
- Chrome commands API handles keyboard shortcuts
- Extension works on all HTTP/HTTPS sites as defined in content script matches

## Development Workflow

### CRITICAL: Testing & Commit Process
**ALL tests must pass before ANY commit. No excuses.**

1. **Build** - Ensure code compiles/loads properly
2. **Smoke Test** - Manual quick verification:
   - Extension loads in Chrome
   - Popup opens with Alt+L on Mac, Alt+H on Windows
   - Toggle shortcut works (Cmd+E on Mac, Alt+L on Windows)
   - Navigation shortcuts work (F/V keys)
   - Popup opens without scrollbar
   - Colors can be selected
3. **Report to User** - Brief status update before full test
4. **Run Full Test Suite** - `npm test` must pass 100%
5. **Commit & Push** - Only after all tests pass

### Branching Strategy
- **develop**: Default branch for development
- **master**: Production branch for releases
- Feature branches created from develop
- PRs from develop to master for releases
- **NEVER commit directly to master**

### Commit Message Convention
Use conventional commits for Release-Please automation:
- `feat:` - New features (MINOR version bump)
- `fix:` - Bug fixes (PATCH version bump)
- `feat!:` or `BREAKING CHANGE:` - Breaking changes (MAJOR version bump)
- `chore:`, `docs:`, `style:`, `refactor:`, `test:` - No version bump

Keep commit messages concise (under 72 chars).

## Testing Infrastructure

### Test Philosophy
We maintain a minimal, focused test suite that verifies build integrity and configuration.
Chrome extension functionality is tested manually since Chrome APIs don't work reliably in automated tests.

### Test Commands
```bash
# Run all tests (quick, headless)
npm test
```

### Test Files
- `tests/core-tests.spec.js` - Validates manifest, file structure, and configuration
- `tests/test-helpers.js` - Utilities for reading dynamic configuration

### What We Test
- Manifest.json validity and structure
- Keyboard shortcut configuration
- File existence and structure
- Popup HTML structure

### What We DON'T Test (Manual Only)
- Chrome extension runtime behavior
- Keyboard shortcut execution
- Content script injection
- Background service worker messaging

These require a properly loaded extension in Chrome and should be tested manually during development.

## Release Process

### Automated with Release-Please
1. **Development**: Work on `develop` branch with conventional commits
2. **Release PR**: Create PR from `develop` to `master`
3. **Auto-Release**: Release-Please creates release PR with version bumps
4. **Publish**: Merging release PR triggers:
   - Git tag creation
   - GitHub release with extension zip
   - Chrome Web Store publish (for feat/fix releases)
   - Auto-sync back to develop

### GitHub Secrets Required
- `CHROME_EXTENSION_ID`: Extension ID from Chrome Web Store
- `CHROME_CLIENT_ID`: OAuth client ID for Chrome Web Store API
- `CHROME_CLIENT_SECRET`: OAuth client secret
- `CHROME_REFRESH_TOKEN`: OAuth refresh token

## Repository Organization
- `assets/` - Icon files (PNG format, 128x128)
- `src/` - Extension source code
- `tests/` - Playwright test files
- `scripts/` - Build and utility scripts
- `.github/workflows/` - GitHub Actions automation

## Known Issues and Workarounds
1. **Chrome Shortcuts Page**: Shows duplicate "Activate the extension" entries - this is Chrome's behavior, not a bug
2. **Extension Testing**: Chrome extensions require `headless: false` in Playwright tests
3. **Popup DevTools**: Can't edit styles directly in popup inspector - open popup.html in separate tab for debugging

## Chrome Commands API Notes
- Must include either `Ctrl` or `Alt` in shortcuts
- On Mac, `Ctrl` automatically becomes `Command`
- Semicolon (`;`) is not supported by Chrome commands API
- `_execute_action` always opens popup when defined
- Custom commands can coexist with `_execute_action`