# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Line Highlighter is a Chrome extension that helps users track their reading position on web pages by displaying a full-width yellow highlight line wherever they click, along with an optional blinking cursor.

## Architecture
- **manifest.json**: Chrome extension manifest (v3) defining permissions, content scripts, and action
- **src/content-script.js**: Core logic injected into all web pages, handles user interactions and line positioning
- **src/popup.js**: Popup script handling UI interactions and settings management
- **src/popup-styles.css**: Styling for the popup interface
- **src/popup.html**: Extension popup displaying controls and settings
- **src/background.js**: Service worker managing extension state and icon updates

## Key Implementation Details
- The extension uses vanilla JavaScript (no jQuery dependency)
- Line marker is positioned absolutely with max z-index (2147483647) to stay on top
- CSS blend mode (multiply) is used to make the yellow line blend naturally with page content
- Pointer events are disabled on the line marker to prevent interference with page interactions
- State management tracks enabled/disabled status per tab in background service worker

## Development Notes
- Simple build process creates versioned zip files for distribution
- Extension uses Manifest V3 with service worker architecture
- Testing requires loading the extension as an unpacked extension in Chrome Developer Mode
- The extension works on all HTTP/HTTPS sites as defined in the content script matches
- Uses npm for dependency management (Playwright for testing)

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
```

### Key Test Scenarios
- Ctrl+; toggle functionality (Cmd+; on Mac)
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

## Key Features (v2.1)

### Features
1. **Customizable Keyboard Shortcuts**
   - Default: Cmd+; (Mac) / Ctrl+; (Windows/Linux) for toggle
   - F/V keys for navigation (customizable)
   - All shortcuts can be changed via popup

2. **Color Selection**
   - 6 highlighter colors: yellow, orange, pink, green, blue, purple
   - Settings persist across sessions

3. **Smart Navigation**
   - Line-by-line navigation with F/V keys
   - Automatic scroll when navigating
   - Filters out navigation elements and sidebars


### Testing Infrastructure
1. **Core Test Files**
   - Main extension tests: `tests/extension.spec.js`
   - Bug fix verification: `tests/bug-fixes.spec.js`
   - Feature tests: `tests/test-v2.1.spec.js`
   - Custom shortcuts: `tests/test-custom-shortcuts.spec.js`
   - Regression tests: `tests/regression-tests.spec.js`

2. **Test Updates**
   - All tests use Ctrl+; (or Cmd+; on Mac) shortcut
   - Tests verify PNG icon loading

### Repository Organization
- `assets/` - Contains demo.gif and icon PNG files
- `src/` - Extension source code (content-script.js, popup files, background.js)
- `tests/` - Playwright test files
- `scripts/` - Utility scripts
- `.github/workflows/` - GitHub Actions for Release-Please automation


### Known Issues and Workarounds
1. **Extension Icons**: Using PNG format (128x128) for better compatibility. Badge text as fallback if icon fails.
2. **Keyboard Conflicts**: Some shortcuts conflict with browser defaults (e.g., Ctrl+L for address bar). Default uses Ctrl+; to avoid conflicts.
3. **Extension Popup DevTools**: Can't edit styles directly in popup inspector. Open popup.html in separate tab for debugging.

## Development Workflow

### Branching Strategy
- **develop**: Default branch for development
- **master**: Production branch for releases
- Feature branches created from develop
- PRs from develop to master for releases
- **CRITICAL**: NEVER commit directly to master - all changes must go through develop and PR process

### Pull Request Guidelines
When creating PRs:
- Use concise, descriptive title
- Brief summary of changes (2-3 sentences)
- Bullet points for key features/fixes
- Do NOT include test plans or checklists
- Keep focus on what changed, not process

### Commit Message Convention
**IMPORTANT**: Use conventional commits for automated versioning with Release-Please:

#### Commit Types (determines version bump):
- `feat:` - New features (triggers MINOR version bump, e.g., 2.1.0 → 2.2.0)
- `fix:` - Bug fixes (triggers PATCH version bump, e.g., 2.1.0 → 2.1.1)
- `feat!:` or `BREAKING CHANGE:` - Breaking changes (triggers MAJOR version bump, e.g., 2.1.0 → 3.0.0)
- `chore:` - Maintenance tasks (no version bump)
- `docs:` - Documentation only (no version bump)
- `style:` - Code style changes (no version bump)
- `refactor:` - Code refactoring (no version bump)
- `test:` - Test changes (no version bump)
- `ci:` - CI/CD changes (no version bump)

#### Guidelines:
- Always think about the highest level of change when committing
- If a commit includes both features and fixes, use `feat:` (higher precedence)
- Keep first line under 72 characters
- Add detailed description after blank line if needed

#### Examples:
- `feat: add dark mode support`
- `fix: correct keyboard shortcut handling on Mac`
- `chore: remove unnecessary activeTab permission`
- `feat!: migrate to Manifest V3`

## Release Process

### Automated with Release-Please
1. **Development**: All work happens on `develop` branch with conventional commits
2. **Ready to Release**: Manually create PR from `develop` to `master`
3. **Release PR**: After merging to master, Release-Please creates a Release PR on master with:
   - Version bumps in manifest.json, package.json, and package-lock.json
   - Updated CHANGELOG.md
4. **Publish**: When Release PR is merged:
   - Creates git tag (format: `v2.1.4`)
   - Creates GitHub release with built extension zip
   - Automatically publishes to Chrome Web Store for feat/fix releases
   - Auto-syncs version back to develop via fast-forward merge
5. **Post-Release**: Version automatically synced to develop (no manual merge needed)

### Release Please Configuration
**IMPORTANT**: Must use manifest/config files approach, NOT `release-type` in workflow
- Bug: https://github.com/googleapis/release-please-action/issues/941
- When `release-type: node` is in workflow YAML, `extra-files` doesn't work
- Solution: Use `.release-please-manifest.json` and `release-please-config.json`

### GitHub Actions Limitations
- **Default Branch Issue**: `release` event workflows only trigger from default branch
- Since our default is `develop`, releases from `master` won't trigger separate workflows
- Solution: Combined release-please.yml handles both release and publish in one workflow

### GitHub Secrets Required for Automation
- `CHROME_EXTENSION_ID`: Extension ID from Chrome Web Store
- `CHROME_CLIENT_ID`: OAuth client ID for Chrome Web Store API
- `CHROME_CLIENT_SECRET`: OAuth client secret
- `CHROME_REFRESH_TOKEN`: OAuth refresh token

## Todo List (Future Improvements)

### 1. Switch to activeTab Permission Model
- Remove content_scripts from manifest (less invasive)
- Use activeTab permission for on-demand script injection
- Inject content script only when user activates extension
- More privacy-friendly, fewer permissions warnings

### 2. Onboarding Notification
- Show welcome popup on install with keyboard shortcut info
- Use chrome.runtime.onInstalled to detect fresh install
- Display notification or open welcome page with instructions
- Explain Chrome's customizable shortcuts