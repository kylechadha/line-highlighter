# Changelog

All notable changes to Line Highlighter will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.0](https://github.com/kylechadha/line-highlighter/compare/line-highlighter-v2.1.4...line-highlighter-v2.2.0) (2025-09-30)


### Features

* add Chrome commands API integration for toggle shortcut ([a1136c5](https://github.com/kylechadha/line-highlighter/commit/a1136c5051005dbc63a65c582c6f8c48c7041d45))
* Chrome keyboard shortcuts and streamlined UI ([21f814b](https://github.com/kylechadha/line-highlighter/commit/21f814bfc03667fb242a6d5a4a333b6e3704bcee))
* implement Chrome keyboard shortcuts and streamline UI ([ee11509](https://github.com/kylechadha/line-highlighter/commit/ee11509f4859d8adb37222447e78aee7fc7683b6))


### Bug Fixes

* finalize popup UI improvements ([ece155a](https://github.com/kylechadha/line-highlighter/commit/ece155aeb0b2011735e23fc263a104881011fc0f))
* improve Chrome commands UI and remove duplicate entry ([afcae6c](https://github.com/kylechadha/line-highlighter/commit/afcae6ce399cb78c98ac7fdcdcb10cae0a6d97c0))
* update release workflow ([2f46a02](https://github.com/kylechadha/line-highlighter/commit/2f46a02ec512dc384735ea95e5d2588f5488f346))
* update release workflow to hopefully auto-publish and sync ([012811e](https://github.com/kylechadha/line-highlighter/commit/012811ec64795fc0e78ebbe68e4e410533172286))

## [2.1.4](https://github.com/kylechadha/line-highlighter/compare/v2.1.3...v2.1.4) (2025-09-26)


### Bug Fixes

* sync version to 2.1.3 across all files ([465b987](https://github.com/kylechadha/line-highlighter/commit/465b987a45a45143493169a5f87ee2adb821e894))
* configure Release-Please to properly update manifest.json ([1bb1f8c](https://github.com/kylechadha/line-highlighter/commit/1bb1f8c51a3d3f7f29db023d2bd8a024110fb092))
* document post-release sync process ([f6c4878](https://github.com/kylechadha/line-highlighter/commit/f6c48789853474f088fbe2d387193ce7312652ed))

## [2.1.3](https://github.com/kylechadha/line-highlighter/compare/v2.1.2...v2.1.3) (2025-09-26)


### Bug Fixes

* configure Release-Please to update manifest.json version field ([4e653c5](https://github.com/kylechadha/line-highlighter/commit/4e653c57943bd4e3288353dea4c8d67997472dd7))
* move extra-files to root level in Release-Please config ([c9d9c36](https://github.com/kylechadha/line-highlighter/commit/c9d9c36ca18f054855fc75d43c800719baac4229))

## [2.1.2](https://github.com/kylechadha/line-highlighter/compare/v2.1.1...v2.1.2) (2025-09-25)


### Bug Fixes

* correct YAML syntax and Release-Please header ([1da4e60](https://github.com/kylechadha/line-highlighter/commit/1da4e603455514890968cefa2bc00a46fdd9429c))
* remove invalid package-name input from Release-Please v4 and rename publish workflow ([e7afd1f](https://github.com/kylechadha/line-highlighter/commit/e7afd1f53f308334ff3eb09bd81efb6b5c052979))
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
