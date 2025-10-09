/**
 * EXTREME Chaos Test Configuration
 *
 * ⚠️  WARNING: This configuration is DESIGNED TO BREAK YOUR SYSTEM! ⚠️
 *
 * Use this to find absolute limits, breaking points, and failure modes.
 * NOT for regular testing - this WILL cause service degradation/crashes.
 *
 * This config pushes:
 * - 5-10x more load than standard chaos
 * - 500+ concurrent users at peak
 * - 80% intentional error rate
 * - Massive memory pressure
 * - Extreme thread pool saturation
 * - Database flooding
 * - Connection pool exhaustion
 *
 * Recommended: Run in isolated environment, monitor closely, have recovery plan.
 */

export const extremeChaosConfig = {
    // ==================== DATA SETUP ====================
    dataSetup: {
        // Massive initial dataset to stress system from the start
        numberOfBooks: 250, // 5x more than chaos, 2.5x more than standard

        // Longer setup time due to volume
        maxDuration: "90s",
    },

    // ==================== RANDOM SPIKES ====================
    randomSpikes: {
        startTime: "90s",
        stages: [
            { duration: "10s", target: 50 },   // Start aggressive
            { duration: "8s", target: 200 },   // MASSIVE SPIKE!
            { duration: "8s", target: 20 },    // Drop fast
            { duration: "6s", target: 250 },   // EXTREME SPIKE!
            { duration: "10s", target: 50 },   // Drop but stay elevated
            { duration: "6s", target: 350 },   // INSANE SPIKE!
            { duration: "8s", target: 150 },   // Sustained high load
            { duration: "5s", target: 500 },   // 🔥 MAXIMUM SPIKE! 🔥
            { duration: "10s", target: 300 },  // Stay dangerously high
            { duration: "5s", target: 400 },   // Another massive spike
            { duration: "15s", target: 10 },   // Cool down (if still alive)
        ],
        gracefulRampDown: "15s",
    },

    // ==================== LLM BOMBARDMENT ====================
    llmBombardment: {
        startTime: "95s",  // Start immediately after setup
        duration: "5m",    // Much longer bombardment
        vus: 25, // 5x more LLM users - will stress AI endpoints hard
    },

    // ==================== ERROR CHAOS ====================
    errorChaos: {
        startTime: "92s",  // Start very early
        duration: "5m",    // Long error generation period
        vus: 20, // 5x more error generators - flood with failures
    },

    // ==================== MEMORY PRESSURE ====================
    memoryPressure: {
        startTime: "100s",
        duration: "4m",    // Sustained memory pressure
        vus: 35, // Massive memory allocation
        booksPerIteration: 25, // Create tons of objects per iteration
        rapidGets: 50, // Extreme cache pressure
    },

    // ==================== DATABASE CHAOS ====================
    databaseChaos: {
        startTime: "98s",  // Early overlap
        stages: [
            { duration: "15s", target: 50 },   // High initial
            { duration: "45s", target: 150 },  // EXTREME database load
            { duration: "30s", target: 120 },  // Stay very high
            { duration: "20s", target: 200 },  // PEAK database stress
            { duration: "20s", target: 10 },   // Ramp down
        ],
    },

    // ==================== CONNECTION CHAOS ====================
    connectionChaos: {
        startTime: "95s",  // Immediate overlap
        stages: [
            { duration: "6s", target: 400 },   // EXTREME spike
            { duration: "30s", target: 350 },  // Hold extremely high
            { duration: "8s", target: 600 },   // 🔥 MAX OUT CONNECTIONS! 🔥
            { duration: "20s", target: 450 },  // Stay saturated
            { duration: "10s", target: 700 },  // 🔥 ABSOLUTE MAXIMUM! 🔥
            { duration: "20s", target: 10 },   // Drop (pray for recovery)
        ],
        batchSize: 50, // MASSIVE concurrent requests per VU
    },

    // ==================== THREAD CHAOS ====================
    threadChaos: {
        startTime: "105s", // Overlap with everything
        duration: "4m",    // Long thread saturation
        vus: 60, // EXTREME thread pool pressure
        rapidRequestCount: 100, // Tons of rapid requests
        batchRequestCount: 75,  // Massive batch operations
    },

    // ==================== BEHAVIOR SETTINGS ====================
    behavior: {
        // EXTREME failure rates - testing error handling under duress
        successRate: 0.5, // Only 50% success - BRUTAL!

        // High delete rate for database churn
        deleteRate: 0.25, // 25% deletion rate

        // Keep enough books to continue testing
        minBooksToKeep: 50,

        // EXTREME random error injection
        randomErrorRate: 0.4, // 40% chance of random errors - CHAOS!

        // Fire TONS of errors per iteration
        errorsPerIteration: { min: 10, max: 20 }, // 10-20 errors per iteration!
    },

    // ==================== THRESHOLDS ====================
    thresholds: {
        // Very loose thresholds - we EXPECT massive failures
        maxErrorRate: 0.8, // Allow 80% errors - we're stress testing!

        // Very long timeout - system WILL slow to a crawl
        p95ResponseTime: 120000, // 2 minutes (120 seconds)
    },
};

/**
 * Helper function to calculate total test duration
 * Returns the maximum end time across all scenarios
 */
export function getTotalDuration() {
    const endTimes = [
        parseTime(extremeChaosConfig.dataSetup.maxDuration),
        parseTime(extremeChaosConfig.randomSpikes.startTime) +
            extremeChaosConfig.randomSpikes.stages.reduce((sum, stage) => sum + parseTime(stage.duration), 0) +
            parseTime(extremeChaosConfig.randomSpikes.gracefulRampDown),
        parseTime(extremeChaosConfig.llmBombardment.startTime) + parseTime(extremeChaosConfig.llmBombardment.duration),
        parseTime(extremeChaosConfig.errorChaos.startTime) + parseTime(extremeChaosConfig.errorChaos.duration),
        parseTime(extremeChaosConfig.memoryPressure.startTime) + parseTime(extremeChaosConfig.memoryPressure.duration),
        parseTime(extremeChaosConfig.databaseChaos.startTime) +
            extremeChaosConfig.databaseChaos.stages.reduce((sum, stage) => sum + parseTime(stage.duration), 0),
        parseTime(extremeChaosConfig.connectionChaos.startTime) +
            extremeChaosConfig.connectionChaos.stages.reduce((sum, stage) => sum + parseTime(stage.duration), 0),
        parseTime(extremeChaosConfig.threadChaos.startTime) + parseTime(extremeChaosConfig.threadChaos.duration),
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

/**
 * Get configuration summary for logging
 */
export function getConfigSummary() {
    return {
        totalDuration: getTotalDuration(),
        peakVUs: 700, // Maximum from connection chaos
        scenarios: 8,
        expectedErrorRate: "50-80%",
        warningLevel: "🔥 EXTREME 🔥",
        recommendation: "Isolated environment only - WILL break production!",
    };
}
