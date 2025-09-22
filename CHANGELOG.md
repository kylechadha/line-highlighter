# Changelog

All notable changes to Line Highlighter will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.1](https://github.com/kylechadha/line-highlighter/compare/v2.1.0...v2.1.1) (2025-09-22)


### Bug Fixes

* correct YAML syntax and Release-Please header ([1da4e60](https://github.com/kylechadha/line-highlighter/commit/1da4e603455514890968cefa2bc00a46fdd9429c))
* replace SVG icons with PNG for better compatibility ([714e745](https://github.com/kylechadha/line-highlighter/commit/714e745a44f98318cab3911dc42277dce6a0c98f))
* upgrade to Release-Please v4 and fix YAML syntax error ([c8efe3f](https://github.com/kylechadha/line-highlighter/commit/c8efe3f07c5905f3c84d31fa8670b13bbcb61f3b))
* use absolute paths for extension icons ([b7d2bd2](https://github.com/kylechadha/line-highlighter/commit/b7d2bd24607a1338ce453da0671c54e0969676c7))
* workflow syntax error ([99aaefa](https://github.com/kylechadha/line-highlighter/commit/99aaefa78a2b3020049da14b5549b8e8fb3f7538))

## [2.1.0] - 2024-09-15

### Added
- Customizable keyboard shortcuts
- Color picker with 6 highlighter colors (yellow, orange, pink, green, blue, purple)
- Reset to defaults button

### Changed
- Default toggle shortcut changed to Cmd+; (Mac) / Ctrl+; (Windows/Linux) to avoid conflicts

### Fixed
- Keyboard shortcuts not working on Mac
- Navigation excluding GitHub sidebars and breadcrumbs

## [2.0.2] - 2024-09-12

### Fixed
- Playwright test infrastructure issues
- Added comprehensive regression tests for BBC and IETF sites

## [2.0.1] - 2024-09-08

### Fixed
- Removed unnecessary activeTab permission for better privacy
- Version bump for Chrome Web Store submission

## [2.0.0] - 2024-09-05

### Added
- Line-by-line navigation with F/V keys
- Smart text detection algorithm
- Automatic line boundary detection
- Smooth scrolling during navigation
- Demo GIF in README

### Changed
- Complete rewrite of line detection system
- Improved performance with TreeWalker API
- Better handling of multi-column layouts

### Fixed
- Navigation issues on complex layouts
- Scroll position preservation
- Line detection accuracy

## [1.1.0] - 2020-01-17

### Changed
- Set pointer events to none on line marker for better interaction
- Hide cursor by default
- Cleaned up blink functionality

### Fixed
- Line marker interference with page elements

## [1.0.0] - 2019-09-24

### Fixed
- Major issues with page layout independence
- Applied max z-index (2147483647) to keep highlighter on top
- Added CSS blend modes for better visual integration

## [0.1.0] - 2016-09-27

### Added
- Initial release
- Click to highlight current line
- Alt+L toggle functionality
- Yellow highlight line with blend mode
- Support for all HTTP/HTTPS sites
- Extension popup with instructions
