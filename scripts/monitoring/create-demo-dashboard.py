#!/usr/bin/env python3
"""Create a comprehensive demo dashboard with all widgets organized into sections"""

import json

# Load all existing dashboards to extract panels
dashboards = {
    'performance': '../../monitoring/grafana/dashboards/bookstore-performance.json',
    'errors': '../../monitoring/grafana/dashboards/bookstore-errors-diagnostics.json',
    'llm': '../../monitoring/grafana/dashboards/bookstore-llm-metrics.json',
    'dotnet': '../../monitoring/grafana/dashboards/bookstore-dotnet-runtime.json',
    'http': '../../monitoring/grafana/dashboards/bookstore-http-performance.json',
    'threading': '../../monitoring/grafana/dashboards/bookstore-threading-concurrency.json',
    'dependencies': '../../monitoring/grafana/dashboards/bookstore-dependencies.json',
    'system': '../../monitoring/grafana/dashboards/bookstore-system-health.json',
}

# Read all dashboards
all_panels = {}
for name, path in dashboards.items():
    with open(path, 'r') as f:
        data = json.load(f)
        all_panels[name] = data['panels']

# Create demo dashboard
demo_dashboard = {
    "annotations": {"list": []},
    "editable": True,
    "fiscalYearStartMonth": 0,
    "graphTooltip": 1,
    "id": None,
    "links": [],
    "liveNow": False,
    "panels": [],
    "refresh": "5s",
    "schemaVersion": 38,
    "style": "dark",
    "tags": ["bookstore", "demo", "overview"],
    "templating": {"list": []},
    "time": {
        "from": "now-2m",
        "to": "now"
    },
    "timepicker": {},
    "timezone": "",
    "title": "Demo - Complete Overview",
    "uid": "bookstore-demo",
    "version": 1
}

# Row headers as text panels
def create_row_header(title, y_pos):
    return {
        "datasource": {"type": "prometheus"},
        "gridPos": {"h": 2, "w": 24, "x": 0, "y": y_pos},
        "id": 9000 + y_pos,  # Unique ID
        "options": {
            "code": {"language": "plaintext", "showLineNumbers": False, "showMiniMap": False},
            "content": f"# {title}",
            "mode": "markdown"
        },
        "pluginVersion": "10.0.0",
        "type": "text",
        "transparent": True
    }

current_y = 0
panel_id = 1

# Performance Testing Section
demo_dashboard['panels'].append(create_row_header("📊 Performance Testing", current_y))
current_y += 2

# Add key performance panels (4 stats in a row)
perf_stats = [p for p in all_panels['performance'] if p['type'] == 'stat'][:4]
for idx, panel in enumerate(perf_stats):
    panel = panel.copy()
    panel['gridPos'] = {"h": 6, "w": 6, "x": idx * 6, "y": current_y}
    panel['id'] = panel_id
    panel_id += 1
    demo_dashboard['panels'].append(panel)
current_y += 6

# Add main performance chart
perf_chart = next((p for p in all_panels['performance'] if p['type'] == 'timeseries'), None)
if perf_chart:
    perf_chart = perf_chart.copy()
    perf_chart['gridPos'] = {"h": 8, "w": 24, "x": 0, "y": current_y}
    perf_chart['id'] = panel_id
    panel_id += 1
    demo_dashboard['panels'].append(perf_chart)
    current_y += 8

# Errors & Diagnostics Section
demo_dashboard['panels'].append(create_row_header("🚨 Errors & Diagnostics", current_y))
current_y += 2

# Error rate stats (4 main ones)
error_stats = [p for p in all_panels['errors'] if p['type'] == 'stat'][:4]
for idx, panel in enumerate(error_stats):
    panel = panel.copy()
    panel['gridPos'] = {"h": 6, "w": 6, "x": idx * 6, "y": current_y}
    panel['id'] = panel_id
    panel_id += 1
    demo_dashboard['panels'].append(panel)
current_y += 6

# HTTP status code panels (all 8 in 2 rows)
status_panels = [p for p in all_panels['errors'] if p.get('title', '').startswith(('400', '401', '404', '409', '410', '422', '500', '503'))]
for idx, panel in enumerate(status_panels[:8]):
    panel = panel.copy()
    row = idx // 6
    col = idx % 6
    panel['gridPos'] = {"h": 4, "w": 4, "x": col * 4, "y": current_y + row * 4}
    panel['id'] = panel_id
    panel_id += 1
    demo_dashboard['panels'].append(panel)
current_y += 8

# LLM Metrics Section
demo_dashboard['panels'].append(create_row_header("🤖 LLM Performance", current_y))
current_y += 2

# LLM stats
llm_stats = [p for p in all_panels['llm'] if p['type'] == 'stat'][:4]
for idx, panel in enumerate(llm_stats):
    panel = panel.copy()
    panel['gridPos'] = {"h": 6, "w": 6, "x": idx * 6, "y": current_y}
    panel['id'] = panel_id
    panel_id += 1
    demo_dashboard['panels'].append(panel)
current_y += 6

# LLM provider chart
llm_chart = next((p for p in all_panels['llm'] if p['type'] == 'timeseries' and 'provider' in p.get('title', '').lower()), None)
if llm_chart:
    llm_chart = llm_chart.copy()
    llm_chart['gridPos'] = {"h": 8, "w": 24, "x": 0, "y": current_y}
    llm_chart['id'] = panel_id
    panel_id += 1
    demo_dashboard['panels'].append(llm_chart)
    current_y += 8

# .NET Runtime Section
demo_dashboard['panels'].append(create_row_header("⚙️ .NET Runtime", current_y))
current_y += 2

# Runtime stats
dotnet_stats = [p for p in all_panels['dotnet'] if p['type'] == 'stat'][:6]
for idx, panel in enumerate(dotnet_stats):
    panel = panel.copy()
    panel['gridPos'] = {"h": 5, "w": 4, "x": (idx % 6) * 4, "y": current_y}
    panel['id'] = panel_id
    panel_id += 1
    demo_dashboard['panels'].append(panel)
current_y += 5

# GC chart
gc_chart = next((p for p in all_panels['dotnet'] if 'gc' in p.get('title', '').lower() and p['type'] == 'timeseries'), None)
if gc_chart:
    gc_chart = gc_chart.copy()
    gc_chart['gridPos'] = {"h": 8, "w": 12, "x": 0, "y": current_y}
    gc_chart['id'] = panel_id
    panel_id += 1
    demo_dashboard['panels'].append(gc_chart)

# Memory chart
mem_chart = next((p for p in all_panels['dotnet'] if 'memory' in p.get('title', '').lower() and p['type'] == 'timeseries'), None)
if mem_chart:
    mem_chart = mem_chart.copy()
    mem_chart['gridPos'] = {"h": 8, "w": 12, "x": 12, "y": current_y}
    mem_chart['id'] = panel_id
    panel_id += 1
    demo_dashboard['panels'].append(mem_chart)
current_y += 8

# HTTP & Kestrel Section
demo_dashboard['panels'].append(create_row_header("🌐 HTTP & Kestrel", current_y))
current_y += 2

# HTTP stats
http_stats = [p for p in all_panels['http'] if p['type'] == 'stat'][:6]
for idx, panel in enumerate(http_stats):
    panel = panel.copy()
    panel['gridPos'] = {"h": 5, "w": 4, "x": (idx % 6) * 4, "y": current_y}
    panel['id'] = panel_id
    panel_id += 1
    demo_dashboard['panels'].append(panel)
current_y += 5

# HTTP performance chart
http_chart = next((p for p in all_panels['http'] if p['type'] == 'timeseries'), None)
if http_chart:
    http_chart = http_chart.copy()
    http_chart['gridPos'] = {"h": 8, "w": 24, "x": 0, "y": current_y}
    http_chart['id'] = panel_id
    panel_id += 1
    demo_dashboard['panels'].append(http_chart)
    current_y += 8

# Threading & Concurrency Section
demo_dashboard['panels'].append(create_row_header("🔀 Threading & Concurrency", current_y))
current_y += 2

# Threading stats
thread_stats = [p for p in all_panels['threading'] if p['type'] == 'stat'][:6]
for idx, panel in enumerate(thread_stats):
    panel = panel.copy()
    panel['gridPos'] = {"h": 5, "w": 4, "x": (idx % 6) * 4, "y": current_y}
    panel['id'] = panel_id
    panel_id += 1
    demo_dashboard['panels'].append(panel)
current_y += 5

# Thread pool chart
thread_chart = next((p for p in all_panels['threading'] if 'thread pool' in p.get('title', '').lower() and p['type'] == 'timeseries'), None)
if thread_chart:
    thread_chart = thread_chart.copy()
    thread_chart['gridPos'] = {"h": 8, "w": 12, "x": 0, "y": current_y}
    thread_chart['id'] = panel_id
    panel_id += 1
    demo_dashboard['panels'].append(thread_chart)

# Lock contention chart
lock_chart = next((p for p in all_panels['threading'] if 'lock' in p.get('title', '').lower() and p['type'] == 'timeseries'), None)
if lock_chart:
    lock_chart = lock_chart.copy()
    lock_chart['gridPos'] = {"h": 8, "w": 12, "x": 12, "y": current_y}
    lock_chart['id'] = panel_id
    panel_id += 1
    demo_dashboard['panels'].append(lock_chart)
current_y += 8

# Dependencies Section
demo_dashboard['panels'].append(create_row_header("🔗 External Dependencies", current_y))
current_y += 2

# Dependency stats
dep_stats = [p for p in all_panels['dependencies'] if p['type'] == 'stat'][:4]
for idx, panel in enumerate(dep_stats):
    panel = panel.copy()
    panel['gridPos'] = {"h": 6, "w": 6, "x": idx * 6, "y": current_y}
    panel['id'] = panel_id
    panel_id += 1
    demo_dashboard['panels'].append(panel)
current_y += 6

# Dependency chart
dep_chart = next((p for p in all_panels['dependencies'] if p['type'] == 'timeseries'), None)
if dep_chart:
    dep_chart = dep_chart.copy()
    dep_chart['gridPos'] = {"h": 8, "w": 24, "x": 0, "y": current_y}
    dep_chart['id'] = panel_id
    panel_id += 1
    demo_dashboard['panels'].append(dep_chart)
    current_y += 8

# System Health Section
demo_dashboard['panels'].append(create_row_header("💚 System Health", current_y))
current_y += 2

# System stats
sys_stats = [p for p in all_panels['system'] if p['type'] == 'stat'][:6]
for idx, panel in enumerate(sys_stats):
    panel = panel.copy()
    panel['gridPos'] = {"h": 5, "w": 4, "x": (idx % 6) * 4, "y": current_y}
    panel['id'] = panel_id
    panel_id += 1
    demo_dashboard['panels'].append(panel)
current_y += 5

# CPU chart
cpu_chart = next((p for p in all_panels['system'] if 'cpu' in p.get('title', '').lower() and p['type'] == 'timeseries'), None)
if cpu_chart:
    cpu_chart = cpu_chart.copy()
    cpu_chart['gridPos'] = {"h": 8, "w": 12, "x": 0, "y": current_y}
    cpu_chart['id'] = panel_id
    panel_id += 1
    demo_dashboard['panels'].append(cpu_chart)

# Memory chart from system
sys_mem_chart = next((p for p in all_panels['system'] if 'memory' in p.get('title', '').lower() and p['type'] == 'timeseries'), None)
if sys_mem_chart:
    sys_mem_chart = sys_mem_chart.copy()
    sys_mem_chart['gridPos'] = {"h": 8, "w": 12, "x": 12, "y": current_y}
    sys_mem_chart['id'] = panel_id
    panel_id += 1
    demo_dashboard['panels'].append(sys_mem_chart)

# Write dashboard
with open('../../monitoring/grafana/../../monitoring/grafana/dashboards/bookstore-demo.json', 'w') as f:
    json.dump(demo_dashboard, f, indent=4)

print("✓ Created comprehensive demo dashboard")
print(f"  Total panels: {len(demo_dashboard['panels'])}")
print(f"  Sections: 8 (Performance, Errors, LLM, .NET, HTTP, Threading, Dependencies, System)")
print(f"  Dashboard height: ~{current_y + 8} pixels")
print("  Access at: http://localhost:3000/d/bookstore-demo")
