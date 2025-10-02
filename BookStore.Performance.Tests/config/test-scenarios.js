/**
 * Test Scenario Configurations
 *
 * All performance test scenarios with configurable parameters:
 * - Load stages (duration, target VUs)
 * - Graceful ramp down periods
 * - Test-specific settings
 */

export const testScenarios = {
    // ==================== SMOKE TEST ====================
    smoke: {
        stages: [
            { duration: "30s", target: 1 },
            { duration: "1m", target: 1 },
            { duration: "30s", target: 0 },
        ],
        gracefulRampDown: "30s",
    },

    // ==================== LOAD TEST ====================
    load: {
        stages: [
            { duration: "1m", target: 5 },
            { duration: "3m", target: 10 },
            { duration: "5m", target: 10 },
            { duration: "1m", target: 0 },
        ],
        gracefulRampDown: "30s",
    },

    // ==================== STRESS TEST ====================
    stress: {
        stages: [
            { duration: "2m", target: 10 },
            { duration: "5m", target: 20 },
            { duration: "5m", target: 30 },
            { duration: "5m", target: 30 },
            { duration: "2m", target: 0 },
        ],
        gracefulRampDown: "30s",
    },

    // ==================== SPIKE TEST ====================
    spike: {
        stages: [
            { duration: "10s", target: 5 },
            { duration: "1m", target: 5 },
            { duration: "10s", target: 50 },
            { duration: "3m", target: 50 },
            { duration: "10s", target: 5 },
            { duration: "3m", target: 5 },
            { duration: "10s", target: 0 },
        ],
        gracefulRampDown: "10s",
    },

    // ==================== LLM SMOKE TEST ====================
    llmSmoke: {
        stages: [
            { duration: "30s", target: 1 },
            { duration: "2m", target: 2 },
            { duration: "30s", target: 0 },
        ],
        gracefulRampDown: "30s",
    },

    // ==================== LLM LOAD TEST ====================
    llmLoad: {
        stages: [
            { duration: "1m", target: 3 },
            { duration: "5m", target: 5 },
            { duration: "5m", target: 5 },
            { duration: "1m", target: 0 },
        ],
        gracefulRampDown: "30s",
    },

    // ==================== LLM STRESS TEST ====================
    llmStress: {
        stages: [
            { duration: "2m", target: 5 },
            { duration: "5m", target: 10 },
            { duration: "5m", target: 15 },
            { duration: "3m", target: 15 },
            { duration: "2m", target: 0 },
        ],
        gracefulRampDown: "30s",
    },

    // ==================== LLM SPIKE TEST ====================
    llmSpike: {
        stages: [
            { duration: "30s", target: 2 },
            { duration: "1m", target: 2 },
            { duration: "20s", target: 20 },
            { duration: "3m", target: 20 },
            { duration: "20s", target: 2 },
            { duration: "2m", target: 2 },
            { duration: "30s", target: 0 },
        ],
        gracefulRampDown: "20s",
    },

    // ==================== ERROR TEST ====================
    errorTest: {
        stages: [
            { duration: "30s", target: 10 },  // Warm up
            { duration: "2m", target: 30 },   // Ramp to high load
            { duration: "5m", target: 50 },   // Heavy sustained load
            { duration: "2m", target: 75 },   // Peak load
            { duration: "1m", target: 0 },    // Ramp down
        ],
        gracefulRampDown: "30s",
        thresholds: {
            // More lenient - we're testing error handling at scale
            errors: ["rate<0.7"],        // Allow up to 70% errors
            errors_4xx: ["rate<0.5"],
            errors_5xx: ["rate<0.3"],
            http_req_duration: ["p(95)<10000"],
        },
    },

    // ==================== MIXED WORKLOAD ====================
    mixed: {
        stages: [
            { duration: "1m", target: 5 },   // Warm up
            { duration: "3m", target: 10 },  // Ramp to steady load
            { duration: "10m", target: 10 }, // Sustained mixed load
            { duration: "2m", target: 15 },  // Peak traffic
            { duration: "5m", target: 15 },  // Hold peak
            { duration: "2m", target: 0 },   // Ramp down
        ],
        gracefulRampDown: "30s",
        llmPercentage: 20,  // 20% LLM traffic
        aiEnabledUsers: 30, // 30% of users use AI
        thresholds: {
            crud_response_time: ["p(95)<1000", "p(99)<2000"],
            crud_errors: ["rate<0.01"],
            llm_response_time: ["p(95)<8000", "p(99)<12000"],
            llm_errors: ["rate<0.05"],
            http_req_duration: ["p(95)<5000", "p(99)<10000"],
            http_req_failed: ["rate<0.02"],
        },
    },

    // ==================== MIXED WORKLOAD HEAVY ====================
    mixedHeavy: {
        stages: [
            { duration: "1m", target: 5 },   // Warm up
            { duration: "3m", target: 10 },  // Ramp to steady load
            { duration: "10m", target: 10 }, // Sustained mixed load
            { duration: "2m", target: 15 },  // Peak traffic
            { duration: "5m", target: 15 },  // Hold peak
            { duration: "2m", target: 0 },   // Ramp down
        ],
        gracefulRampDown: "30s",
        llmPercentage: 50,  // 50% LLM traffic (heavy AI usage)
        aiEnabledUsers: 60, // 60% of users use AI
        thresholds: {
            crud_response_time: ["p(95)<1000", "p(99)<2000"],
            crud_errors: ["rate<0.01"],
            llm_response_time: ["p(95)<12000", "p(99)<18000"], // Higher for heavy load
            llm_errors: ["rate<0.08"],
            http_req_duration: ["p(95)<8000", "p(99)<15000"],
            http_req_failed: ["rate<0.03"],
        },
    },
};

/**
 * Get scenario configuration by name
 * @param {string} scenarioName - Name of the scenario
 * @returns {object} Scenario configuration
 */
export function getScenarioConfig(scenarioName) {
    const config = testScenarios[scenarioName];
    if (!config) {
        console.warn(`Unknown scenario: ${scenarioName}, defaulting to 'load'`);
        return testScenarios.load;
    }
    return config;
}

/**
 * Get stages for a scenario
 * @param {string} scenarioName - Name of the scenario
 * @returns {array} Load stages
 */
export function getStages(scenarioName) {
    const config = getScenarioConfig(scenarioName);
    return config.stages;
}

/**
 * Get graceful ramp down period
 * @param {string} scenarioName - Name of the scenario
 * @returns {string} Graceful ramp down period
 */
export function getGracefulRampDown(scenarioName) {
    const config = getScenarioConfig(scenarioName);
    return config.gracefulRampDown || "30s";
}

/**
 * Get scenario-specific thresholds (if any)
 * @param {string} scenarioName - Name of the scenario
 * @returns {object|null} Thresholds or null
 */
export function getScenarioThresholds(scenarioName) {
    const config = getScenarioConfig(scenarioName);
    return config.thresholds || null;
}

/**
 * Get LLM traffic percentage for mixed workloads
 * @param {string} scenarioName - Name of the scenario
 * @returns {number} LLM traffic percentage
 */
export function getLLMPercentage(scenarioName) {
    const config = getScenarioConfig(scenarioName);
    return config.llmPercentage || 20;
}

/**
 * Get AI-enabled user percentage for mixed workloads
 * @param {string} scenarioName - Name of the scenario
 * @returns {number} AI-enabled user percentage
 */
export function getAIEnabledUsers(scenarioName) {
    const config = getScenarioConfig(scenarioName);
    return config.aiEnabledUsers || 30;
}
