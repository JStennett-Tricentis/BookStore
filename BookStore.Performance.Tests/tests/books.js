// K6 load test for BookStore API

import http from "k6/http";
import { sleep } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

import { getEnvironment } from "../config/environments.js";
import { getThresholds } from "../config/thresholds.js";
import {
    generateBookData,
    generateAuthorData,
    generateUserProfile,
} from "../utils/data-generators.js";
import { checkResponse, checkPerformance } from "../utils/assertions.js";

// Custom metrics
const errorRate = new Rate("book_errors");
const responseTime = new Trend("book_response_time", true);
const operationsExecuted = new Counter("book_operations");

// Configuration
const environment = getEnvironment();
const scenario = __ENV.SCENARIO || "load";

export const options = {
    scenarios: {
        book_operations: {
            executor: "ramping-vus",
            startVUs: 0,
            stages: getLoadStages(scenario),
            gracefulRampDown: "30s",
        },
    },
    thresholds: getThresholds(scenario),
    summaryTrendStats: ["avg", "min", "med", "max", "p(90)", "p(95)", "p(99)"],
};

function getLoadStages(scenario) {
    const stages = {
        smoke: [
            { duration: "30s", target: 1 },
            { duration: "1m", target: 1 },
            { duration: "30s", target: 0 },
        ],
        load: [
            { duration: "1m", target: 5 },
            { duration: "3m", target: 10 },
            { duration: "5m", target: 10 },
            { duration: "1m", target: 0 },
        ],
        stress: [
            { duration: "2m", target: 10 },
            { duration: "5m", target: 20 },
            { duration: "5m", target: 30 },
            { duration: "5m", target: 30 },
            { duration: "2m", target: 0 },
        ],
        spike: [
            { duration: "10s", target: 5 },
            { duration: "1m", target: 5 },
            { duration: "10s", target: 50 },
            { duration: "3m", target: 50 },
            { duration: "10s", target: 5 },
            { duration: "3m", target: 5 },
            { duration: "10s", target: 0 },
        ],
    };

    return stages[scenario] || stages.load;
}

export function setup() {
    console.log(`Starting BookStore API load test - Scenario: ${scenario}`);
    console.log(`Environment: ${environment.name}`);
    console.log(`Service URL: ${environment.serviceUrl}`);

    // Verify service is accessible
    const healthCheck = http.get(`${environment.serviceUrl}/health`, {
        timeout: environment.timeout,
    });
    if (healthCheck.status !== 200) {
        throw new Error(`BookStore API health check failed: ${healthCheck.status}`);
    }

    console.log("✓ BookStore API health check passed");
    return { startTime: new Date() };
}

export default function (data) {
    const userProfile = generateUserProfile(__VU);

    // Determine operation type based on user profile
    const operation = getOperationForUser(userProfile);

    executeOperation(operation, userProfile);

    // Think time between operations
    const thinkTime = getThinkTime(userProfile.usagePattern);
    sleep(thinkTime);
}

function executeOperation(operation, userProfile) {
    switch (operation.type) {
        case "list_books":
            listBooks(operation, userProfile);
            break;
        case "get_book":
            getBook(operation, userProfile);
            break;
        case "create_book":
            createBook(operation, userProfile);
            break;
        case "update_book":
            updateBook(operation, userProfile);
            break;
        case "patch_book":
            patchBook(operation, userProfile);
            break;
        case "delete_book":
            deleteBook(operation, userProfile);
            break;
        case "search_books":
            searchBooks(operation, userProfile);
            break;
        case "list_authors":
            listAuthors(operation, userProfile);
            break;
        default:
            console.warn(`Unknown operation type: ${operation.type}`);
    }
}

function listBooks(operation, userProfile) {
    const params = {
        timeout: environment.timeout,
        tags: {
            name: "list_books",
            user_type: userProfile.type,
            operation_type: operation.type,
        },
    };

    const startTime = new Date().getTime();

    const response = http.get(`${environment.serviceUrl}/api/v1/books?page=1&pageSize=10`, params);

    recordOperationMetrics(response, operation, startTime);
}

function getBook(operation, userProfile) {
    // Use a known book ID or generate one
    const bookId = getKnownBookId();

    const params = {
        timeout: environment.timeout,
        tags: {
            name: "get_book",
            user_type: userProfile.type,
            operation_type: operation.type,
        },
    };

    const startTime = new Date().getTime();

    const response = http.get(`${environment.serviceUrl}/api/v1/books/${bookId}`, params);

    recordOperationMetrics(response, operation, startTime);
}

function createBook(operation, userProfile) {
    const bookData = generateBookData();

    const params = {
        headers: {
            "Content-Type": "application/json",
        },
        timeout: environment.timeout,
        tags: {
            name: "create_book",
            user_type: userProfile.type,
            operation_type: operation.type,
        },
    };

    const startTime = new Date().getTime();

    const response = http.post(
        `${environment.serviceUrl}/api/v1/books`,
        JSON.stringify(bookData),
        params
    );

    recordOperationMetrics(response, operation, startTime);
}

function updateBook(operation, userProfile) {
    const bookId = getKnownBookId();
    const bookData = generateBookData();

    const params = {
        headers: {
            "Content-Type": "application/json",
        },
        timeout: environment.timeout,
        tags: {
            name: "update_book",
            user_type: userProfile.type,
            operation_type: operation.type,
        },
    };

    const startTime = new Date().getTime();

    const response = http.put(
        `${environment.serviceUrl}/api/v1/books/${bookId}`,
        JSON.stringify(bookData),
        params
    );

    recordOperationMetrics(response, operation, startTime);
}

function patchBook(operation, userProfile) {
    const bookId = getKnownBookId();
    const updates = {
        price: (Math.random() * 50 + 10).toFixed(2),
        stockQuantity: Math.floor(Math.random() * 100),
    };

    const params = {
        headers: {
            "Content-Type": "application/json",
        },
        timeout: environment.timeout,
        tags: {
            name: "patch_book",
            user_type: userProfile.type,
            operation_type: operation.type,
        },
    };

    const startTime = new Date().getTime();

    const response = http.patch(
        `${environment.serviceUrl}/api/v1/books/${bookId}`,
        JSON.stringify(updates),
        params
    );

    recordOperationMetrics(response, operation, startTime);
}

function deleteBook(operation, userProfile) {
    const bookId = getKnownBookId();

    const params = {
        timeout: environment.timeout,
        tags: {
            name: "delete_book",
            user_type: userProfile.type,
            operation_type: operation.type,
        },
    };

    const startTime = new Date().getTime();

    const response = http.del(`${environment.serviceUrl}/api/v1/books/${bookId}`, params);

    recordOperationMetrics(response, operation, startTime);
}

function searchBooks(operation, userProfile) {
    const searchTerms = ["fiction", "classic", "novel", "adventure", "mystery"];
    const query = searchTerms[Math.floor(Math.random() * searchTerms.length)];

    const params = {
        timeout: environment.timeout,
        tags: {
            name: "search_books",
            user_type: userProfile.type,
            operation_type: operation.type,
        },
    };

    const startTime = new Date().getTime();

    const response = http.get(
        `${environment.serviceUrl}/api/v1/books/search?query=${query}`,
        params
    );

    recordOperationMetrics(response, operation, startTime);
}

function listAuthors(operation, userProfile) {
    const params = {
        timeout: environment.timeout,
        tags: {
            name: "list_authors",
            user_type: userProfile.type,
            operation_type: operation.type,
        },
    };

    const startTime = new Date().getTime();

    const response = http.get(
        `${environment.serviceUrl}/api/v1/authors?page=1&pageSize=10`,
        params
    );

    recordOperationMetrics(response, operation, startTime);
}

function recordOperationMetrics(response, operation, startTime) {
    const endTime = new Date().getTime();
    const responseTimeMs = endTime - startTime;

    responseTime.add(responseTimeMs);

    // Validate response
    const success = checkResponse(response, operation.expectedStatus);

    if (success) {
        operationsExecuted.add(1);
    }

    // Check performance thresholds
    checkPerformance(response, {
        maxDuration: 5000,
        maxTTFB: 2000,
        maxDownload: 1000,
    });

    errorRate.add(!success);
}

function getOperationForUser(userProfile) {
    const operations = {
        reader: [
            { type: "list_books", expectedStatus: 200, weight: 5 },
            { type: "get_book", expectedStatus: 200, weight: 4 },
            { type: "search_books", expectedStatus: 200, weight: 3 },
            { type: "list_authors", expectedStatus: 200, weight: 2 },
        ],
        librarian: [
            { type: "list_books", expectedStatus: 200, weight: 3 },
            { type: "create_book", expectedStatus: 201, weight: 2 },
            { type: "update_book", expectedStatus: 200, weight: 2 },
            { type: "patch_book", expectedStatus: 200, weight: 3 },
            { type: "get_book", expectedStatus: 200, weight: 2 },
        ],
        manager: [
            { type: "list_books", expectedStatus: 200, weight: 3 },
            { type: "delete_book", expectedStatus: 204, weight: 1 },
            { type: "update_book", expectedStatus: 200, weight: 2 },
            { type: "create_book", expectedStatus: 201, weight: 2 },
            { type: "search_books", expectedStatus: 200, weight: 2 },
        ],
    };

    const userOperations = operations[userProfile.type] || operations.reader;
    return selectWeightedOperation(userOperations);
}

function selectWeightedOperation(operations) {
    const totalWeight = operations.reduce((sum, op) => sum + op.weight, 0);
    let random = Math.random() * totalWeight;

    for (const operation of operations) {
        random -= operation.weight;
        if (random <= 0) {
            return operation;
        }
    }

    return operations[0]; // Fallback
}

function getKnownBookId() {
    // These would be real book IDs from seeded data
    const bookIds = [
        "507f1f77bcf86cd799439011",
        "507f1f77bcf86cd799439012",
        "507f1f77bcf86cd799439013",
        "507f1f77bcf86cd799439014",
    ];

    return bookIds[Math.floor(Math.random() * bookIds.length)];
}

function getThinkTime(usagePattern) {
    const patterns = {
        heavy: Math.random() * 2 + 1, // 1-3 seconds
        light: Math.random() * 10 + 5, // 5-15 seconds
        burst: Math.random() * 0.5 + 0.5, // 0.5-1 seconds
    };

    return patterns[usagePattern] || patterns.light;
}

export function teardown(data) {
    const duration = new Date() - data.startTime;
    console.log(`BookStore API test completed in ${Math.round(duration / 1000)}s`);
}
