/**
 * Chaos Test Configuration
 *
 * Adjust these values to control the chaos test behavior:
 * - Test duration and timing
 * - Number of virtual users (VUs)
 * - Data generation amounts
 * - Error rates
 */

export const chaosConfig = {
    // ==================== DATA SETUP ====================
    dataSetup: {
        // Number of books to create before testing starts
        numberOfBooks: 50,

        // How long to wait for data setup (max duration)
        maxDuration: "30s",
    },

    // ==================== RANDOM SPIKES ====================
    randomSpikes: {
        startTime: "30s",
        stages: [
            { duration: "30s", target: 5 },   // Ramp up
            { duration: "10s", target: 50 },  // SPIKE!
            { duration: "20s", target: 2 },   // Drop
            { duration: "10s", target: 30 },  // SPIKE!
            { duration: "20s", target: 5 },   // Drop
            { duration: "10s", target: 75 },  // MASSIVE SPIKE!
            { duration: "30s", target: 3 },   // Cool down
        ],
        gracefulRampDown: "10s",
    },

    // ==================== LLM BOMBARDMENT ====================
    llmBombardment: {
        startTime: "40s",
        duration: "2m10s",
        vus: 3, // Constant number of users
    },

    // ==================== ERROR CHAOS ====================
    errorChaos: {
        startTime: "50s",
        duration: "2m",
        vus: 2, // Constant number of users
    },

    // ==================== MEMORY PRESSURE ====================
    memoryPressure: {
        startTime: "60s",
        duration: "1m30s",
        vus: 5, // Constant number of users
        booksPerIteration: 5, // Number of books created per iteration
        rapidGets: 10, // Number of rapid GET requests per iteration
    },

    // ==================== DATABASE CHAOS ====================
    databaseChaos: {
        startTime: "45s",
        stages: [
            { duration: "15s", target: 10 },
            { duration: "30s", target: 25 },
            { duration: "20s", target: 5 },
        ],
    },

    // ==================== CONNECTION CHAOS ====================
    connectionChaos: {
        startTime: "55s",
        stages: [
            { duration: "10s", target: 100 },  // MASSIVE spike to fill connection pools
            { duration: "20s", target: 100 },  // Hold to test queue metrics
            { duration: "10s", target: 5 },    // Drop
        ],
        batchSize: 10, // Number of concurrent requests per VU
    },

    // ==================== THREAD CHAOS ====================
    threadChaos: {
        startTime: "70s",
        duration: "1m",
        vus: 10, // Constant number of users
        rapidRequestCount: 20, // Number of rapid small requests
        batchRequestCount: 15, // Number of requests in batch operations
    },

    // ==================== BEHAVIOR SETTINGS ====================
    behavior: {
        // Success rate for operations (0.0 to 1.0)
        // 0.8 = 80% success, 20% intentional failures
        successRate: 0.8,

        // Delete rate (0.0 to 1.0)
        // 0.1 = 10% chance to actually delete a book
        deleteRate: 0.1,

        // Minimum books to keep (prevents deleting all test data)
        minBooksToKeep: 10,

        // Random error injection rate (0.0 to 1.0)
        // 0.15 = 15% chance to inject a random error into any operation
        randomErrorRate: 0.15,

        // Number of errors to fire per error chaos iteration
        errorsPerIteration: { min: 3, max: 6 },
    },

    // ==================== THRESHOLDS ====================
    thresholds: {
        // Maximum allowed error rate (0.0 to 1.0)
        maxErrorRate: 0.5, // Allow 50% errors (we're testing chaos!)

        // P95 response time threshold in milliseconds
        p95ResponseTime: 30000, // 30 seconds
    },
};

/**
 * Helper function to calculate total test duration
 * Returns the maximum end time across all scenarios
 */
export function getTotalDuration() {
    const endTimes = [
        parseTime(chaosConfig.dataSetup.maxDuration),
        parseTime(chaosConfig.randomSpikes.startTime) +
            chaosConfig.randomSpikes.stages.reduce((sum, stage) => sum + parseTime(stage.duration), 0) +
            parseTime(chaosConfig.randomSpikes.gracefulRampDown),
        parseTime(chaosConfig.llmBombardment.startTime) + parseTime(chaosConfig.llmBombardment.duration),
        parseTime(chaosConfig.errorChaos.startTime) + parseTime(chaosConfig.errorChaos.duration),
        parseTime(chaosConfig.memoryPressure.startTime) + parseTime(chaosConfig.memoryPressure.duration),
        parseTime(chaosConfig.databaseChaos.startTime) +
            chaosConfig.databaseChaos.stages.reduce((sum, stage) => sum + parseTime(stage.duration), 0),
        parseTime(chaosConfig.connectionChaos.startTime) +
            chaosConfig.connectionChaos.stages.reduce((sum, stage) => sum + parseTime(stage.duration), 0),
        parseTime(chaosConfig.threadChaos.startTime) + parseTime(chaosConfig.threadChaos.duration),
    ];

    const maxSeconds = Math.max(...endTimes);
    return `${Math.ceil(maxSeconds / 60)}m ${maxSeconds % 60}s`;
}

/**
 * Parse time strings like "30s", "2m", "1m30s" to seconds
 */
function parseTime(timeStr) {
    let seconds = 0;
    const minutesMatch = timeStr.match(/(\d+)m/);
    const secondsMatch = timeStr.match(/(\d+)s/);

    if (minutesMatch) seconds += parseInt(minutesMatch[1]) * 60;
    if (secondsMatch) seconds += parseInt(secondsMatch[1]);

    return seconds;
}
