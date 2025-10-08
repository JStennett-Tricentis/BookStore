# Performance Testing Web Dashboard

A self-contained web UI for triggering and monitoring K6 performance tests without using command-line tools.

## Features

- 🚀 **Quick Start Tests** - One-click test execution for all scenarios
- 📊 **Real-Time Monitoring** - Auto-refreshing test status every 5 seconds
- 🔗 **Quick Links** - Direct access to Grafana, Prometheus, Aspire Dashboard
- 🎯 **Test History** - View running and recent tests
- ⚡ **Zero Installation** - Single HTML file, no build required
- 🎨 **Modern UI** - Clean, responsive design with dark theme

## Access

**URL:** <http://localhost:7004>

**Port:** Served by the Performance Service (default 7004)

## Quick Access Commands

```bash
# Open the dashboard
make perf-dashboard

# Open complete workspace (Dashboard + Grafana + Aspire)
make perf-workspace
```

## Available Test Scenarios

### Quick Start Buttons

- **Smoke Test** - Basic functionality (1-2 users, 2 min)
- **Load Test** - Normal load (5-10 users, 5 min)
- **Stress Test** - High load (10-30 users, 10 min)
- **Spike Test** - Sudden load burst (50+ users, 3 min)

Each scenario can be triggered with a single click.

## How to Use

### 1. Start Performance Testing

1. Open <http://localhost:7004>
2. Click any "Start [Scenario] Test" button
3. Test will appear in "Running & Recent Tests" panel
4. Status updates automatically every 5 seconds

### 2. Monitor Test Progress

- **Running Tests** - Yellow border, pulsing animation
- **Completed Tests** - Green border
- **Failed Tests** - Red border

Test cards show:

- Test name and ID
- Start time
- Duration
- Virtual users (VUs)
- Current status

### 3. Cancel Running Tests

Click "Cancel Test" button on any running test card.

### 4. View Results in Grafana

1. Click "📊 Grafana Dashboards" link in header
2. Navigate to Performance Testing dashboard
3. View real-time metrics while tests run

## Workflow Examples

### Example 1: Quick Smoke Test

```bash
# 1. Start services
make run-aspire

# 2. Open workspace (Dashboard + Grafana)
make perf-workspace

# 3. In Dashboard tab: Click "Start Smoke Test"
# 4. Switch to Grafana tab: Watch metrics update
# 5. Switch back to Dashboard: Check test status
```

### Example 2: Load Testing Session

1. Open Performance Dashboard (<http://localhost:7004>)
2. Open Grafana in new tab (<http://localhost:3000/d/bookstore-mega>)
3. In Dashboard: Start Load Test
4. In Grafana: Monitor CPU, RAM, request rates
5. In Dashboard: View test completion status
6. Start another test if needed

### Example 3: Baseline Measurement

1. Ensure system is idle
2. Start Smoke Test from dashboard
3. Record baseline metrics from Grafana
4. Make code changes
5. Start another Smoke Test
6. Compare metrics

## Technical Details

### Architecture

- **Frontend:** Single HTML file with inline CSS/JS
- **Backend:** Performance Service REST API
- **Auto-Refresh:** 5-second polling for test status
- **No Dependencies:** Works in any modern browser

### API Endpoints Used

```bash
GET  /api/v1/performancetest/scenarios      # List available scenarios
POST /api/v1/performancetest/quick-start/{scenario}  # Start test
GET  /api/v1/performancetest/running        # Get running tests
POST /api/v1/performancetest/{testId}/cancel # Cancel test
```

### File Location

```text
BookStore.Performance.Service/
└── wwwroot/
    ├── index.html    # Main dashboard (self-contained)
    └── README.md     # This file
```

### Configuration

Static files are served by the Performance Service via:

- `app.UseDefaultFiles()` - Serves index.html by default
- `app.UseStaticFiles()` - Serves files from wwwroot/

No additional configuration required.

## Customization

### Change Auto-Refresh Interval

Edit `index.html`, line ~643:

```javascript
refreshInterval = setInterval(async () => {
  await loadRunningTests();
}, 5000); // Change 5000 to desired milliseconds
```

### Add Custom Scenarios

Scenarios are loaded from the backend API. To add new scenarios:

1. Add enum value in `BookStore.Performance.Service/Models/TestScenarioType.cs`
2. Add description in `PerformanceTestController.GetScenarioDescription()`
3. Refresh dashboard - new scenario appears automatically

### Change Dashboard Theme

Edit `index.html` CSS variables in `<style>` block:

```css
body {
  background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%);
  /* Change to your preferred gradient */
}
```

## Troubleshooting

### Dashboard Not Loading

**Symptoms:** HTTP 404 or blank page

**Solutions:**

- Verify Performance Service is running: `curl http://localhost:7004/health`
- Check port in URL matches service port
- Ensure wwwroot/index.html exists
- Check Performance Service logs for errors

### Tests Not Appearing

**Symptoms:** "No running tests" message persists

**Solutions:**

- Check browser console for JavaScript errors (F12)
- Verify API endpoint works: `curl http://localhost:7004/api/v1/performancetest/scenarios`
- Check CORS configuration in Performance Service
- Refresh page (Ctrl+F5 for hard refresh)

### Quick Links Not Working

**Symptoms:** 404 errors when clicking dashboard links

**Solutions:**

- Verify all services are running via Aspire Dashboard
- Check ports match your configuration
- Update `index.html` if using custom ports

## Security Notes

### Self-Contained Design

- ✅ No external dependencies
- ✅ No CDN resources
- ✅ All CSS/JS inline
- ✅ No user data collection
- ✅ Works in air-gapped environments

### Network Access

- Dashboard makes requests to `localhost` only
- No external API calls
- Safe for corporate networks
- No telemetry or tracking

## Migration to hub-services-latest

When migrating to hub-services-latest:

1. Copy `wwwroot/` directory to Performance Service
2. Ensure `UseDefaultFiles()` and `UseStaticFiles()` in Program.cs
3. Update quick link URLs if ports differ
4. Test at <http://localhost:YOUR_PERF_SERVICE_PORT>

## Related Documentation

- [Performance Testing Guide](../../docs/PERFORMANCE_TESTING.md)
- [K6 Scenarios](../Tests/README.md)
- [Grafana Dashboards](../../docs/GRAFANA_DASHBOARDS.md)
- [Migration Guide](../../docs/MIGRATION_TO_HUB_SERVICES.md)

## Support

For issues or questions:

- Check Performance Service logs
- Review browser console (F12)
- Verify services running in Aspire Dashboard
- Check API documentation at <http://localhost:7004/swagger>

---

**Version:** 1.0
**Created:** 2025-10-08
**Self-Contained:** Yes ✅
**External Dependencies:** None ✅
