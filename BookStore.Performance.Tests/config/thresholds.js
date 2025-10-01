export function getThresholds(scenario) {
    const baseThresholds = {
        http_req_duration: ["p(95)<2000", "p(99)<5000"],
        http_req_failed: ["rate<0.01"], // Less than 1% failures
    };

    const scenarioThresholds = {
        smoke: {
            ...baseThresholds,
            http_req_duration: ["p(95)<3000", "p(99)<8000"],
            http_req_failed: ["rate<0.02"], // 2% for smoke tests
        },
        load: {
            ...baseThresholds,
            http_req_duration: ["p(95)<2000", "p(99)<5000"],
            http_req_failed: ["rate<0.01"],
        },
        stress: {
            ...baseThresholds,
            http_req_duration: ["p(95)<5000", "p(99)<10000"],
            http_req_failed: ["rate<0.05"], // Allow more failures under stress
        },
        spike: {
            ...baseThresholds,
            http_req_duration: ["p(95)<8000", "p(99)<15000"],
            http_req_failed: ["rate<0.10"], // Allow even more during spikes
        }
    };

    return scenarioThresholds[scenario] || baseThresholds;
}