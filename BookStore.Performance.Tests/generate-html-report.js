#!/usr/bin/env node
/**
 * K6 HTML Report Generator
 * Converts K6 JSON output to a readable HTML report
 */

const fs = require("fs");
const path = require("path");

function generateHTMLReport(jsonFile) {
    // Read K6 JSON output
    const data = fs.readFileSync(jsonFile, "utf8");
    const lines = data.trim().split("\n");

    const metrics = {};
    const checks = {};
    let testInfo = {
        startTime: null,
        endTime: null,
        duration: 0,
    };

    // Parse K6 JSON output (newline-delimited JSON)
    lines.forEach((line) => {
        try {
            const entry = JSON.parse(line);

            if (entry.type === "Metric") {
                const name = entry.metric;
                if (!metrics[name]) {
                    metrics[name] = {
                        type: entry.data.type,
                        values: [],
                    };
                }
                if (entry.data.value !== undefined) {
                    metrics[name].values.push(entry.data.value);
                }
            }

            if (entry.type === "Point") {
                const name = entry.metric;
                if (!metrics[name]) {
                    metrics[name] = {
                        type: entry.data.type,
                        values: [],
                    };
                }
                if (entry.data.value !== undefined) {
                    metrics[name].values.push(entry.data.value);

                    // Track test timing
                    const timestamp = entry.data.time;
                    if (!testInfo.startTime || timestamp < testInfo.startTime) {
                        testInfo.startTime = timestamp;
                    }
                    if (!testInfo.endTime || timestamp > testInfo.endTime) {
                        testInfo.endTime = timestamp;
                    }
                }
            }
        } catch (e) {
            // Skip invalid lines
        }
    });

    // Calculate statistics
    function calculateStats(values) {
        if (values.length === 0) return null;

        values.sort((a, b) => a - b);
        const sum = values.reduce((a, b) => a + b, 0);
        const mean = sum / values.length;
        const min = values[0];
        const max = values[values.length - 1];
        const p50 = values[Math.floor(values.length * 0.5)];
        const p95 = values[Math.floor(values.length * 0.95)];
        const p99 = values[Math.floor(values.length * 0.99)];

        return { mean, min, max, p50, p95, p99, count: values.length };
    }

    // Generate HTML
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>K6 Performance Test Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #f5f7fa;
            padding: 2rem;
            line-height: 1.6;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            border-radius: 12px;
            margin-bottom: 2rem;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
        .header p { opacity: 0.9; font-size: 1.1rem; }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        .card {
            background: white;
            padding: 1.5rem;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            transition: transform 0.2s;
        }
        .card:hover { transform: translateY(-4px); }
        .card h3 {
            color: #64748b;
            font-size: 0.9rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 0.5rem;
        }
        .card .value {
            font-size: 2.5rem;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 0.25rem;
        }
        .card .label {
            color: #94a3b8;
            font-size: 0.9rem;
        }
        .metrics-table {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }
        .metrics-table h2 {
            background: #f8fafc;
            padding: 1.5rem;
            font-size: 1.5rem;
            color: #1e293b;
            border-bottom: 2px solid #e2e8f0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        thead th {
            background: #f8fafc;
            padding: 1rem;
            text-align: left;
            font-weight: 600;
            color: #64748b;
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        tbody td {
            padding: 1rem;
            border-top: 1px solid #e2e8f0;
            color: #334155;
        }
        tbody tr:hover {
            background: #f8fafc;
        }
        .metric-name {
            font-weight: 600;
            color: #1e293b;
        }
        .good { color: #10b981; font-weight: 600; }
        .warning { color: #f59e0b; font-weight: 600; }
        .bad { color: #ef4444; font-weight: 600; }
        .footer {
            text-align: center;
            color: #94a3b8;
            margin-top: 3rem;
            padding: 2rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 K6 Performance Test Report</h1>
            <p>Generated: ${new Date().toLocaleString()}</p>
            ${testInfo.startTime ? `<p>Duration: ${Math.round((new Date(testInfo.endTime) - new Date(testInfo.startTime)) / 1000)}s</p>` : ""}
        </div>

        <div class="summary">
            ${generateSummaryCards(metrics)}
        </div>

        <div class="metrics-table">
            <h2>Detailed Metrics</h2>
            <table>
                <thead>
                    <tr>
                        <th>Metric</th>
                        <th>Count</th>
                        <th>Mean</th>
                        <th>Min</th>
                        <th>Max</th>
                        <th>P50</th>
                        <th>P95</th>
                        <th>P99</th>
                    </tr>
                </thead>
                <tbody>
                    ${generateMetricsRows(metrics)}
                </tbody>
            </table>
        </div>

        <div class="footer">
            <p>Generated by K6 HTML Report Generator</p>
            <p>Part of BookStore Performance Testing Suite</p>
        </div>
    </div>
</body>
</html>
    `;

    function generateSummaryCards(metrics) {
        const cards = [];

        // HTTP request duration
        if (metrics["http_req_duration"]) {
            const stats = calculateStats(metrics["http_req_duration"].values);
            if (stats) {
                cards.push(`
                    <div class="card">
                        <h3>Response Time (P95)</h3>
                        <div class="value ${stats.p95 < 1000 ? "good" : stats.p95 < 2000 ? "warning" : "bad"}">${stats.p95.toFixed(0)}ms</div>
                        <div class="label">95th percentile</div>
                    </div>
                `);
            }
        }

        // HTTP requests
        if (metrics["http_reqs"]) {
            const stats = calculateStats(metrics["http_reqs"].values);
            if (stats) {
                cards.push(`
                    <div class="card">
                        <h3>Total Requests</h3>
                        <div class="value">${stats.count.toLocaleString()}</div>
                        <div class="label">HTTP requests</div>
                    </div>
                `);
            }
        }

        // VUs
        if (metrics["vus"]) {
            const stats = calculateStats(metrics["vus"].values);
            if (stats) {
                cards.push(`
                    <div class="card">
                        <h3>Peak Virtual Users</h3>
                        <div class="value">${Math.round(stats.max)}</div>
                        <div class="label">Concurrent users</div>
                    </div>
                `);
            }
        }

        // Iterations
        if (metrics["iterations"]) {
            const stats = calculateStats(metrics["iterations"].values);
            if (stats) {
                cards.push(`
                    <div class="card">
                        <h3>Iterations</h3>
                        <div class="value">${stats.count.toLocaleString()}</div>
                        <div class="label">Test iterations</div>
                    </div>
                `);
            }
        }

        return cards.join("\n");
    }

    function generateMetricsRows(metrics) {
        const rows = [];
        const priorityMetrics = [
            "http_req_duration",
            "http_req_waiting",
            "http_req_connecting",
            "http_req_sending",
            "http_req_receiving",
            "http_reqs",
            "iterations",
            "vus",
            "data_received",
            "data_sent",
        ];

        // Add priority metrics first
        priorityMetrics.forEach((name) => {
            if (metrics[name]) {
                const stats = calculateStats(metrics[name].values);
                if (stats) {
                    rows.push(createMetricRow(name, stats, metrics[name].type));
                }
            }
        });

        // Add remaining metrics
        Object.keys(metrics).forEach((name) => {
            if (!priorityMetrics.includes(name)) {
                const stats = calculateStats(metrics[name].values);
                if (stats) {
                    rows.push(createMetricRow(name, stats, metrics[name].type));
                }
            }
        });

        return rows.join("\n");
    }

    function createMetricRow(name, stats, type) {
        const formatValue = (val) => {
            if (name.includes("duration") || name.includes("time")) {
                return `${val.toFixed(2)}ms`;
            }
            if (name.includes("data_")) {
                return `${(val / 1024).toFixed(2)} KB`;
            }
            return val.toFixed(2);
        };

        return `
            <tr>
                <td class="metric-name">${name}</td>
                <td>${stats.count.toLocaleString()}</td>
                <td>${formatValue(stats.mean)}</td>
                <td>${formatValue(stats.min)}</td>
                <td>${formatValue(stats.max)}</td>
                <td>${formatValue(stats.p50)}</td>
                <td>${formatValue(stats.p95)}</td>
                <td>${formatValue(stats.p99)}</td>
            </tr>
        `;
    }

    return html;
}

// Main execution
const args = process.argv.slice(2);
if (args.length === 0) {
    console.error("Usage: node generate-html-report.js <k6-json-output-file>");
    console.error("Example: node generate-html-report.js results/smoke-20250101-120000.json");
    process.exit(1);
}

const jsonFile = args[0];
if (!fs.existsSync(jsonFile)) {
    console.error(`Error: File not found: ${jsonFile}`);
    process.exit(1);
}

const html = generateHTMLReport(jsonFile);
const outputFile = jsonFile.replace(".json", ".html");
fs.writeFileSync(outputFile, html);

console.log(`✓ HTML report generated: ${outputFile}`);
console.log(`  Open in browser: open ${outputFile}`);
