#!/bin/bash
# Project Cleanup Script
# Removes old test results, duplicates, and unnecessary files

set -e

echo "🧹 BookStore Project Cleanup"
echo "=============================="
echo

# Function to prompt for confirmation
confirm() {
    read -p "$1 [y/N] " -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]]
}

# 1. Remove old test results (36MB)
if [ -d "BookStore.Performance.Tests/results" ]; then
    RESULTS_SIZE=$(du -sh BookStore.Performance.Tests/results | cut -f1)
    echo "📊 Test Results: $RESULTS_SIZE"
    if confirm "Remove BookStore.Performance.Tests/results/?"; then
        rm -rf BookStore.Performance.Tests/results/*.json
        rm -rf BookStore.Performance.Tests/results/*.html
        echo "   ✓ Removed test results (kept directory structure)"
    fi
fi

# 2. Remove k6-results.json if it exists
if [ -f "BookStore.Performance.Tests/k6-results.json" ]; then
    echo
    echo "📄 Old k6-results.json found"
    if confirm "Remove BookStore.Performance.Tests/k6-results.json?"; then
        rm BookStore.Performance.Tests/k6-results.json
        echo "   ✓ Removed k6-results.json"
    fi
fi

# 3. Remove duplicate startup script
if [ -f "start-services" ]; then
    echo
    echo "📄 Duplicate startup script found: start-services (vs start-services.sh)"
    if confirm "Remove duplicate 'start-services' file?"; then
        rm start-services
        echo "   ✓ Removed duplicate startup script"
    fi
fi

# 4. Remove .DS_Store files
echo
echo "🍎 macOS .DS_Store files"
DS_COUNT=$(find . -name ".DS_Store" -type f | wc -l | tr -d ' ')
if [ "$DS_COUNT" -gt 0 ]; then
    echo "   Found $DS_COUNT .DS_Store file(s)"
    if confirm "Remove all .DS_Store files?"; then
        find . -name ".DS_Store" -type f -delete
        echo "   ✓ Removed $DS_COUNT .DS_Store file(s)"
    fi
fi

# 5. Check for duplicate LLM documentation
echo
echo "📚 Documentation Structure"
if [ -f "BookStore.Performance.Tests/LLM_TESTING.md" ] && [ -f "docs/LLM_TESTING_GUIDE.md" ]; then
    echo "   ⚠️  Duplicate LLM documentation found:"
    echo "      - BookStore.Performance.Tests/LLM_TESTING.md"
    echo "      - docs/LLM_TESTING_GUIDE.md"
    if confirm "Remove BookStore.Performance.Tests/LLM_TESTING.md (keep docs/ version)?"; then
        rm BookStore.Performance.Tests/LLM_TESTING.md
        echo "   ✓ Removed duplicate LLM documentation"
    fi
fi

# 6. Check planning docs
echo
echo "📋 Planning Documents"
for doc in docs/NEXT_SESSION_PLAN.md docs/TRICENTIS_API_SIMULATOR_PLAN.md; do
    if [ -f "$doc" ]; then
        echo "   Found: $doc"
    fi
done
if confirm "Remove old planning docs (NEXT_SESSION_PLAN.md, TRICENTIS_API_SIMULATOR_PLAN.md)?"; then
    [ -f "docs/NEXT_SESSION_PLAN.md" ] && rm docs/NEXT_SESSION_PLAN.md && echo "   ✓ Removed NEXT_SESSION_PLAN.md"
    [ -f "docs/TRICENTIS_API_SIMULATOR_PLAN.md" ] && rm docs/TRICENTIS_API_SIMULATOR_PLAN.md && echo "   ✓ Removed TRICENTIS_API_SIMULATOR_PLAN.md"
fi

# 7. Clean Docker volumes (if needed)
echo
echo "🐳 Docker Cleanup"
if confirm "Clean unused Docker volumes?"; then
    docker volume prune -f 2>/dev/null && echo "   ✓ Docker volumes cleaned" || echo "   ⚠️  Docker not running"
fi

# 8. Clean .NET build artifacts
echo
echo "🔨 .NET Build Artifacts"
if confirm "Clean bin/obj directories?"; then
    find . -type d -name "bin" -o -name "obj" | while read dir; do
        rm -rf "$dir"
    done
    echo "   ✓ Cleaned bin/obj directories"
fi

echo
echo "✅ Cleanup complete!"
echo
echo "Summary:"
echo "  - Test results directory cleared (results/ kept for future tests)"
echo "  - Duplicate files removed"
echo "  - Old planning docs removed (if selected)"
echo "  - Docker volumes cleaned (if selected)"
echo "  - Build artifacts cleaned (if selected)"
echo
echo "💡 Tip: Run 'make build' to rebuild after cleaning build artifacts"
