// K6 load test for AI-powered book summary generation
// This test focuses on LLM endpoint performance and behavior

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend, Counter, Gauge } from "k6/metrics";
import { randomIntBetween, randomItem } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

import { getEnvironment } from "../config/environments.js";
import { getThresholds } from "../config/thresholds.js";
import { checkResponse } from "../utils/assertions.js";

// Custom metrics specific to LLM operations
const llmErrorRate = new Rate("llm_errors");
const llmResponseTime = new Trend("llm_response_time", true);
const llmOperationsExecuted = new Counter("llm_operations");
const llmConcurrentRequests = new Gauge("llm_concurrent_requests");
const llmTokensUsed = new Counter("llm_tokens_used");
const llmLatencyP95 = new Trend("llm_latency_p95");

// Configuration
const environment = getEnvironment();
const scenario = __ENV.SCENARIO || "llm_smoke";

export const options = {
    scenarios: {
        llm_smoke: {
            executor: "ramping-vus",
            startVUs: 0,
            stages: [
                { duration: "30s", target: 1 },
                { duration: "2m", target: 2 },
                { duration: "30s", target: 0 },
            ],
            gracefulRampDown: "30s",
        },
        llm_load: {
            executor: "ramping-vus",
            startVUs: 0,
            stages: [
                { duration: "1m", target: 3 },
                { duration: "5m", target: 5 },
                { duration: "5m", target: 5 },
                { duration: "1m", target: 0 },
            ],
            gracefulRampDown: "30s",
        },
        llm_stress: {
            executor: "ramping-vus",
            startVUs: 0,
            stages: [
                { duration: "2m", target: 5 },
                { duration: "5m", target: 10 },
                { duration: "5m", target: 15 },
                { duration: "3m", target: 15 },
                { duration: "2m", target: 0 },
            ],
            gracefulRampDown: "30s",
        },
        llm_spike: {
            executor: "ramping-vus",
            startVUs: 0,
            stages: [
                { duration: "30s", target: 2 },
                { duration: "1m", target: 2 },
                { duration: "10s", target: 20 },
                { duration: "2m", target: 20 },
                { duration: "10s", target: 2 },
                { duration: "1m", target: 2 },
                { duration: "30s", target: 0 },
            ],
            gracefulRampDown: "30s",
        },
    },
    thresholds: {
        // LLM-specific thresholds (more lenient due to API latency)
        llm_response_time: ["p(95)<8000", "p(99)<12000"],
        llm_errors: ["rate<0.05"], // Max 5% error rate
        llm_operations: ["count>10"], // At least 10 operations
        http_req_duration: ["p(95)<8000", "p(99)<12000"],
        http_req_failed: ["rate<0.05"],
    },
    summaryTrendStats: ["avg", "min", "med", "max", "p(90)", "p(95)", "p(99)"],
};

export function setup() {
    console.log(`Starting AI Summary Performance Test - Scenario: ${scenario}`);
    console.log(`Environment: ${environment.name}`);
    console.log(`Service URL: ${environment.serviceUrl}`);

    // Verify service is accessible
    const healthCheck = http.get(`${environment.serviceUrl}/health`, {
        timeout: environment.timeout,
    });
    if (healthCheck.status !== 200) {
        throw new Error(`BookStore API health check failed: ${healthCheck.status}`);
    }

    // Seed data if needed
    console.log("Ensuring test data exists...");
    const seedResponse = http.post(`${environment.serviceUrl}/seed-data`, null, {
        timeout: "30s",
    });
    if (seedResponse.status !== 200) {
        console.warn("Failed to seed data, continuing with existing data");
    }

    // Get a list of book IDs to test against
    const booksResponse = http.get(`${environment.serviceUrl}/api/v1/Books?page=1&pageSize=20`);
    let bookIds = [];
    if (booksResponse.status === 200) {
        const books = JSON.parse(booksResponse.body);
        bookIds = books.map((book) => book.id);
        console.log(`Found ${bookIds.length} books for testing`);
    }

    console.log("✓ AI Summary test setup completed");
    return {
        startTime: new Date(),
        bookIds: bookIds,
        baseUrl: environment.serviceUrl,
    };
}

export default function (data) {
    llmConcurrentRequests.add(1);

    const baseUrl = data.baseUrl;
    const bookIds = data.bookIds;

    if (bookIds.length === 0) {
        console.error("No books available for testing");
        llmConcurrentRequests.add(-1);
        return;
    }

    // Select a random book
    const bookId = randomItem(bookIds);

    group("AI Summary Generation", function () {
        generateAiSummary(baseUrl, bookId);
    });

    // Think time - simulating user reviewing the summary
    const thinkTime = randomIntBetween(3000, 8000) / 1000; // 3-8 seconds
    sleep(thinkTime);

    llmConcurrentRequests.add(-1);
}

function generateAiSummary(baseUrl, bookId) {
    const params = {
        timeout: "30s", // LLM operations can take longer
        tags: {
            name: "generate_ai_summary",
            operation_type: "llm",
            endpoint: "generate-summary",
        },
    };

    const startTime = new Date().getTime();

    const response = http.post(`${baseUrl}/api/v1/Books/${bookId}/generate-summary`, null, params);

    const endTime = new Date().getTime();
    const responseTimeMs = endTime - startTime;

    // Record metrics
    llmResponseTime.add(responseTimeMs);
    llmLatencyP95.add(responseTimeMs);

    // Check response
    const success = check(response, {
        "status is 200": (r) => r.status === 200,
        "response has body": (r) => r.body && r.body.length > 0,
        "response is JSON": (r) => {
            try {
                JSON.parse(r.body);
                return true;
            } catch (e) {
                return false;
            }
        },
        "has aiGeneratedSummary field": (r) => {
            try {
                const json = JSON.parse(r.body);
                return json.hasOwnProperty("aiGeneratedSummary");
            } catch (e) {
                return false;
            }
        },
        "summary is not empty": (r) => {
            try {
                const json = JSON.parse(r.body);
                return json.aiGeneratedSummary && json.aiGeneratedSummary.length > 0;
            } catch (e) {
                return false;
            }
        },
        "response time < 10s": (r) => responseTimeMs < 10000,
        "response time < 15s": (r) => responseTimeMs < 15000,
    });

    if (success) {
        llmOperationsExecuted.add(1);

        // Log sample summaries occasionally
        if (Math.random() < 0.1) {
            try {
                const json = JSON.parse(response.body);
                console.log(
                    `Sample summary (${json.title}): ${json.aiGeneratedSummary.substring(0, 100)}...`
                );
            } catch (e) {
                // Ignore parsing errors
            }
        }
    }

    llmErrorRate.add(!success);

    // Log slow requests
    if (responseTimeMs > 10000) {
        console.warn(`Slow LLM request: ${responseTimeMs}ms for book ${bookId}`);
    }

    // Log errors
    if (!success) {
        console.error(
            `LLM request failed: ${response.status} - ${response.body?.substring(0, 200)}`
        );
    }

    return success;
}

export function teardown(data) {
    const duration = new Date() - data.startTime;
    console.log(`AI Summary test completed in ${Math.round(duration / 1000)}s`);
    console.log(`Tested ${data.bookIds.length} unique books`);
}
