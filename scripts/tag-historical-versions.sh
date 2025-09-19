#!/bin/bash

# Script to retroactively create tags for historical versions
# Based on git history analysis

echo "Creating historical version tags..."

# Create tags for each version (based on commit history)
# Format: git tag -a TAG_NAME COMMIT_HASH -m "MESSAGE"

# v2.1.0 - Current version
git tag -a v2.1.0 9a4e965 -m "Add customizable shortcuts, color picker, improved UI" 2>/dev/null || echo "Tag v2.1.0 already exists"

# v2.0.2 - Playwright fixes
git tag -a v2.0.2 7f541aa -m "Fix Playwright and add regression tests" 2>/dev/null || echo "Tag v2.0.2 already exists"

# v2.0.1 - Permission fix
git tag -a v2.0.1 a980e79 -m "Remove unnecessary activeTab permission" 2>/dev/null || echo "Tag v2.0.1 already exists"

# v2.0.0 - Manifest V3 upgrade
git tag -a v2.0.0 ee6dcb8 -m "Upgrade to Manifest V3, add navigation features" 2>/dev/null || echo "Tag v2.0.0 already exists"

# v1.1.0 - Pointer events fix
git tag -a v1.1.0 ea00ada -m "Fix pointer events and cursor functionality" 2>/dev/null || echo "Tag v1.1.0 already exists"

# v1.0.0 - Layout independence fix
git tag -a v1.0.0 49a4037 -m "Fix layout independence with z-index and blend modes" 2>/dev/null || echo "Tag v1.0.0 already exists"

# v0.1.0 - Initial release
git tag -a v0.1.0 8968b60 -m "Initial release" 2>/dev/null || echo "Tag v0.1.0 already exists"

echo "Done! Current tags:"
git tag -l | sort -V