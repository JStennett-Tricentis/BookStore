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
        numberOfBooks: 100, // 2x more initial data for better testing

        // How long to wait for data setup (max duration)
        maxDuration: "45s",
    },

    // ==================== RANDOM SPIKES ====================
    randomSpikes: {
        startTime: "45s",
        stages: [
            { duration: "15s", target: 20 },   // Start higher
            { duration: "10s", target: 100 },  // SPIKE!
            { duration: "10s", target: 10 },   // Drop fast
            { duration: "8s", target: 80 },    // SPIKE!
            { duration: "12s", target: 15 },   // Medium
            { duration: "8s", target: 150 },   // MASSIVE SPIKE!
            { duration: "10s", target: 120 },  // Stay high
            { duration: "5s", target: 200 },   // EXTREME SPIKE!
            { duration: "15s", target: 5 },    // Cool down
        ],
        gracefulRampDown: "10s",
    },

    // ==================== LLM BOMBARDMENT ====================
    llmBombardment: {
        startTime: "50s",  // Start with overlap
        duration: "3m",    // Longer duration to sustain LLM pressure
        vus: 10, // 2x more users hitting LLM endpoints
    },

    // ==================== ERROR CHAOS ====================
    errorChaos: {
        startTime: "48s",  // Early start for maximum chaos
        duration: "3m",    // Longer error generation
        vus: 8, // 2x more error generators
    },

    // ==================== MEMORY PRESSURE ====================
    memoryPressure: {
        startTime: "55s",
        duration: "2m30s", // Longer memory pressure
        vus: 15, // Almost 2x more users creating objects
        booksPerIteration: 12, // Create way more objects per iteration
        rapidGets: 25, // Much more rapid cache requests
    },

    // ==================== DATABASE CHAOS ====================
    databaseChaos: {
        startTime: "52s",  // Earlier overlap with other scenarios
        stages: [
            { duration: "10s", target: 25 },  // Higher initial load
            { duration: "30s", target: 60 },  // Much higher peak
            { duration: "20s", target: 45 },  // Stay elevated
            { duration: "15s", target: 10 },  // Ramp down
        ],
    },

    // ==================== CONNECTION CHAOS ====================
    connectionChaos: {
        startTime: "50s",  // Earlier overlap
        stages: [
            { duration: "8s", target: 200 },   // Massive spike to saturate connections
            { duration: "20s", target: 180 },  // Hold very high
            { duration: "10s", target: 250 },  // EXTREME spike to max out
            { duration: "15s", target: 10 },   // Drop quickly
        ],
        batchSize: 25, // Much more concurrent requests per VU
    },

    // ==================== THREAD CHAOS ====================
    threadChaos: {
        startTime: "58s",  // Earlier overlap for thread saturation
        duration: "2m15s", // Longer thread pool pressure
        vus: 25, // Much more users
        rapidRequestCount: 50, // Way more rapid requests for thread churn
        batchRequestCount: 35, // Way more batch requests for queue pressure
    },

    // ==================== BEHAVIOR SETTINGS ====================
    behavior: {
        // Success rate for operations (0.0 to 1.0)
        // 0.7 = 70% success, 30% intentional failures for MORE CHAOS
        successRate: 0.7,

        // Delete rate (0.0 to 1.0)
        // 0.15 = 15% chance to actually delete a book (more DB churn)
        deleteRate: 0.15,

        // Minimum books to keep (prevents deleting all test data)
        minBooksToKeep: 20,

        // Random error injection rate (0.0 to 1.0)
        // 0.25 = 25% chance to inject a random error into any operation
        randomErrorRate: 0.25, // Way more random errors for extreme chaos!

        // Number of errors to fire per error chaos iteration
        errorsPerIteration: { min: 5, max: 10 }, // 2x more errors per iteration
    },

    // ==================== THRESHOLDS ====================
    thresholds: {
        // Maximum allowed error rate (0.0 to 1.0)
        maxErrorRate: 0.6, // Allow 60% errors (EXTREME chaos mode!)

        // P95 response time threshold in milliseconds
        p95ResponseTime: 45000, // 45 seconds (allow slowness under extreme load)
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
