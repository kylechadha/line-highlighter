#!/bin/bash

# Release script for Line Highlighter
# This script helps create consistent releases with proper tagging

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Line Highlighter Release Script${NC}"
echo "================================"

# Check if we're on the main/master branch
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "master" && "$CURRENT_BRANCH" != "main" ]]; then
  echo -e "${YELLOW}Warning: You're on branch '$CURRENT_BRANCH', not on master/main${NC}"
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
  echo -e "${RED}Error: You have uncommitted changes${NC}"
  git status -s
  exit 1
fi

# Get current version from manifest.json
CURRENT_VERSION=$(grep '"version"' manifest.json | sed 's/.*"version": "\(.*\)".*/\1/')
echo -e "Current version: ${YELLOW}$CURRENT_VERSION${NC}"

# Ask for new version
echo "Enter new version (or press Enter to keep current):"
read -r NEW_VERSION

if [[ -z "$NEW_VERSION" ]]; then
  NEW_VERSION=$CURRENT_VERSION
  echo "Keeping version: $NEW_VERSION"
else
  # Update manifest.json
  sed -i '' "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" manifest.json
  
  # Update package.json
  sed -i '' "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" package.json
  
  echo -e "${GREEN}Updated version to $NEW_VERSION${NC}"
  
  # Commit version bump
  git add manifest.json package.json
  git commit -m "Bump version to $NEW_VERSION"
fi

# Ask for release notes
echo "Enter release notes (one line):"
read -r RELEASE_NOTES

if [[ -z "$RELEASE_NOTES" ]]; then
  RELEASE_NOTES="Release $NEW_VERSION"
fi

# Create git tag
TAG_NAME="v$NEW_VERSION"
echo -e "${GREEN}Creating tag: $TAG_NAME${NC}"

git tag -a "$TAG_NAME" -m "$RELEASE_NOTES"

echo -e "${GREEN}✓ Tag created successfully${NC}"
echo ""
echo "Next steps:"
echo "1. Push to remote: git push origin $CURRENT_BRANCH --tags"
echo "2. Build extension: npm run build"
echo "3. Upload to Chrome Web Store"
echo "4. Create GitHub release:"
echo "   gh release create $TAG_NAME --title \"$TAG_NAME\" --notes \"$RELEASE_NOTES\" --attach build/line-highlighter-v${NEW_VERSION}.zip"