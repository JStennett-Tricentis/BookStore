// Comprehensive load testing scenario for BookStore API

import { check, group } from "k6";
import http from "k6/http";
import { Rate, Trend, Counter, Gauge } from "k6/metrics";
import { randomIntBetween, randomItem } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

import { getEnvironment } from "../config/environments.js";
import { getThresholds } from "../config/thresholds.js";
import { generateBookData, generateUserProfile } from "../utils/data-generators.js";
import { checkResponse, checkCreateResponse } from "../utils/assertions.js";

// Custom metrics
const errorRate = new Rate("load_test_errors");
const responseTime = new Trend("load_test_response_time", true);
const operationsExecuted = new Counter("load_test_operations");
const activeUsers = new Gauge("active_virtual_users");
const cacheHitRate = new Rate("cache_hits");
const dbOperations = new Counter("database_operations");

// Configuration
const environment = getEnvironment();
const scenario = __ENV.SCENARIO || "load";

export const options = {
    scenarios: {
        // Gradual ramp-up load test
        gradual_load: {
            executor: "ramping-vus",
            startVUs: 0,
            stages: [
                { duration: "2m", target: 5 },   // Ramp up to 5 users over 2 minutes
                { duration: "5m", target: 10 },  // Stay at 10 users for 5 minutes
                { duration: "3m", target: 15 },  // Ramp up to 15 users
                { duration: "5m", target: 15 },  // Stay at 15 users for 5 minutes
                { duration: "2m", target: 0 },   // Ramp down
            ],
            gracefulRampDown: "30s",
        },

        // Spike testing within the load test
        spike_test: {
            executor: "ramping-vus",
            startVUs: 0,
            stages: [
                { duration: "5m", target: 5 },   // Normal load
                { duration: "30s", target: 25 }, // Spike
                { duration: "2m", target: 25 },  // Hold spike
                { duration: "30s", target: 5 },  // Return to normal
                { duration: "3m", target: 5 },   // Stay normal
                { duration: "30s", target: 0 },  // Finish
            ],
            gracefulRampDown: "30s",
            // Start this scenario after 8 minutes
            startTime: "8m",
        }
    },
    thresholds: {
        ...getThresholds(scenario),
        load_test_errors: ["rate<0.02"],
        load_test_response_time: ["p(95)<2000", "p(99)<5000"],
        cache_hits: ["rate>0.3"], // Expect at least 30% cache hit rate
        http_req_duration: ["p(90)<1500", "p(95)<2500", "p(99)<5000"],
    },
    summaryTrendStats: ["avg", "min", "med", "max", "p(90)", "p(95)", "p(99)"],
};

export function setup() {
    console.log(`Starting BookStore Load Test - Environment: ${environment.name}`);
    console.log(`Target URL: ${environment.serviceUrl}`);

    // Health check
    const healthResponse = http.get(`${environment.serviceUrl}/health`);
    if (healthResponse.status !== 200) {
        throw new Error(`Service health check failed: ${healthResponse.status}`);
    }

    // Seed initial data for testing
    console.log("Seeding test data...");
    const seedResponse = http.post(`${environment.serviceUrl}/seed-data`);
    if (seedResponse.status !== 200) {
        console.warn("Failed to seed data, continuing with existing data");
    }

    console.log("✓ Load test setup completed");
    return {
        startTime: new Date(),
        baseUrl: environment.serviceUrl
    };
}

export default function(data) {
    activeUsers.add(1);

    const userProfile = generateUserProfile(__VU);
    const baseUrl = data.baseUrl;

    // Execute mixed workload based on user profile
    group("Mixed BookStore Operations", function() {
        executeUserScenario(baseUrl, userProfile);
    });

    // Think time - simulate real user behavior
    sleep(getThinkTime(userProfile.usagePattern));

    activeUsers.add(-1);
}

function executeUserScenario(baseUrl, userProfile) {
    const scenarios = {
        reader: () => executeReaderScenario(baseUrl, userProfile),
        librarian: () => executeLibrarianScenario(baseUrl, userProfile),
        manager: () => executeManagerScenario(baseUrl, userProfile)
    };

    const scenarioFunc = scenarios[userProfile.type] || scenarios.reader;
    scenarioFunc();
}

function executeReaderScenario(baseUrl, userProfile) {
    // Typical reader: browses books, searches, reads details

    group("Browse Books", function() {
        const listResponse = http.get(`${baseUrl}/api/v1/books?page=1&pageSize=10`);
        const success = checkResponse(listResponse, 200);

        recordMetrics(listResponse, success, "list_books");

        if (success && listResponse.body) {
            const books = JSON.parse(listResponse.body);
            if (books.length > 0) {
                // Get details of a random book (cache test)
                const randomBook = books[randomIntBetween(0, books.length - 1)];

                group("Get Book Details", function() {
                    const bookResponse = http.get(`${baseUrl}/api/v1/books/${randomBook.id}`);
                    const bookSuccess = checkResponse(bookResponse, 200);

                    recordMetrics(bookResponse, bookSuccess, "get_book");

                    // Check if this was a cache hit (custom header or fast response)
                    const wasCached = bookResponse.timings.duration < 50;
                    cacheHitRate.add(wasCached ? 1 : 0);

                    if (!wasCached) {
                        dbOperations.add(1);
                    }
                });
            }
        }
    });

    // 60% chance to perform a search
    if (Math.random() < 0.6) {
        group("Search Books", function() {
            const searchTerms = ["fiction", "mystery", "romance", "classic", "adventure"];
            const query = randomItem(searchTerms);

            const searchResponse = http.get(`${baseUrl}/api/v1/books/search?query=${query}`);
            const success = checkResponse(searchResponse, 200);

            recordMetrics(searchResponse, success, "search_books");
        });
    }

    // 40% chance to browse authors
    if (Math.random() < 0.4) {
        group("Browse Authors", function() {
            const authorsResponse = http.get(`${baseUrl}/api/v1/authors?page=1&pageSize=5`);
            const success = checkResponse(authorsResponse, 200);

            recordMetrics(authorsResponse, success, "list_authors");
        });
    }
}

function executeLibrarianScenario(baseUrl, userProfile) {
    // Librarian: manages books, creates, updates

    // Start with browsing (like reader)
    executeReaderScenario(baseUrl, userProfile);

    // 70% chance to create a new book
    if (Math.random() < 0.7) {
        group("Create Book", function() {
            const bookData = generateBookData();

            const createResponse = http.post(
                `${baseUrl}/api/v1/books`,
                JSON.stringify(bookData),
                {
                    headers: { "Content-Type": "application/json" },
                    timeout: "10s"
                }
            );

            const success = checkCreateResponse(createResponse);
            recordMetrics(createResponse, success, "create_book");

            if (success) {
                dbOperations.add(1);
            }
        });
    }

    // 50% chance to update an existing book
    if (Math.random() < 0.5) {
        group("Update Book", function() {
            // First get list of books
            const listResponse = http.get(`${baseUrl}/api/v1/books?page=1&pageSize=5`);
            if (listResponse.status === 200) {
                const books = JSON.parse(listResponse.body);
                if (books.length > 0) {
                    const randomBook = randomItem(books);

                    // Update some fields
                    const updates = {
                        price: parseFloat((Math.random() * 30 + 10).toFixed(2)),
                        stockQuantity: randomIntBetween(1, 100)
                    };

                    const updateResponse = http.patch(
                        `${baseUrl}/api/v1/books/${randomBook.id}`,
                        JSON.stringify(updates),
                        {
                            headers: { "Content-Type": "application/json" },
                            timeout: "10s"
                        }
                    );

                    const success = checkResponse(updateResponse, 200);
                    recordMetrics(updateResponse, success, "update_book");

                    if (success) {
                        dbOperations.add(1);
                    }
                }
            }
        });
    }
}

function executeManagerScenario(baseUrl, userProfile) {
    // Manager: full CRUD operations, analytics views

    // Start with librarian capabilities
    executeLibrarianScenario(baseUrl, userProfile);

    // 30% chance to delete a book (rare operation)
    if (Math.random() < 0.3) {
        group("Delete Book", function() {
            // Create a book first, then delete it
            const bookData = generateBookData();
            bookData.title = `TEST_DELETE_${Date.now()}`;

            const createResponse = http.post(
                `${baseUrl}/api/v1/books`,
                JSON.stringify(bookData),
                {
                    headers: { "Content-Type": "application/json" },
                    timeout: "10s"
                }
            );

            if (createResponse.status === 201) {
                const createdBook = JSON.parse(createResponse.body);

                const deleteResponse = http.del(
                    `${baseUrl}/api/v1/books/${createdBook.id}`,
                    null,
                    { timeout: "10s" }
                );

                const success = check(deleteResponse, {
                    "delete status is 204": (r) => r.status === 204
                });

                recordMetrics(deleteResponse, success, "delete_book");

                if (success) {
                    dbOperations.add(2); // Create + Delete
                }
            }
        });
    }

    // Manager analytics - multiple concurrent requests
    group("Analytics Dashboard", function() {
        const requests = [
            ["GET", `${baseUrl}/api/v1/books?genre=Fiction&page=1&pageSize=20`],
            ["GET", `${baseUrl}/api/v1/books?genre=Mystery&page=1&pageSize=20`],
            ["GET", `${baseUrl}/api/v1/authors?page=1&pageSize=15`],
            ["GET", `${baseUrl}/api/v1/books/search?query=bestseller`]
        ];

        const responses = http.batch(requests.map(([method, url]) => ({
            method,
            url,
            params: { timeout: "15s" }
        })));

        responses.forEach((response, index) => {
            const success = checkResponse(response, 200);
            recordMetrics(response, success, `analytics_request_${index}`);
        });
    });
}

function recordMetrics(response, success, operation) {
    responseTime.add(response.timings.duration);
    operationsExecuted.add(1);
    errorRate.add(!success);

    // Tag the response for better metrics
    response.tags = {
        ...response.tags,
        operation: operation,
        success: success.toString()
    };
}

function getThinkTime(usagePattern) {
    const patterns = {
        heavy: randomIntBetween(1000, 3000),    // 1-3 seconds
        light: randomIntBetween(3000, 8000),    // 3-8 seconds
        burst: randomIntBetween(500, 1500),     // 0.5-1.5 seconds
    };

    return patterns[usagePattern] || patterns.light;
}

function sleep(ms) {
    // K6 sleep function expects seconds
    require('k6').sleep(ms / 1000);
}

export function teardown(data) {
    const duration = new Date() - data.startTime;
    console.log(`BookStore Load Test completed in ${Math.round(duration / 1000)}s`);

    // Optional: cleanup test data
    // This would require admin endpoints or cleanup logic
}