// Load test using pre-generated variable data from C# Request Generator
// Similar to smoke test but with sustained load and realistic data distribution

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
const errorRate = new Rate("load_test_errors");
const responseTime = new Trend("load_test_response_time", true);
const operationsExecuted = new Counter("load_test_operations");
const activeUsers = new Gauge("active_virtual_users");
const cacheHitRate = new Rate("cache_hits");
const dataVariety = new Counter("unique_data_used");

// Configuration
const environment = getEnvironment();

export const options = {
    scenarios: {
        load_test: {
            executor: "ramping-vus",
            startVUs: 0,
            stages: [
                { duration: "2m", target: 10 }, // Ramp up to 10 users
                { duration: "5m", target: 10 }, // Stay at 10 users
                { duration: "2m", target: 20 }, // Ramp up to 20 users
                { duration: "5m", target: 20 }, // Sustain load
                { duration: "2m", target: 0 }, // Ramp down
            ],
            gracefulRampDown: "30s",
        },
    },
    thresholds: {
        ...getThresholds("load"),
        load_test_errors: ["rate<0.02"],
        load_test_response_time: ["p(95)<2000", "p(99)<5000"],
        http_req_duration: ["p(90)<1500", "p(95)<2500"],
    },
    summaryTrendStats: ["avg", "min", "med", "max", "p(90)", "p(95)", "p(99)"],
};

export function setup() {
    console.log("╔══════════════════════════════════════════════════════════════════╗");
    console.log("║  Load Test with Pre-Generated Variable Data                     ║");
    console.log("╚══════════════════════════════════════════════════════════════════╝");
    console.log("");
    console.log(`Environment: ${environment.name}`);
    console.log(`Target URL: ${environment.serviceUrl}`);
    console.log(`Books available: ${generatedBooks.length}`);
    console.log(`Authors available: ${generatedAuthors.length}`);
    console.log("");

    // Health check
    const healthResponse = http.get(`${environment.serviceUrl}/health`);
    if (healthResponse.status !== 200) {
        throw new Error(`Service health check failed: ${healthResponse.status}`);
    }

    console.log("✓ Service is healthy");
    console.log("✓ Test data loaded");
    console.log("");
    console.log("Starting load test...");

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

    // User behavior simulation - weighted operations
    const operationType = selectWeightedOperation();

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

    // Variable think time
    sleep(randomIntBetween(1, 3));

    activeUsers.add(-1);
}

function selectWeightedOperation() {
    const rand = Math.random();
    if (rand < 0.50) return "read"; // 50% read operations
    if (rand < 0.75) return "write"; // 25% write operations
    if (rand < 0.95) return "mixed"; // 20% mixed operations
    return "bulk"; // 5% bulk operations
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
                // Read specific book (test cache)
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
                title: `${testBook.title} - Load ${Date.now()}`,
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
            sleep(0.5);
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

            // Delete occasionally (10% chance)
            if (Math.random() < 0.10) {
                sleep(0.5);
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
        const listResponse = http.get(`${baseUrl}/api/v1/Books?page=${randomIntBetween(1, 5)}&pageSize=10`);
        recordMetrics(listResponse, checkResponse(listResponse, 200), "mixed_list");

        sleep(0.3);

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
        // Create multiple books at once
        const bulkBooks = [];
        const count = randomIntBetween(3, 5);

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
    console.log("║  Load Test Summary                                               ║");
    console.log("╚══════════════════════════════════════════════════════════════════╝");
    console.log(`Duration: ${Math.round(duration / 1000)}s`);
    console.log(`Books pool: ${generatedBooks.length} unique items`);
    console.log(`Authors pool: ${generatedAuthors.length} unique items`);
    console.log("");
    console.log("✓ Load test completed");
}
