#!/usr/bin/env python3
"""Add HTTP status code panels to the Errors & Diagnostics dashboard"""

import json

# Read the dashboard
with open('dashboards/bookstore-errors-diagnostics.json', 'r') as f:
    dashboard = json.load(f)

# Status codes to add
status_codes = [
    {"code": "400", "title": "400 Bad Request", "desc": "Invalid request syntax or validation errors", "threshold_yellow": 1, "threshold_orange": 10, "row": 12},
    {"code": "401", "title": "401 Unauthorized", "desc": "Authentication required or failed", "threshold_yellow": 1, "threshold_orange": 10, "row": 12},
    {"code": "404", "title": "404 Not Found", "desc": "Resource doesn't exist", "threshold_yellow": 1, "threshold_orange": 10, "row": 12},
    {"code": "409", "title": "409 Conflict", "desc": "Resource already exists or conflicting state", "threshold_yellow": 1, "threshold_orange": 10, "row": 12},
    {"code": "410", "title": "410 Gone", "desc": "Resource permanently deleted", "threshold_yellow": 1, "threshold_orange": 10, "row": 12},
    {"code": "422", "title": "422 Validation Error", "desc": "Validation failed", "threshold_yellow": 1, "threshold_orange": 10, "row": 12},
    {"code": "500", "title": "500 Internal Server Error", "desc": "Unhandled exceptions", "threshold_orange": 1, "threshold_red": 5, "row": 16},
    {"code": "503", "title": "503 Service Unavailable", "desc": "Dependencies down or overloaded", "threshold_orange": 1, "threshold_red": 5, "row": 16},
]

# Remove existing status code panels (id 11-18 if they exist)
dashboard['panels'] = [p for p in dashboard['panels'] if p['id'] not in range(11, 19)]

# Get max ID to start from
max_id = max(p['id'] for p in dashboard['panels'])

# Add new status code panels
x_position = 0
for idx, status in enumerate(status_codes):
    panel_id = max_id + idx + 1

    # 4xx codes get yellow/orange thresholds, 5xx get orange/red
    if status['code'].startswith('5'):
        thresholds = [
            {"color": "green", "value": None},
            {"color": "orange", "value": status.get('threshold_orange', 1)},
            {"color": "red", "value": status.get('threshold_red', 5)}
        ]
    else:
        thresholds = [
            {"color": "green", "value": None},
            {"color": "yellow", "value": status.get('threshold_yellow', 1)},
            {"color": "orange", "value": status.get('threshold_orange', 10)}
        ]

    # Calculate grid position - 6 panels per row for 4xx, 2 large panels for 5xx
    if status['code'].startswith('5'):
        width = 6
        x = (idx - 6) * 6  # 500 and 503 on second row
    else:
        width = 4
        x = (idx % 6) * 4

    panel = {
        "datasource": {"type": "prometheus"},
        "description": status['desc'],
        "fieldConfig": {
            "defaults": {
                "color": {"mode": "thresholds"},
                "mappings": [],
                "thresholds": {
                    "mode": "absolute",
                    "steps": thresholds
                },
                "unit": "reqps"
            },
            "overrides": []
        },
        "gridPos": {
            "h": 4,
            "w": width,
            "x": x,
            "y": status['row']
        },
        "id": panel_id,
        "options": {
            "colorMode": "value",
            "graphMode": "area",
            "justifyMode": "auto",
            "orientation": "auto",
            "reduceOptions": {
                "values": False,
                "calcs": ["lastNotNull"],
                "fields": ""
            },
            "textMode": "auto"
        },
        "pluginVersion": "10.0.0",
        "targets": [
            {
                "expr": f'sum(rate(http_server_request_duration_seconds_count{{http_response_status_code="{status["code"]}"}}[1m])) or vector(0)',
                "refId": "A"
            }
        ],
        "title": status['title'],
        "type": "stat"
    }

    dashboard['panels'].append(panel)

# Adjust y positions of existing panels that come after row 12
for panel in dashboard['panels']:
    if panel['id'] < 11 and panel['gridPos']['y'] >= 12:
        panel['gridPos']['y'] += 8  # Move down by 8 to make room for new panels

# Write back
with open('dashboards/bookstore-errors-diagnostics.json', 'w') as f:
    json.dump(dashboard, f, indent=4)

print("✓ Added HTTP status code panels to Errors & Diagnostics dashboard")
print("  Added panels: 400, 401, 404, 409, 410, 422, 500, 503")
