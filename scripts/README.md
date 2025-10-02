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
