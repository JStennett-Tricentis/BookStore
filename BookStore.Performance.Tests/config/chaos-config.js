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
            { duration: "20s", target: 10 },   // Ramp up faster
            { duration: "15s", target: 60 },   // SPIKE!
            { duration: "15s", target: 5 },    // Drop
            { duration: "10s", target: 40 },   // SPIKE!
            { duration: "15s", target: 10 },   // Medium
            { duration: "10s", target: 100 },  // MASSIVE SPIKE!
            { duration: "20s", target: 5 },    // Cool down
        ],
        gracefulRampDown: "10s",
    },

    // ==================== LLM BOMBARDMENT ====================
    llmBombardment: {
        startTime: "35s",  // Start earlier for more overlap
        duration: "2m15s",
        vus: 5, // More constant users
    },

    // ==================== ERROR CHAOS ====================
    errorChaos: {
        startTime: "40s",  // Start earlier for more overlap
        duration: "2m10s",
        vus: 4, // More constant users
    },

    // ==================== MEMORY PRESSURE ====================
    memoryPressure: {
        startTime: "50s",
        duration: "1m40s",
        vus: 8, // More constant users
        booksPerIteration: 7, // Create more objects
        rapidGets: 15, // More rapid requests
    },

    // ==================== DATABASE CHAOS ====================
    databaseChaos: {
        startTime: "38s",  // Start earlier for more overlap
        stages: [
            { duration: "15s", target: 15 },  // Higher initial
            { duration: "30s", target: 35 },  // Higher peak
            { duration: "20s", target: 10 },
        ],
    },

    // ==================== CONNECTION CHAOS ====================
    connectionChaos: {
        startTime: "45s",  // Start earlier for more overlap
        stages: [
            { duration: "10s", target: 120 },  // Higher spike
            { duration: "25s", target: 120 },  // Hold longer
            { duration: "10s", target: 10 },
        ],
        batchSize: 15, // More concurrent requests per VU
    },

    // ==================== THREAD CHAOS ====================
    threadChaos: {
        startTime: "55s",  // Start earlier for more overlap
        duration: "1m20s",
        vus: 15, // More constant users
        rapidRequestCount: 30, // More rapid requests
        batchRequestCount: 20, // More batch requests
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
