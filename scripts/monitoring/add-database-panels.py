#!/usr/bin/env python3
"""Add MongoDB and Redis panels to the dependencies dashboard."""

import json
import sys
from pathlib import Path

# Get the script directory and navigate to dashboard
script_dir = Path(__file__).parent
dashboard_path = script_dir / "../../monitoring/grafana/dashboards/bookstore-dependencies.json"

# Load the dashboard
with open(dashboard_path, 'r') as f:
    dashboard = json.load(f)

# Find the last panel to determine next Y position
last_panel = max(dashboard['panels'], key=lambda p: p['gridPos']['y'] + p['gridPos']['h'])
next_y = last_panel['gridPos']['y'] + last_panel['gridPos']['h']

# MongoDB panels
mongodb_panels = [
    {
        "datasource": {"type": "prometheus"},
        "fieldConfig": {
            "defaults": {
                "color": {"mode": "palette-classic"},
                "custom": {
                    "axisCenteredZero": False,
                    "axisColorMode": "text",
                    "axisLabel": "",
                    "axisPlacement": "auto",
                    "barAlignment": 0,
                    "drawStyle": "line",
                    "fillOpacity": 10,
                    "gradientMode": "none",
                    "hideFrom": {"tooltip": False, "viz": False, "legend": False},
                    "lineInterpolation": "linear",
                    "lineWidth": 2,
                    "pointSize": 5,
                    "scaleDistribution": {"type": "linear"},
                    "showPoints": "never",
                    "spanNulls": False,
                    "stacking": {"group": "A", "mode": "none"},
                    "thresholdsStyle": {"mode": "off"}
                },
                "mappings": [],
                "thresholds": {
                    "mode": "absolute",
                    "steps": [{"color": "green", "value": None}]
                },
                "unit": "ops"
            },
            "overrides": []
        },
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": next_y},
        "id": 100,
        "options": {
            "legend": {
                "calcs": ["mean", "lastNotNull", "max"],
                "displayMode": "table",
                "placement": "bottom",
                "showLegend": True
            },
            "tooltip": {"mode": "multi", "sort": "none"}
        },
        "targets": [
            {
                "datasource": {"type": "prometheus"},
                "expr": "rate(mongodb_operations_count[1m])",
                "legendFormat": "{{operation}}",
                "refId": "A"
            }
        ],
        "title": "MongoDB Operations/sec",
        "type": "timeseries"
    },
    {
        "datasource": {"type": "prometheus"},
        "fieldConfig": {
            "defaults": {
                "color": {"mode": "palette-classic"},
                "custom": {
                    "axisCenteredZero": False,
                    "axisColorMode": "text",
                    "axisLabel": "",
                    "axisPlacement": "auto",
                    "barAlignment": 0,
                    "drawStyle": "line",
                    "fillOpacity": 10,
                    "gradientMode": "none",
                    "hideFrom": {"tooltip": False, "viz": False, "legend": False},
                    "lineInterpolation": "linear",
                    "lineWidth": 2,
                    "pointSize": 5,
                    "scaleDistribution": {"type": "linear"},
                    "showPoints": "never",
                    "spanNulls": False,
                    "stacking": {"group": "A", "mode": "none"},
                    "thresholdsStyle": {"mode": "off"}
                },
                "mappings": [],
                "thresholds": {
                    "mode": "absolute",
                    "steps": [{"color": "green", "value": None}]
                },
                "unit": "ms"
            },
            "overrides": []
        },
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": next_y},
        "id": 101,
        "options": {
            "legend": {
                "calcs": ["mean", "p95", "max"],
                "displayMode": "table",
                "placement": "bottom",
                "showLegend": True
            },
            "tooltip": {"mode": "multi", "sort": "none"}
        },
        "targets": [
            {
                "datasource": {"type": "prometheus"},
                "expr": "histogram_quantile(0.50, rate(mongodb_operation_duration_bucket[1m]))",
                "legendFormat": "P50 - {{operation}}",
                "refId": "A"
            },
            {
                "datasource": {"type": "prometheus"},
                "expr": "histogram_quantile(0.95, rate(mongodb_operation_duration_bucket[1m]))",
                "legendFormat": "P95 - {{operation}}",
                "refId": "B"
            },
            {
                "datasource": {"type": "prometheus"},
                "expr": "histogram_quantile(0.99, rate(mongodb_operation_duration_bucket[1m]))",
                "legendFormat": "P99 - {{operation}}",
                "refId": "C"
            }
        ],
        "title": "MongoDB Operation Duration (Percentiles)",
        "type": "timeseries"
    }
]

# Redis panels
redis_panels = [
    {
        "datasource": {"type": "prometheus"},
        "fieldConfig": {
            "defaults": {
                "color": {"mode": "palette-classic"},
                "custom": {
                    "axisCenteredZero": False,
                    "axisColorMode": "text",
                    "axisLabel": "",
                    "axisPlacement": "auto",
                    "barAlignment": 0,
                    "drawStyle": "line",
                    "fillOpacity": 10,
                    "gradientMode": "none",
                    "hideFrom": {"tooltip": False, "viz": False, "legend": False},
                    "lineInterpolation": "linear",
                    "lineWidth": 2,
                    "pointSize": 5,
                    "scaleDistribution": {"type": "linear"},
                    "showPoints": "never",
                    "spanNulls": False,
                    "stacking": {"group": "A", "mode": "none"},
                    "thresholdsStyle": {"mode": "off"}
                },
                "mappings": [],
                "thresholds": {
                    "mode": "absolute",
                    "steps": [{"color": "green", "value": None}]
                },
                "unit": "ops"
            },
            "overrides": []
        },
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": next_y + 8},
        "id": 102,
        "options": {
            "legend": {
                "calcs": ["mean", "lastNotNull", "max"],
                "displayMode": "table",
                "placement": "bottom",
                "showLegend": True
            },
            "tooltip": {"mode": "multi", "sort": "none"}
        },
        "targets": [
            {
                "datasource": {"type": "prometheus"},
                "expr": "rate(redis_operations_count[1m])",
                "legendFormat": "{{operation}}",
                "refId": "A"
            }
        ],
        "title": "Redis Operations/sec",
        "type": "timeseries"
    },
    {
        "datasource": {"type": "prometheus"},
        "fieldConfig": {
            "defaults": {
                "color": {"mode": "palette-classic"},
                "custom": {
                    "axisCenteredZero": False,
                    "axisColorMode": "text",
                    "axisLabel": "",
                    "axisPlacement": "auto",
                    "barAlignment": 0,
                    "drawStyle": "line",
                    "fillOpacity": 10,
                    "gradientMode": "none",
                    "hideFrom": {"tooltip": False, "viz": False, "legend": False},
                    "lineInterpolation": "linear",
                    "lineWidth": 2,
                    "pointSize": 5,
                    "scaleDistribution": {"type": "linear"},
                    "showPoints": "never",
                    "spanNulls": False,
                    "stacking": {"group": "A", "mode": "normal"},
                    "thresholdsStyle": {"mode": "off"}
                },
                "mappings": [],
                "thresholds": {
                    "mode": "absolute",
                    "steps": [{"color": "green", "value": None}]
                },
                "unit": "short"
            },
            "overrides": []
        },
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": next_y + 8},
        "id": 103,
        "options": {
            "legend": {
                "calcs": ["sum"],
                "displayMode": "table",
                "placement": "bottom",
                "showLegend": True
            },
            "tooltip": {"mode": "multi", "sort": "none"}
        },
        "targets": [
            {
                "datasource": {"type": "prometheus"},
                "expr": "rate(redis_cache_hits[1m])",
                "legendFormat": "Cache Hits",
                "refId": "A"
            },
            {
                "datasource": {"type": "prometheus"},
                "expr": "rate(redis_cache_misses[1m])",
                "legendFormat": "Cache Misses",
                "refId": "B"
            }
        ],
        "title": "Redis Cache Hit Rate",
        "type": "timeseries"
    },
    {
        "datasource": {"type": "prometheus"},
        "fieldConfig": {
            "defaults": {
                "color": {"mode": "thresholds"},
                "mappings": [],
                "thresholds": {
                    "mode": "absolute",
                    "steps": [
                        {"color": "red", "value": None},
                        {"color": "yellow", "value": 50},
                        {"color": "green", "value": 80}
                    ]
                },
                "unit": "percent"
            },
            "overrides": []
        },
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": next_y + 16},
        "id": 104,
        "options": {
            "orientation": "auto",
            "reduceOptions": {
                "values": False,
                "calcs": ["lastNotNull"],
                "fields": ""
            },
            "showThresholdLabels": False,
            "showThresholdMarkers": True
        },
        "pluginVersion": "10.2.0",
        "targets": [
            {
                "datasource": {"type": "prometheus"},
                "expr": "(rate(redis_cache_hits[1m]) / (rate(redis_cache_hits[1m]) + rate(redis_cache_misses[1m]))) * 100",
                "legendFormat": "Hit Ratio",
                "refId": "A"
            }
        ],
        "title": "Cache Hit Ratio %",
        "type": "gauge"
    },
    {
        "datasource": {"type": "prometheus"},
        "fieldConfig": {
            "defaults": {
                "color": {"mode": "palette-classic"},
                "custom": {
                    "axisCenteredZero": False,
                    "axisColorMode": "text",
                    "axisLabel": "",
                    "axisPlacement": "auto",
                    "barAlignment": 0,
                    "drawStyle": "line",
                    "fillOpacity": 10,
                    "gradientMode": "none",
                    "hideFrom": {"tooltip": False, "viz": False, "legend": False},
                    "lineInterpolation": "linear",
                    "lineWidth": 2,
                    "pointSize": 5,
                    "scaleDistribution": {"type": "linear"},
                    "showPoints": "never",
                    "spanNulls": False,
                    "stacking": {"group": "A", "mode": "none"},
                    "thresholdsStyle": {"mode": "off"}
                },
                "mappings": [],
                "thresholds": {
                    "mode": "absolute",
                    "steps": [{"color": "green", "value": None}]
                },
                "unit": "ms"
            },
            "overrides": []
        },
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": next_y + 16},
        "id": 105,
        "options": {
            "legend": {
                "calcs": ["mean", "p95", "max"],
                "displayMode": "table",
                "placement": "bottom",
                "showLegend": True
            },
            "tooltip": {"mode": "multi", "sort": "none"}
        },
        "targets": [
            {
                "datasource": {"type": "prometheus"},
                "expr": "histogram_quantile(0.50, rate(redis_operation_duration_bucket[1m]))",
                "legendFormat": "P50 - {{operation}}",
                "refId": "A"
            },
            {
                "datasource": {"type": "prometheus"},
                "expr": "histogram_quantile(0.95, rate(redis_operation_duration_bucket[1m]))",
                "legendFormat": "P95 - {{operation}}",
                "refId": "B"
            },
            {
                "datasource": {"type": "prometheus"},
                "expr": "histogram_quantile(0.99, rate(redis_operation_duration_bucket[1m]))",
                "legendFormat": "P99 - {{operation}}",
                "refId": "C"
            }
        ],
        "title": "Redis Operation Duration (Percentiles)",
        "type": "timeseries"
    }
]

# Add all new panels
dashboard['panels'].extend(mongodb_panels)
dashboard['panels'].extend(redis_panels)

# Save the updated dashboard
with open(dashboard_path, 'w') as f:
    json.dump(dashboard, f, indent=4)

print(f"✅ Added {len(mongodb_panels)} MongoDB panels and {len(redis_panels)} Redis panels")
print(f"   Total panels now: {len(dashboard['panels'])}")
