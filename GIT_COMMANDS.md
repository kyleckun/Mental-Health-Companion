# Git Commit Commands

## Quick Commit (Recommended)

```bash
# Add all changes
git add .

# Commit with summary message
git commit -m "feat: Add time range selection for suggestions and improve documentation

Major updates:
- Added time range filtering (Today/Week/Month/Custom) for Suggestions
- Removed redundant SuggestionsPage route
- Created comprehensive documentation (README.md, QUICKSTART.md)
- Created cleanup script for redundant files
- Removed all emojis from docs for professional appearance"

# Push to remote
git push origin main
```

## Detailed Commit (If you want more detail)

```bash
# Add all changes
git add .

# Commit with detailed message
git commit -m "feat: Major updates - time range selection and documentation

Features:
- Time range selection for Suggestions (Today/Week/Month/Custom)
- Custom date picker for specific date ranges
- Auto-refresh suggestions when time range changes

Code improvements:
- Removed redundant /suggestions route (now integrated in MoodJournalPage)
- Cleaned up App.tsx imports
- Updated API endpoints to accept time range parameters

Documentation:
- Created comprehensive README.md (12 sections, no emojis)
- Created QUICKSTART.md for 5-minute setup
- Created cleanup script and documentation
- All docs in English

Files modified:
- backend/routers/suggestions.py
- frontend/src/pages/MoodJournalPage.tsx
- frontend/src/services/suggestionsService.ts
- frontend/src/App.tsx
- README.md
- QUICKSTART.md

Files created:
- cleanup_redundant_files.py
- REDUNDANT_FILES.md
- UPDATE_SUMMARY.md"

# Push to remote
git push origin main
```

## Step-by-Step (If you want to review first)

```bash
# 1. Check what files changed
git status

# 2. Review changes
git diff

# 3. Add all changes
git add .

# 4. Check status again
git status

# 5. Commit
git commit -m "feat: Add time range selection and improve documentation"

# 6. Push
git push origin main
```

## If you need to create a new branch

```bash
# Create and switch to new branch
git checkout -b feature/time-range-selection

# Add and commit
git add .
git commit -m "feat: Add time range selection for suggestions"

# Push to new branch
git push origin feature/time-range-selection

# Then create a pull request on GitHub
```

## Common Git Commands Reference

```bash
# View commit history
git log --oneline

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# View all branches
git branch -a

# Switch branch
git checkout branch-name

# Pull latest changes
git pull origin main
```
