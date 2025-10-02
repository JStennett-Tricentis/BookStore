// Error Scenario Testing
// Tests error handling, resilience, and observability under various failure conditions

import { check, group, sleep } from "k6";
import http from "k6/http";
import { Rate, Trend, Counter, Gauge } from "k6/metrics";
import { randomIntBetween, randomItem } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

import { getEnvironment } from "../config/environments.js";
import {
    getStages,
    getGracefulRampDown,
    getScenarioThresholds,
} from "../config/test-scenarios.js";

// Custom metrics for error tracking
const errorRate = new Rate("errors");
const error4xxRate = new Rate("errors_4xx");
const error5xxRate = new Rate("errors_5xx");
const llmErrorRate = new Rate("llm_errors");
const timeoutRate = new Rate("timeouts");
const errorResponseTime = new Trend("error_response_time", true);
const successResponseTime = new Trend("success_response_time", true);
const errorsByType = new Counter("errors_by_type");
const activeRequests = new Gauge("active_requests");

// Configuration
const environment = getEnvironment();
const scenario = __ENV.SCENARIO || "errorTest";

export const options = {
    scenarios: {
        error_testing: {
            executor: "ramping-vus",
            startVUs: 0,
            stages: getStages(scenario),
            gracefulRampDown: getGracefulRampDown(scenario),
        },
    },
    thresholds: getScenarioThresholds(scenario) || {
        // Default error test thresholds if not in config
        errors: ["rate<0.5"],
        errors_4xx: ["rate<0.3"],
        errors_5xx: ["rate<0.2"],
        http_req_duration: ["p(95)<10000"],
    },
    summaryTrendStats: ["avg", "min", "med", "max", "p(90)", "p(95)", "p(99)"],
};

export function setup() {
    console.log("=== Error Scenario Testing ===");
    console.log(`Environment: ${environment.name}`);
    console.log(`Service URL: ${environment.serviceUrl}`);
    console.log("This test intentionally generates errors to validate error handling");
    console.log("==========================================");

    // Health check
    const healthResponse = http.get(`${environment.serviceUrl}/health`);
    if (healthResponse.status !== 200) {
        console.warn("Service health check failed, continuing anyway for error testing");
    }

    return {
        startTime: new Date(),
        baseUrl: environment.serviceUrl,
    };
}

export default function (data) {
    activeRequests.add(1);

    const baseUrl = data.baseUrl;

    // Randomly select an error scenario to test
    const errorScenarios = [
        { name: "not_found", weight: 3, fn: () => testNotFoundErrors(baseUrl) },
        {
            name: "invalid_data",
            weight: 3,
            fn: () => testInvalidDataErrors(baseUrl),
        },
        { name: "llm_errors", weight: 2, fn: () => testLLMErrors(baseUrl) },
        { name: "timeout", weight: 1, fn: () => testTimeoutScenarios(baseUrl) },
        {
            name: "malformed_requests",
            weight: 2,
            fn: () => testMalformedRequests(baseUrl),
        },
        {
            name: "unauthorized",
            weight: 2,
            fn: () => testUnauthorizedErrors(baseUrl),
        },
        { name: "gone", weight: 1, fn: () => testGoneErrors(baseUrl) },
        { name: "conflict", weight: 2, fn: () => testConflictErrors(baseUrl) },
        {
            name: "service_unavailable",
            weight: 1,
            fn: () => testServiceUnavailableErrors(baseUrl),
        },
        { name: "success_path", weight: 4, fn: () => testSuccessPath(baseUrl) }, // Include some success
    ];

    const selectedScenario = selectWeightedScenario(errorScenarios);

    group(`Error Scenario: ${selectedScenario.name}`, function () {
        selectedScenario.fn();
    });

    sleep(randomIntBetween(1, 3));
    activeRequests.add(-1);
}

function testNotFoundErrors(baseUrl) {
    group("404 Not Found Errors", function () {
        const startTime = new Date().getTime();

        // Non-existent book ID
        const response = http.get(`${baseUrl}/api/v1/Books/000000000000000000000000`, {
            tags: { error_type: "not_found" },
        });

        const duration = new Date().getTime() - startTime;

        const is404 = check(response, {
            "status is 404": (r) => r.status === 404,
            "has error message": (r) => r.body && r.body.length > 0,
            "response time acceptable": (r) => duration < 1000,
        });

        recordError(response, duration, "not_found", is404);
    });
}

function testInvalidDataErrors(baseUrl) {
    group("400 Bad Request Errors", function () {
        const invalidBooks = [
            // Missing required fields
            { title: "Test Book" }, // Missing author
            { author: "Test Author" }, // Missing title
            // Invalid data types
            { title: "Test", author: "Test", price: "invalid" },
            { title: "Test", author: "Test", stockQuantity: -100 },
            // Empty strings
            { title: "", author: "", isbn: "" },
        ];

        const invalidBook = randomItem(invalidBooks);
        const startTime = new Date().getTime();

        const response = http.post(`${baseUrl}/api/v1/Books`, JSON.stringify(invalidBook), {
            headers: { "Content-Type": "application/json" },
            tags: { error_type: "invalid_data" },
        });

        const duration = new Date().getTime() - startTime;

        const is400 = check(response, {
            "status is 400": (r) => r.status === 400 || r.status === 422,
            "has validation error": (r) => r.body && r.body.length > 0,
            "response time acceptable": (r) => duration < 1000,
        });

        recordError(response, duration, "invalid_data", is400);
    });
}

function testLLMErrors(baseUrl) {
    group("LLM Error Scenarios", function () {
        const scenarios = [
            // Non-existent book for AI summary
            {
                name: "nonexistent_book_ai",
                request: () =>
                    http.post(
                        `${baseUrl}/api/v1/Books/000000000000000000000000/generate-summary`,
                        null,
                        {
                            timeout: "30s",
                            tags: { error_type: "llm_not_found" },
                        }
                    ),
            },
            // Malformed book ID
            {
                name: "invalid_book_id_ai",
                request: () =>
                    http.post(`${baseUrl}/api/v1/Books/invalid-id-format/generate-summary`, null, {
                        timeout: "30s",
                        tags: { error_type: "llm_invalid_id" },
                    }),
            },
        ];

        const scenario = randomItem(scenarios);
        const startTime = new Date().getTime();
        const response = scenario.request();
        const duration = new Date().getTime() - startTime;

        const hasError = check(response, {
            "status is error": (r) => r.status >= 400,
            "has error response": (r) => r.body && r.body.length > 0,
            "completes within timeout": (r) => duration < 30000,
        });

        if (hasError) {
            llmErrorRate.add(1);
            console.log(`LLM Error (${scenario.name}): ${response.status} - ${duration}ms`);
        }

        recordError(response, duration, "llm_error", hasError);
    });
}

function testTimeoutScenarios(baseUrl) {
    group("Timeout Scenarios", function () {
        // Request with very short timeout
        const startTime = new Date().getTime();

        const response = http.get(`${baseUrl}/api/v1/Books?page=1&pageSize=100`, {
            timeout: "10ms", // Intentionally too short
            tags: { error_type: "timeout" },
        });

        const duration = new Date().getTime() - startTime;

        const timedOut = check(response, {
            "request timed out": (r) => r.status === 0 || r.error_code !== 0,
        });

        if (timedOut) {
            timeoutRate.add(1);
            errorsByType.add(1, { type: "timeout" });
            console.log(`Timeout occurred: ${duration}ms`);
        }

        errorResponseTime.add(duration);
    });
}

function testMalformedRequests(baseUrl) {
    group("Malformed Requests", function () {
        const malformedRequests = [
            // Invalid JSON
            {
                body: "{invalid json",
                contentType: "application/json",
            },
            // Wrong content type
            {
                body: "This is plain text",
                contentType: "text/plain",
            },
            // Empty body where required
            {
                body: "",
                contentType: "application/json",
            },
            // Extremely large payload
            {
                body: JSON.stringify({
                    title: "x".repeat(100000),
                    author: "Test",
                }),
                contentType: "application/json",
            },
        ];

        const malformed = randomItem(malformedRequests);
        const startTime = new Date().getTime();

        const response = http.post(`${baseUrl}/api/v1/Books`, malformed.body, {
            headers: { "Content-Type": malformed.contentType },
            tags: { error_type: "malformed" },
        });

        const duration = new Date().getTime() - startTime;

        const hasError = check(response, {
            "status is 4xx or 5xx": (r) => r.status >= 400,
            "response is fast": (r) => duration < 2000,
        });

        recordError(response, duration, "malformed", hasError);
    });
}

function testSuccessPath(baseUrl) {
    group("Success Path (Control)", function () {
        // Normal successful request for comparison
        const startTime = new Date().getTime();

        const response = http.get(`${baseUrl}/api/v1/Books?page=1&pageSize=5`, {
            tags: { error_type: "none" },
        });

        const duration = new Date().getTime() - startTime;

        const success = check(response, {
            "status is 200": (r) => r.status === 200,
            "has response body": (r) => r.body && r.body.length > 0,
            "response time good": (r) => duration < 1000,
        });

        if (success) {
            successResponseTime.add(duration);
        } else {
            recordError(response, duration, "unexpected", false);
        }
    });
}

function recordError(response, duration, errorType, expectedError) {
    const status = response.status;

    // Record metrics
    errorResponseTime.add(duration);

    if (status >= 400) {
        errorRate.add(1);

        if (status >= 400 && status < 500) {
            error4xxRate.add(1);
            errorsByType.add(1, { type: `4xx_${errorType}` });
        } else if (status >= 500) {
            error5xxRate.add(1);
            errorsByType.add(1, { type: `5xx_${errorType}` });
        }

        // Log unexpected errors
        if (!expectedError) {
            console.error(`Unexpected error: ${status} (${errorType}) - ${duration}ms`);
            console.error(`Response: ${response.body?.substring(0, 200)}`);
        }
    }

    // Tag the response
    response.tags = {
        ...response.tags,
        error_type: errorType,
        status_class: `${Math.floor(status / 100)}xx`,
    };
}

function testUnauthorizedErrors(baseUrl) {
    group("401 Unauthorized Errors", function () {
        // Simulate protected endpoints that require authentication
        // Since our API doesn't have auth, we'll test endpoints with invalid auth headers
        const startTime = new Date().getTime();

        const response = http.get(`${baseUrl}/api/v1/Books`, {
            headers: {
                Authorization: "Bearer invalid_token_12345",
                "X-API-Key": "invalid_api_key",
            },
            tags: { error_type: "unauthorized" },
        });

        const duration = new Date().getTime() - startTime;

        // Note: Our API doesn't enforce auth, so this will return 200
        // But we're testing the pattern for when auth is added
        const hasAuth = check(response, {
            "response received": (r) => r.status >= 200,
            "response time acceptable": (r) => duration < 1000,
        });

        // If this were a real auth endpoint, we'd expect 401
        // For now, just track the pattern
        if (response.status === 401) {
            errorResponseTime.add(duration);
            error4xxRate.add(1);
            errorsByType.add(1, { type: "4xx_unauthorized" });
        }
    });
}

function testGoneErrors(baseUrl) {
    group("410 Gone Errors", function () {
        // Simulate resources that have been permanently deleted
        // We'll try to access a book that was deleted
        const startTime = new Date().getTime();

        // Use a well-formed MongoDB ObjectId that doesn't exist
        // Format: 24 hex characters (represents permanently deleted resource)
        const deletedBookId = "507f1f77bcf86cd799439011"; // Valid format, non-existent

        const response = http.get(`${baseUrl}/api/v1/Books/${deletedBookId}`, {
            headers: { "X-Resource-Status": "deleted" }, // Simulated header
            tags: { error_type: "gone" },
        });

        const duration = new Date().getTime() - startTime;

        // Our API returns 404, but testing the pattern for 410
        const isGone = check(response, {
            "resource not found": (r) => r.status === 404 || r.status === 410,
            "response time acceptable": (r) => duration < 1000,
        });

        if (response.status === 410) {
            errorResponseTime.add(duration);
            error4xxRate.add(1);
            errorsByType.add(1, { type: "4xx_gone" });
        } else if (response.status === 404) {
            // Count as expected not found
            recordError(response, duration, "gone_as_404", isGone);
        }
    });
}

function testConflictErrors(baseUrl) {
    group("409 Conflict Errors", function () {
        // Try to create duplicate resources or conflicting updates
        const startTime = new Date().getTime();

        // Attempt to create a book with duplicate ISBN
        const duplicateBook = {
            title: "Duplicate Test Book",
            author: "Test Author",
            isbn: "978-0-123456-78-9", // Same ISBN to cause conflict
            genre: "Test",
            publishedDate: "2024-01-01",
            price: 29.99,
            stockQuantity: 100,
        };

        const response = http.post(`${baseUrl}/api/v1/Books`, JSON.stringify(duplicateBook), {
            headers: {
                "Content-Type": "application/json",
                "X-Idempotency-Key": "duplicate-isbn-test-12345",
            },
            tags: { error_type: "conflict" },
        });

        const duration = new Date().getTime() - startTime;

        // Our API might not enforce ISBN uniqueness, so check for various responses
        const hasConflict = check(response, {
            "response received": (r) => r.status >= 200,
            "response time acceptable": (r) => duration < 2000,
        });

        if (response.status === 409) {
            errorResponseTime.add(duration);
            error4xxRate.add(1);
            errorsByType.add(1, { type: "4xx_conflict" });
        } else if (response.status === 400 || response.status === 422) {
            // Validation error is acceptable alternative
            recordError(response, duration, "conflict_as_validation", hasConflict);
        }
    });
}

function testServiceUnavailableErrors(baseUrl) {
    group("503 Service Unavailable Errors", function () {
        // Test scenarios that might cause service unavailability
        // Such as database connection issues, dependency failures, etc.

        const scenarios = [
            {
                name: "database_overload",
                request: () => {
                    // Large page size might overload database
                    return http.get(`${baseUrl}/api/v1/Books?page=1&pageSize=10000`, {
                        timeout: "5s",
                        tags: {
                            error_type: "service_unavailable",
                            subtype: "db_overload",
                        },
                    });
                },
            },
            {
                name: "llm_unavailable",
                request: () => {
                    // LLM service might be unavailable
                    return http.post(
                        `${baseUrl}/api/v1/Books/507f1f77bcf86cd799439011/generate-summary?provider=invalid`,
                        null,
                        {
                            timeout: "5s",
                            tags: {
                                error_type: "service_unavailable",
                                subtype: "llm_unavailable",
                            },
                        }
                    );
                },
            },
        ];

        const scenario = randomItem(scenarios);
        const startTime = new Date().getTime();
        const response = scenario.request();
        const duration = new Date().getTime() - startTime;

        const hasServiceError = check(response, {
            "response received": (r) => r.status >= 200 || r.status === 0,
            "completes within timeout": (r) => duration < 5000,
        });

        if (response.status === 503) {
            errorResponseTime.add(duration);
            error5xxRate.add(1);
            errorsByType.add(1, { type: "5xx_service_unavailable" });
            console.log(
                `Service Unavailable (${scenario.name}): ${response.status} - ${duration}ms`
            );
        } else if (response.status >= 500) {
            recordError(response, duration, "service_unavailable_as_5xx", hasServiceError);
        } else if (response.status >= 400) {
            recordError(response, duration, "service_unavailable_as_4xx", hasServiceError);
        }
    });
}

function selectWeightedScenario(scenarios) {
    const totalWeight = scenarios.reduce((sum, s) => sum + s.weight, 0);
    let random = Math.random() * totalWeight;

    for (const scenario of scenarios) {
        random -= scenario.weight;
        if (random <= 0) {
            return scenario;
        }
    }

    return scenarios[0];
}

export function teardown(data) {
    const duration = (new Date() - data.startTime) / 1000;
    console.log("\n=== Error Scenario Testing Complete ===");
    console.log(`Duration: ${Math.round(duration)}s`);
    console.log("Review metrics for error handling performance");
    console.log("Check logs and traces for error details");
    console.log("==========================================");
}
