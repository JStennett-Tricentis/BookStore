// Stress test using pre-generated variable data from C# Request Generator
// High-load sustained test to identify system breaking points with realistic data

import { check, group, sleep } from "k6";
import http from "k6/http";
import { Rate, Trend, Counter, Gauge } from "k6/metrics";
import { randomIntBetween, randomItem } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";
import { SharedArray } from "k6/data";

import { getEnvironment } from "../config/environments.js";
import { getThresholds } from "../config/thresholds.js";
import { checkResponse, checkCreateResponse } from "../utils/assertions.js";

// ============================================================================
// GENERATED DATA - Load from C# Request Generator output
// ============================================================================

const generatedBooks = new SharedArray("books", function () {
    try {
        const data = JSON.parse(open("../../Tools/BookStore.Performance.RequestGenerator/test-data/books-bulk.json"));
        console.log(`✓ Loaded ${data.length} pre-generated books`);
        return data;
    } catch (e) {
        console.warn("⚠️  Could not load generated books, using fallback data");
        console.warn("   Run: make gen-batch");
        return [
            {
                title: "Fallback Book",
                author: "Generated Author",
                isbn: "978-1-1234-567-8",
                price: 24.99,
                genre: "Fiction",
                description: "Fallback book data",
                stockQuantity: 50,
                publishedDate: "2024-01-01T00:00:00",
            },
        ];
    }
});

const generatedAuthors = new SharedArray("authors", function () {
    try {
        const data = JSON.parse(open("../../Tools/BookStore.Performance.RequestGenerator/test-data/authors-bulk.json"));
        console.log(`✓ Loaded ${data.length} pre-generated authors`);
        return data;
    } catch (e) {
        console.warn("⚠️  Could not load generated authors, using fallback data");
        return [
            {
                name: "Fallback Author",
                bio: "Generated author bio",
                nationality: "American",
                birthDate: "1975-01-01T00:00:00",
            },
        ];
    }
});

// Custom metrics
const errorRate = new Rate("stress_test_errors");
const responseTime = new Trend("stress_test_response_time", true);
const operationsExecuted = new Counter("stress_test_operations");
const activeUsers = new Gauge("active_virtual_users");
const cacheHitRate = new Rate("cache_hits");
const dataVariety = new Counter("unique_data_used");
const systemStress = new Gauge("system_stress_level");

// Configuration
const environment = getEnvironment();

export const options = {
    scenarios: {
        stress_test: {
            executor: "ramping-vus",
            startVUs: 0,
            stages: [
                { duration: "2m", target: 10 },  // Warm up
                { duration: "3m", target: 20 },  // Ramp to moderate load
                { duration: "5m", target: 30 },  // Stress level - sustain
                { duration: "3m", target: 40 },  // Push harder
                { duration: "2m", target: 30 },  // Slight recovery
                { duration: "2m", target: 0 },   // Cool down
            ],
            gracefulRampDown: "30s",
        },
    },
    thresholds: {
        ...getThresholds("stress"),
        stress_test_errors: ["rate<0.05"],
        stress_test_response_time: ["p(95)<3000", "p(99)<8000"],
        http_req_duration: ["p(90)<2000", "p(95)<4000"],
        http_req_failed: ["rate<0.05"],
    },
    summaryTrendStats: ["avg", "min", "med", "max", "p(90)", "p(95)", "p(99)"],
};

export function setup() {
    console.log("╔══════════════════════════════════════════════════════════════════╗");
    console.log("║  Stress Test with Pre-Generated Variable Data                   ║");
    console.log("║  High load to identify breaking points                          ║");
    console.log("╚══════════════════════════════════════════════════════════════════╝");
    console.log("");
    console.log(`Environment: ${environment.name}`);
    console.log(`Target URL: ${environment.serviceUrl}`);
    console.log(`Books available: ${generatedBooks.length}`);
    console.log(`Authors available: ${generatedAuthors.length}`);
    console.log(`Peak VUs: 40`);
    console.log("");

    // Health check
    const healthResponse = http.get(`${environment.serviceUrl}/health`);
    if (healthResponse.status !== 200) {
        throw new Error(`Service health check failed: ${healthResponse.status}`);
    }

    console.log("✓ Service is healthy");
    console.log("✓ Test data loaded");
    console.log("");
    console.log("Starting stress test...");

    return {
        startTime: new Date(),
        baseUrl: environment.serviceUrl,
        createdBookIds: [],
    };
}

export default function (data) {
    activeUsers.add(1);

    const baseUrl = data.baseUrl;

    // Use different data for each VU and iteration
    const bookIndex = (__VU - 1 + __ITER) % generatedBooks.length;
    const authorIndex = (__VU - 1 + __ITER) % generatedAuthors.length;

    const testBook = generatedBooks[bookIndex];
    const testAuthor = generatedAuthors[authorIndex];

    // Track data variety
    dataVariety.add(1, { book_index: bookIndex, author_index: authorIndex });

    // Calculate stress level based on active VUs
    const stressLevel = __VU / 40; // 0.0 to 1.0
    systemStress.add(stressLevel);

    // More aggressive operations under stress
    const operationType = selectWeightedOperation(stressLevel);

    switch (operationType) {
        case "read":
            performReadOperations(baseUrl, testBook);
            break;
        case "write":
            performWriteOperations(baseUrl, testBook);
            break;
        case "mixed":
            performMixedOperations(baseUrl, testBook);
            break;
        case "bulk":
            performBulkOperations(baseUrl);
            break;
    }

    // Shorter think time under stress
    const thinkTime = stressLevel > 0.7 ? randomIntBetween(0.5, 1) : randomIntBetween(1, 2);
    sleep(thinkTime);

    activeUsers.add(-1);
}

function selectWeightedOperation(stressLevel) {
    // Under high stress, more write operations to pressure the system
    const rand = Math.random();
    if (stressLevel > 0.7) {
        // High stress: more writes
        if (rand < 0.40) return "read";   // 40% read
        if (rand < 0.70) return "write";  // 30% write
        if (rand < 0.90) return "mixed";  // 20% mixed
        return "bulk";                     // 10% bulk
    } else {
        // Normal stress pattern
        if (rand < 0.50) return "read";   // 50% read
        if (rand < 0.75) return "write";  // 25% write
        if (rand < 0.95) return "mixed";  // 20% mixed
        return "bulk";                     // 5% bulk
    }
}

function performReadOperations(baseUrl, testBook) {
    group("Read Operations", function () {
        // List books
        const listResponse = http.get(`${baseUrl}/api/v1/Books?page=1&pageSize=20`);
        const listSuccess = checkResponse(listResponse, 200);
        recordMetrics(listResponse, listSuccess, "list_books");

        if (listSuccess) {
            const result = JSON.parse(listResponse.body);
            if (result.books && result.books.length > 0) {
                // Read specific book (test cache under stress)
                const bookId = result.books[0].id;
                const getResponse = http.get(`${baseUrl}/api/v1/Books/${bookId}`);
                const getSuccess = checkResponse(getResponse, 200);
                recordMetrics(getResponse, getSuccess, "get_book");

                if (getSuccess) {
                    cacheHitRate.add(1);
                }
            }
        }

        // Search by genre
        const searchResponse = http.get(`${baseUrl}/api/v1/Books?genre=${testBook.genre}&page=1&pageSize=10`);
        recordMetrics(searchResponse, checkResponse(searchResponse, 200), "search_books");
    });
}

function performWriteOperations(baseUrl, testBook) {
    group("Write Operations", function () {
        // Create book
        const createResponse = http.post(
            `${baseUrl}/api/v1/Books`,
            JSON.stringify({
                ...testBook,
                title: `${testBook.title} - Stress ${Date.now()}`,
                isbn: `${testBook.isbn.substring(0, 10)}-${Math.random().toString(36).substring(7)}`,
            }),
            {
                headers: { "Content-Type": "application/json" },
                timeout: "10s",
            }
        );

        const success = checkCreateResponse(createResponse);
        recordMetrics(createResponse, success, "create_book");

        if (success) {
            const createdBook = JSON.parse(createResponse.body);

            // Update the book
            sleep(0.3);
            const updateResponse = http.patch(
                `${baseUrl}/api/v1/Books/${createdBook.id}`,
                JSON.stringify({
                    price: parseFloat((testBook.price * 1.1).toFixed(2)),
                    stockQuantity: testBook.stockQuantity + 10,
                }),
                {
                    headers: { "Content-Type": "application/json" },
                    timeout: "10s",
                }
            );

            recordMetrics(updateResponse, checkResponse(updateResponse, 200), "update_book");

            // Delete more frequently under stress (20% chance)
            if (Math.random() < 0.20) {
                sleep(0.3);
                const deleteResponse = http.del(`${baseUrl}/api/v1/Books/${createdBook.id}`, null, {
                    timeout: "10s",
                });
                recordMetrics(deleteResponse, check(deleteResponse, { "status is 204": (r) => r.status === 204 }), "delete_book");
            }
        }
    });
}

function performMixedOperations(baseUrl, testBook) {
    group("Mixed Operations", function () {
        // Read first
        const listResponse = http.get(`${baseUrl}/api/v1/Books?page=${randomIntBetween(1, 10)}&pageSize=10`);
        recordMetrics(listResponse, checkResponse(listResponse, 200), "mixed_list");

        sleep(0.2);

        // Then write
        const createResponse = http.post(
            `${baseUrl}/api/v1/Books`,
            JSON.stringify({
                ...testBook,
                title: `${testBook.title} - Mixed ${__VU}-${__ITER}`,
                isbn: `${testBook.isbn}-${Date.now()}`,
            }),
            {
                headers: { "Content-Type": "application/json" },
            }
        );

        recordMetrics(createResponse, checkCreateResponse(createResponse), "mixed_create");
    });
}

function performBulkOperations(baseUrl) {
    group("Bulk Operations", function () {
        // Create multiple books at once (more under stress)
        const bulkBooks = [];
        const count = randomIntBetween(5, 8);

        for (let i = 0; i < count; i++) {
            const bookIndex = Math.floor(Math.random() * generatedBooks.length);
            const book = generatedBooks[bookIndex];
            bulkBooks.push({
                ...book,
                title: `${book.title} - Bulk ${Date.now()}-${i}`,
                isbn: `${book.isbn}-${Math.random().toString(36).substring(7)}`,
            });
        }

        const bulkResponse = http.post(
            `${baseUrl}/api/v1/Books/bulk`,
            JSON.stringify(bulkBooks),
            {
                headers: { "Content-Type": "application/json" },
                timeout: "20s",
            }
        );

        const success = check(bulkResponse, {
            "bulk status is 200": (r) => r.status === 200,
            "bulk has message": (r) => {
                try {
                    const body = JSON.parse(r.body);
                    return body.message && body.books;
                } catch {
                    return false;
                }
            },
        });

        recordMetrics(bulkResponse, success, "bulk_create");

        if (success) {
            console.log(`✓ VU${__VU} created ${bulkBooks.length} books via bulk endpoint`);
        }
    });
}

function recordMetrics(response, success, operation) {
    responseTime.add(response.timings.duration, {
        operation: operation,
        success: success.toString(),
    });
    operationsExecuted.add(1, {
        operation: operation,
        success: success.toString(),
    });
    errorRate.add(!success, {
        operation: operation,
    });
}

export function teardown(data) {
    const duration = new Date() - data.startTime;
    console.log("");
    console.log("╔══════════════════════════════════════════════════════════════════╗");
    console.log("║  Stress Test Summary                                             ║");
    console.log("╚══════════════════════════════════════════════════════════════════╝");
    console.log(`Duration: ${Math.round(duration / 1000)}s`);
    console.log(`Books pool: ${generatedBooks.length} unique items`);
    console.log(`Authors pool: ${generatedAuthors.length} unique items`);
    console.log(`Peak VUs: 40`);
    console.log("");
    console.log("✓ Stress test completed");
}
