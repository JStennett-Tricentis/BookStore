#!/bin/bash
# Project Reorganization Script
# Moves scripts into organized structure

set -e

echo "📁 BookStore Project Reorganization"
echo "===================================="
echo
echo "This will organize scripts into:"
echo "  scripts/startup/     - Service startup/shutdown"
echo "  scripts/monitoring/  - Dashboard generation"
echo "  scripts/utils/       - Maintenance utilities"
echo
echo "Current structure:"
echo "  Root: *.sh files"
echo "  monitoring/grafana: *.py files"
echo

# Confirm
read -p "Proceed with reorganization? [y/N] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled"
    exit 1
fi

# Create new directory structure
echo "📂 Creating directory structure..."
mkdir -p scripts/startup
mkdir -p scripts/monitoring
mkdir -p scripts/utils
echo "   ✓ Created scripts directories"

# Move startup scripts
echo
echo "🚀 Moving startup scripts..."
if [ -f "start-aspire.sh" ]; then
    mv start-aspire.sh scripts/startup/
    echo "   ✓ start-aspire.sh → scripts/startup/"
fi

if [ -f "start-services.sh" ]; then
    mv start-services.sh scripts/startup/
    echo "   ✓ start-services.sh → scripts/startup/"
fi

if [ -f "stop-services.sh" ]; then
    mv stop-services.sh scripts/startup/
    echo "   ✓ stop-services.sh → scripts/startup/"
fi

# Move monitoring scripts
echo
echo "📊 Moving monitoring scripts..."
if [ -f "monitoring/grafana/add-status-code-panels.py" ]; then
    mv monitoring/grafana/add-status-code-panels.py scripts/monitoring/
    echo "   ✓ add-status-code-panels.py → scripts/monitoring/"
fi

if [ -f "monitoring/grafana/create-demo-dashboard.py" ]; then
    mv monitoring/grafana/create-demo-dashboard.py scripts/monitoring/
    echo "   ✓ create-demo-dashboard.py → scripts/monitoring/"
fi

if [ -f "monitoring/grafana/create-mega-dashboard.py" ]; then
    mv monitoring/grafana/create-mega-dashboard.py scripts/monitoring/
    echo "   ✓ create-mega-dashboard.py → scripts/monitoring/"
fi

# Move utility scripts
echo
echo "🔧 Moving utility scripts..."
if [ -f "cleanup-project.sh" ]; then
    mv cleanup-project.sh scripts/utils/
    echo "   ✓ cleanup-project.sh → scripts/utils/"
fi

# Move this reorganization script itself
echo
echo "📦 Moving reorganization script..."
if [ -f "reorganize-project.sh" ]; then
    mv reorganize-project.sh scripts/utils/
    echo "   ✓ reorganize-project.sh → scripts/utils/"
fi

# Update Makefile references
echo
echo "📝 Updating Makefile..."

# Backup Makefile
cp Makefile Makefile.backup

# Update paths in Makefile
sed -i '' 's|./start-aspire.sh|./scripts/startup/start-aspire.sh|g' Makefile
sed -i '' 's|./start-services.sh|./scripts/startup/start-services.sh|g' Makefile
sed -i '' 's|./stop-services.sh|./scripts/startup/stop-services.sh|g' Makefile

echo "   ✓ Updated Makefile (backup saved as Makefile.backup)"

# Update monitoring script paths in Python files
echo
echo "🐍 Updating Python script paths..."

# Update create-demo-dashboard.py
if [ -f "scripts/monitoring/create-demo-dashboard.py" ]; then
    sed -i '' "s|'dashboards/|'../../monitoring/grafana/dashboards/|g" scripts/monitoring/create-demo-dashboard.py
    sed -i '' "s|dashboards/bookstore-demo.json|../../monitoring/grafana/dashboards/bookstore-demo.json|g" scripts/monitoring/create-demo-dashboard.py
    echo "   ✓ Updated create-demo-dashboard.py paths"
fi

# Update create-mega-dashboard.py
if [ -f "scripts/monitoring/create-mega-dashboard.py" ]; then
    sed -i '' "s|'dashboards/|'../../monitoring/grafana/dashboards/|g" scripts/monitoring/create-mega-dashboard.py
    sed -i '' "s|dashboards/bookstore-mega.json|../../monitoring/grafana/dashboards/bookstore-mega.json|g" scripts/monitoring/create-mega-dashboard.py
    echo "   ✓ Updated create-mega-dashboard.py paths"
fi

# Update add-status-code-panels.py
if [ -f "scripts/monitoring/add-status-code-panels.py" ]; then
    sed -i '' "s|'dashboards/|'../../monitoring/grafana/dashboards/|g" scripts/monitoring/add-status-code-panels.py
    echo "   ✓ Updated add-status-code-panels.py paths"
fi

# Create README in scripts directory
echo
echo "📄 Creating scripts/README.md..."
cat > scripts/README.md << 'EOF'
# Scripts Directory

Organized automation and utility scripts for the BookStore project.

## Structure

### 📁 startup/
Service lifecycle management scripts.

- `start-aspire.sh` - Start services using .NET Aspire (recommended)
- `start-services.sh` - Start services using Docker Compose (fallback)
- `stop-services.sh` - Stop all services

**Usage:**
```bash
# Via Makefile (recommended)
make run-aspire
make stop-services

# Direct execution
./scripts/startup/start-aspire.sh
./scripts/startup/stop-services.sh
```

### 📁 monitoring/
Grafana dashboard generation and monitoring utilities.

- `create-demo-dashboard.py` - Generate demo dashboard (53 curated panels)
- `create-mega-dashboard.py` - Generate MEGA dashboard (all 91 widgets)
- `add-status-code-panels.py` - Add HTTP status code panels to dashboards

**Usage:**
```bash
# Run from project root
cd monitoring/grafana
python3 ../../scripts/monitoring/create-demo-dashboard.py
python3 ../../scripts/monitoring/create-mega-dashboard.py
```

### 📁 utils/
Project maintenance and utility scripts.

- `cleanup-project.sh` - Clean old test results, build artifacts, duplicates
- `reorganize-project.sh` - Project structure reorganization (this setup)

**Usage:**
```bash
# Make executable
chmod +x scripts/utils/cleanup-project.sh

# Run
./scripts/utils/cleanup-project.sh
```

## Adding New Scripts

When adding new scripts:

1. Choose appropriate directory (startup/monitoring/utils)
2. Make executable: `chmod +x script-name.sh`
3. Add to Makefile if frequently used
4. Document in this README
EOF

echo "   ✓ Created scripts/README.md"

# Update .gitignore if needed
echo
echo "📋 Checking .gitignore..."
if ! grep -q "scripts/" .gitignore 2>/dev/null; then
    echo "   ℹ️  No changes needed to .gitignore"
fi

echo
echo "✅ Reorganization complete!"
echo
echo "New structure:"
echo "  scripts/"
echo "  ├── startup/          (3 scripts)"
echo "  │   ├── start-aspire.sh"
echo "  │   ├── start-services.sh"
echo "  │   └── stop-services.sh"
echo "  ├── monitoring/       (3 scripts)"
echo "  │   ├── add-status-code-panels.py"
echo "  │   ├── create-demo-dashboard.py"
echo "  │   └── create-mega-dashboard.py"
echo "  ├── utils/            (2 scripts)"
echo "  │   ├── cleanup-project.sh"
echo "  │   └── reorganize-project.sh"
echo "  └── README.md"
echo
echo "📝 Next steps:"
echo "  1. Test Makefile commands: make run-aspire"
echo "  2. Review Makefile.backup if needed"
echo "  3. Test dashboard generation from monitoring/grafana/"
echo "  4. Commit changes: git add scripts/ Makefile"
echo
echo "💡 Tip: All existing Makefile commands still work!"
