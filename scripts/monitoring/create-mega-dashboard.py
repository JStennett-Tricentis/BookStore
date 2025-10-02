#!/usr/bin/env python3
"""Create a MEGA dashboard with ALL widgets from all dashboards organized into sections"""

import json

# Load all existing dashboards
dashboards = {
    'Performance Testing': '../../monitoring/grafana/dashboards/bookstore-performance.json',
    'Errors & Diagnostics': '../../monitoring/grafana/dashboards/bookstore-errors-diagnostics.json',
    'LLM Performance': '../../monitoring/grafana/dashboards/bookstore-llm-metrics.json',
    '.NET Runtime': '../../monitoring/grafana/dashboards/bookstore-dotnet-runtime.json',
    'HTTP & Kestrel': '../../monitoring/grafana/dashboards/bookstore-http-performance.json',
    'Threading & Concurrency': '../../monitoring/grafana/dashboards/bookstore-threading-concurrency.json',
    'External Dependencies': '../../monitoring/grafana/dashboards/bookstore-dependencies.json',
    'System Health': '../../monitoring/grafana/dashboards/bookstore-system-health.json',
}

# Emoji mapping
emojis = {
    'Performance Testing': '📊',
    'Errors & Diagnostics': '🚨',
    'LLM Performance': '🤖',
    '.NET Runtime': '⚙️',
    'HTTP & Kestrel': '🌐',
    'Threading & Concurrency': '🔀',
    'External Dependencies': '🔗',
    'System Health': '💚',
}

# Create mega dashboard
mega_dashboard = {
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
    "tags": ["bookstore", "mega", "complete", "all-metrics"],
    "templating": {"list": []},
    "time": {
        "from": "now-2m",
        "to": "now"
    },
    "timepicker": {},
    "timezone": "",
    "title": "MEGA Dashboard - All Metrics",
    "uid": "bookstore-mega",
    "version": 1
}

def create_row_header(title, y_pos, panel_id):
    """Create a section header"""
    return {
        "datasource": {"type": "prometheus"},
        "gridPos": {"h": 2, "w": 24, "x": 0, "y": y_pos},
        "id": panel_id,
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
total_original_panels = 0

# Process each dashboard
for section_name, dashboard_path in dashboards.items():
    print(f"\n📁 Processing: {section_name}")

    # Read source dashboard
    with open(dashboard_path, 'r') as f:
        source_dashboard = json.load(f)

    source_panels = source_dashboard.get('panels', [])
    total_original_panels += len(source_panels)
    print(f"   Found {len(source_panels)} panels")

    # Add section header
    emoji = emojis.get(section_name, '📌')
    header = create_row_header(f"{emoji} {section_name}", current_y, panel_id)
    mega_dashboard['panels'].append(header)
    panel_id += 1
    current_y += 2

    # Calculate layout for panels
    # We'll use a flowing layout - let Grafana handle wrapping
    current_row_y = current_y
    current_x = 0
    max_row_height = 0

    for source_panel in source_panels:
        panel = source_panel.copy()

        # Get original dimensions
        orig_h = panel['gridPos']['h']
        orig_w = panel['gridPos']['w']

        # Check if panel fits in current row (24 units wide)
        if current_x + orig_w > 24:
            # Move to next row
            current_row_y += max_row_height
            current_x = 0
            max_row_height = 0

        # Position panel
        panel['gridPos'] = {
            "h": orig_h,
            "w": orig_w,
            "x": current_x,
            "y": current_row_y
        }

        # Update tracking
        current_x += orig_w
        max_row_height = max(max_row_height, orig_h)

        # Assign new ID
        panel['id'] = panel_id
        panel_id += 1

        mega_dashboard['panels'].append(panel)

    # Move to next section (add final row height + spacing)
    current_y = current_row_y + max_row_height + 2

    print(f"   ✓ Added {len(source_panels)} panels")

# Write mega dashboard
with open('../../monitoring/grafana/../../monitoring/grafana/dashboards/bookstore-mega.json', 'w') as f:
    json.dump(mega_dashboard, f, indent=4)

print("\n" + "="*70)
print("✓ MEGA DASHBOARD CREATED!")
print("="*70)
print(f"  Total sections: {len(dashboards)}")
print(f"  Total panels: {len(mega_dashboard['panels'])} ({len(mega_dashboard['panels']) - len(dashboards)} widgets + {len(dashboards)} headers)")
print(f"  Original panels: {total_original_panels}")
print(f"  Dashboard height: ~{current_y} units")
print(f"  File: ../../monitoring/grafana/dashboards/bookstore-mega.json")
print(f"  Access at: http://localhost:3000/d/bookstore-mega")
print("\n📊 Section Breakdown:")
for section in dashboards.keys():
    emoji = emojis.get(section, '📌')
    print(f"   {emoji} {section}")
