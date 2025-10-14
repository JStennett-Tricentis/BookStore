// Error Scenario Testing with Pre-Generated Data
// Tests error handling with realistic, variable test data

import { check, group, sleep } from "k6";
import http from "k6/http";
import { Rate, Trend, Counter, Gauge } from "k6/metrics";
import { randomIntBetween, randomItem } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";
import { SharedArray } from "k6/data";

import { getEnvironment } from "../config/environments.js";
import { getStages, getGracefulRampDown, getScenarioThresholds } from "../config/test-scenarios.js";

// ============================================================================
// GENERATED DATA - Load from C# Request Generator output
// ============================================================================

const generatedBooks = new SharedArray("books", function () {
    try {
        const data = JSON.parse(open("../../Tools/BookStore.Performance.RequestGenerator/test-data/books-bulk.json"));
        console.log(`✓ Loaded ${data.length} pre-generated books for error testing`);
        return data;
    } catch (e) {
        console.warn("⚠️  Could not load generated books");
        return [
            {
                title: "Error Test Book",
                author: "Test Author",
                isbn: "978-1-1234-567-8",
                price: 29.99,
                genre: "Fiction",
                description: "Test book for error scenarios",
                stockQuantity: 100,
                publishedDate: "2024-01-01T00:00:00",
            },
        ];
    }
});

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
        errors: ["rate<0.5"],
        errors_4xx: ["rate<0.3"],
        errors_5xx: ["rate<0.2"],
        http_req_duration: ["p(95)<10000"],
    },
    summaryTrendStats: ["avg", "min", "med", "max", "p(90)", "p(95)", "p(99)"],
};

export function setup() {
    console.log("╔══════════════════════════════════════════════════════════════════╗");
    console.log("║  Error Scenario Testing with Pre-Generated Data                 ║");
    console.log("╚══════════════════════════════════════════════════════════════════╝");
    console.log("");
    console.log(`Environment: ${environment.name}`);
    console.log(`Service URL: ${environment.serviceUrl}`);
    console.log(`Books available: ${generatedBooks.length}`);
    console.log("This test intentionally generates errors to validate error handling");
    console.log("");

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

    // Use generated data for more realistic error scenarios
    const bookIndex = Math.floor(Math.random() * generatedBooks.length);
    const testBook = generatedBooks[bookIndex];

    // Randomly select an error scenario to test
    const errorScenarios = [
        { name: "error_test_endpoints", weight: 10, fn: () => testErrorTestEndpoints(baseUrl) },
        { name: "not_found", weight: 3, fn: () => testNotFoundErrors(baseUrl) },
        { name: "invalid_data", weight: 3, fn: () => testInvalidDataErrors(baseUrl, testBook) },
        { name: "llm_errors", weight: 2, fn: () => testLLMErrors(baseUrl, testBook) },
        { name: "timeout", weight: 1, fn: () => testTimeoutScenarios(baseUrl) },
        { name: "malformed_requests", weight: 2, fn: () => testMalformedRequests(baseUrl) },
        { name: "success_path", weight: 4, fn: () => testSuccessPath(baseUrl, testBook) },
    ];

    const selectedScenario = selectWeightedScenario(errorScenarios);

    group(`Error Scenario: ${selectedScenario.name}`, function () {
        selectedScenario.fn();
    });

    sleep(randomIntBetween(0.5, 2));
    activeRequests.add(-1);
}

function testNotFoundErrors(baseUrl) {
    group("404 Not Found Errors", function () {
        const startTime = new Date().getTime();

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

function testInvalidDataErrors(baseUrl, testBook) {
    group("400 Bad Request Errors", function () {
        const invalidBooks = [
            // Use generated book but corrupt it
            { title: testBook.title }, // Missing required fields
            { author: testBook.author }, // Missing title
            { ...testBook, price: "invalid" }, // Invalid price type
            { ...testBook, stockQuantity: -100 }, // Negative stock
            { ...testBook, title: "", author: "" }, // Empty strings
            { ...testBook, isbn: "invalid-isbn-format-that-is-way-too-long" },
        ];

        const invalidBook = randomItem(invalidBooks);
        const startTime = new Date().getTime();

        const response = http.post(`${baseUrl}/api/v1/Books`, JSON.stringify(invalidBook), {
            headers: { "Content-Type": "application/json" },
            tags: { error_type: "invalid_data" },
        });

        const duration = new Date().getTime() - startTime;

        const is400 = check(response, {
            "status is 400 or 422": (r) => r.status === 400 || r.status === 422,
            "has validation error": (r) => r.body && r.body.length > 0,
            "response time acceptable": (r) => duration < 1000,
        });

        recordError(response, duration, "invalid_data", is400);
    });
}

function testLLMErrors(baseUrl, testBook) {
    group("LLM Error Scenarios", function () {
        const scenarios = [
            // Non-existent book for AI summary
            {
                name: "nonexistent_book_ai",
                request: () =>
                    http.post(`${baseUrl}/api/v1/Books/000000000000000000000000/generate-summary`, null, {
                        timeout: "30s",
                        tags: { error_type: "llm_not_found" },
                    }),
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
            // Invalid provider
            {
                name: "invalid_provider",
                request: () =>
                    http.post(`${baseUrl}/api/v1/Books/000000000000000000000000/generate-summary?provider=invalid`, null, {
                        timeout: "30s",
                        tags: { error_type: "llm_invalid_provider" },
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
        }

        recordError(response, duration, "llm_error", hasError);
    });
}

function testTimeoutScenarios(baseUrl) {
    group("Timeout Scenarios", function () {
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

function testSuccessPath(baseUrl, testBook) {
    group("Success Path (Control)", function () {
        // Normal successful request for comparison using generated data
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

function testErrorTestEndpoints(baseUrl) {
    group("ErrorTest Controller Endpoints", function () {
        // Call the dedicated ErrorTest endpoints that return specific status codes
        const errorCodes = [400, 401, 403, 404, 409, 410, 422, 429, 500, 502, 503, 504];
        const errorCode = randomItem(errorCodes);

        const startTime = new Date().getTime();

        const response = http.get(`${baseUrl}/api/v1/ErrorTest/${errorCode}`, {
            tags: {
                error_type: `error_test_${errorCode}`,
                status_code: errorCode.toString(),
            },
        });

        const duration = new Date().getTime() - startTime;

        const isExpectedError = check(response, {
            [`status is ${errorCode}`]: (r) => r.status === errorCode,
            "has error message": (r) => r.body && r.body.length > 0,
            "response time acceptable": (r) => duration < 1000,
        });

        recordError(response, duration, `error_test_${errorCode}`, isExpectedError);
    });
}

function recordError(response, duration, errorType, expectedError) {
    const status = response.status;

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

        if (!expectedError) {
            console.error(`Unexpected error: ${status} (${errorType}) - ${duration}ms`);
        }
    }
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
    console.log("");
    console.log("╔══════════════════════════════════════════════════════════════════╗");
    console.log("║  Error Scenario Testing Complete                                ║");
    console.log("╚══════════════════════════════════════════════════════════════════╝");
    console.log(`Duration: ${Math.round(duration)}s`);
    console.log(`Books pool: ${generatedBooks.length} unique items`);
    console.log("Review metrics for error handling performance");
    console.log("");
}
