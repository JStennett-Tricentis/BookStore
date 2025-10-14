// Spike test using pre-generated variable data from C# Request Generator
// Sudden burst of traffic to test system recovery with realistic data

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
const errorRate = new Rate("spike_test_errors");
const responseTime = new Trend("spike_test_response_time", true);
const operationsExecuted = new Counter("spike_test_operations");
const activeUsers = new Gauge("active_virtual_users");
const cacheHitRate = new Rate("cache_hits");
const dataVariety = new Counter("unique_data_used");
const recoveryMetric = new Gauge("system_recovery_health");
const spikePhase = new Gauge("spike_phase"); // 1=pre-spike, 2=spike, 3=post-spike

// Configuration
const environment = getEnvironment();

export const options = {
    scenarios: {
        spike_test: {
            executor: "ramping-vus",
            startVUs: 0,
            stages: [
                { duration: "1m", target: 5 },   // Pre-spike: baseline
                { duration: "30s", target: 50 }, // SPIKE: sudden burst
                { duration: "2m", target: 50 },  // Sustain spike
                { duration: "1m", target: 5 },   // Recovery: back to baseline
                { duration: "2m", target: 5 },   // Post-spike: observe recovery
                { duration: "30s", target: 0 },  // Cool down
            ],
            gracefulRampDown: "30s",
        },
    },
    thresholds: {
        ...getThresholds("spike"),
        spike_test_errors: ["rate<0.10"], // More lenient during spike
        spike_test_response_time: ["p(95)<5000", "p(99)<10000"],
        http_req_duration: ["p(90)<3000", "p(95)<6000"],
        http_req_failed: ["rate<0.10"],
    },
    summaryTrendStats: ["avg", "min", "med", "max", "p(90)", "p(95)", "p(99)"],
};

export function setup() {
    console.log("╔══════════════════════════════════════════════════════════════════╗");
    console.log("║  Spike Test with Pre-Generated Variable Data                    ║");
    console.log("║  Sudden traffic burst to test recovery                          ║");
    console.log("╚══════════════════════════════════════════════════════════════════╝");
    console.log("");
    console.log(`Environment: ${environment.name}`);
    console.log(`Target URL: ${environment.serviceUrl}`);
    console.log(`Books available: ${generatedBooks.length}`);
    console.log(`Authors available: ${generatedAuthors.length}`);
    console.log(`Spike: 5 → 50 VUs in 30 seconds`);
    console.log("");

    // Health check
    const healthResponse = http.get(`${environment.serviceUrl}/health`);
    if (healthResponse.status !== 200) {
        throw new Error(`Service health check failed: ${healthResponse.status}`);
    }

    console.log("✓ Service is healthy");
    console.log("✓ Test data loaded");
    console.log("");
    console.log("Starting spike test...");
    console.log("Phase 1: Pre-spike baseline (1 min)");
    console.log("Phase 2: SPIKE! 5→50 VUs (30s)");
    console.log("Phase 3: Sustain spike (2 min)");
    console.log("Phase 4: Recovery (3 min)");

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

    // Determine spike phase based on VU count
    let phase = 1; // pre-spike
    if (__VU > 40) {
        phase = 2; // spike
    } else if (__VU > 10 && __ITER > 10) {
        phase = 3; // post-spike recovery
    }
    spikePhase.add(phase);

    // Calculate recovery health (lower error rate = better recovery)
    const isRecovering = __VU <= 10 && __ITER > 20;
    if (isRecovering) {
        recoveryMetric.add(1);
    }

    // Operation selection based on spike phase
    const operationType = selectWeightedOperation(phase);

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

    // Think time varies by phase
    let thinkTime;
    if (phase === 2) {
        // During spike: minimal think time (aggressive)
        thinkTime = randomIntBetween(0.3, 0.8);
    } else if (phase === 3) {
        // Recovery: normal think time
        thinkTime = randomIntBetween(1, 2);
    } else {
        // Pre-spike: relaxed
        thinkTime = randomIntBetween(1, 3);
    }
    sleep(thinkTime);

    activeUsers.add(-1);
}

function selectWeightedOperation(phase) {
    const rand = Math.random();

    if (phase === 2) {
        // During spike: mostly reads to maximize load
        if (rand < 0.70) return "read";   // 70% read
        if (rand < 0.85) return "write";  // 15% write
        if (rand < 0.95) return "mixed";  // 10% mixed
        return "bulk";                     // 5% bulk
    } else {
        // Normal pattern
        if (rand < 0.50) return "read";   // 50% read
        if (rand < 0.75) return "write";  // 25% write
        if (rand < 0.95) return "mixed";  // 20% mixed
        return "bulk";                     // 5% bulk
    }
}

function performReadOperations(baseUrl, testBook) {
    group("Read Operations", function () {
        // List books
        const listResponse = http.get(`${baseUrl}/api/v1/Books?page=1&pageSize=20`, {
            timeout: "15s", // More lenient during spike
        });
        const listSuccess = checkResponse(listResponse, 200);
        recordMetrics(listResponse, listSuccess, "list_books");

        if (listSuccess) {
            const result = JSON.parse(listResponse.body);
            if (result.books && result.books.length > 0) {
                // Read specific book (cache effectiveness during spike)
                const bookId = result.books[0].id;
                const getResponse = http.get(`${baseUrl}/api/v1/Books/${bookId}`, {
                    timeout: "15s",
                });
                const getSuccess = checkResponse(getResponse, 200);
                recordMetrics(getResponse, getSuccess, "get_book");

                if (getSuccess) {
                    cacheHitRate.add(1);
                }
            }
        }

        // Search by genre
        const searchResponse = http.get(`${baseUrl}/api/v1/Books?genre=${testBook.genre}&page=1&pageSize=10`, {
            timeout: "15s",
        });
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
                title: `${testBook.title} - Spike ${Date.now()}`,
                isbn: `${testBook.isbn.substring(0, 10)}-${Math.random().toString(36).substring(7)}`,
            }),
            {
                headers: { "Content-Type": "application/json" },
                timeout: "15s",
            }
        );

        const success = checkCreateResponse(createResponse);
        recordMetrics(createResponse, success, "create_book");

        if (success) {
            const createdBook = JSON.parse(createResponse.body);

            // Update the book (only if not in spike phase)
            if (__VU <= 30) {
                sleep(0.5);
                const updateResponse = http.patch(
                    `${baseUrl}/api/v1/Books/${createdBook.id}`,
                    JSON.stringify({
                        price: parseFloat((testBook.price * 1.1).toFixed(2)),
                        stockQuantity: testBook.stockQuantity + 10,
                    }),
                    {
                        headers: { "Content-Type": "application/json" },
                        timeout: "15s",
                    }
                );

                recordMetrics(updateResponse, checkResponse(updateResponse, 200), "update_book");

                // Delete occasionally (5% chance, not during peak spike)
                if (Math.random() < 0.05 && __VU <= 20) {
                    sleep(0.5);
                    const deleteResponse = http.del(`${baseUrl}/api/v1/Books/${createdBook.id}`, null, {
                        timeout: "15s",
                    });
                    recordMetrics(deleteResponse, check(deleteResponse, { "status is 204": (r) => r.status === 204 }), "delete_book");
                }
            }
        }
    });
}

function performMixedOperations(baseUrl, testBook) {
    group("Mixed Operations", function () {
        // Read first
        const listResponse = http.get(`${baseUrl}/api/v1/Books?page=${randomIntBetween(1, 5)}&pageSize=10`, {
            timeout: "15s",
        });
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
                timeout: "15s",
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
    console.log("║  Spike Test Summary                                              ║");
    console.log("╚══════════════════════════════════════════════════════════════════╝");
    console.log(`Duration: ${Math.round(duration / 1000)}s`);
    console.log(`Books pool: ${generatedBooks.length} unique items`);
    console.log(`Authors pool: ${generatedAuthors.length} unique items`);
    console.log(`Spike pattern: 5 → 50 → 5 VUs`);
    console.log("");
    console.log("✓ Spike test completed");
    console.log("Review metrics to assess system recovery and resilience");
}
