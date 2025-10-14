// Smoke test using pre-generated variable data from C# Request Generator
// Demonstrates how to use the BookStore.Performance.RequestGenerator for realistic test data

import { check, group, sleep } from "k6";
import http from "k6/http";
import { Rate, Trend, Counter } from "k6/metrics";
import { randomIntBetween, randomItem } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";
import { SharedArray } from "k6/data";

import { getEnvironment } from "../config/environments.js";
import { getThresholds } from "../config/thresholds.js";
import { checkResponse, checkCreateResponse } from "../utils/assertions.js";

// ============================================================================
// GENERATED DATA - Load from C# Request Generator output
// ============================================================================
// Generate test data with: make gen-batch
// This creates variable, realistic data for each VU

const generatedBooks = new SharedArray("books", function () {
    // Try to load pre-generated data, fallback to inline if not available
    try {
        const data = JSON.parse(open("../../Tools/BookStore.Performance.RequestGenerator/test-data/books-bulk.json"));
        console.log(`✓ Loaded ${data.length} pre-generated books`);
        return data;
    } catch (e) {
        console.warn("⚠️  Could not load generated books, using fallback data");
        console.warn("   Run: make gen-batch");
        // Fallback: minimal inline data
        return [
            {
                title: "The Silent Observer",
                author: "Alexander Smith",
                isbn: "978-1-1234-567-8",
                price: 24.99,
                genre: "Mystery",
                description: "A gripping narrative",
                stockQuantity: 42,
                publishedDate: "2023-06-15T00:00:00",
            },
            {
                title: "Midnight Chronicles",
                author: "Emma Johnson",
                isbn: "978-2-2345-678-9",
                price: 19.99,
                genre: "Fiction",
                description: "An epic adventure",
                stockQuantity: 35,
                publishedDate: "2024-01-20T00:00:00",
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
        // Fallback: minimal inline data
        return [
            {
                name: "Alexander Smith",
                bio: "An acclaimed author",
                nationality: "American",
                birthDate: "1975-03-22T00:00:00",
                website: "https://www.author-1234.com",
            },
        ];
    }
});

// Custom metrics
const errorRate = new Rate("smoke_test_errors");
const responseTime = new Trend("smoke_test_response_time", true);
const operationsExecuted = new Counter("smoke_test_operations");
const dataVariety = new Counter("unique_data_used"); // Track how many different books/authors used

// Configuration
const environment = getEnvironment();

export const options = {
    scenarios: {
        smoke_test: {
            executor: "ramping-vus",
            startVUs: 0,
            stages: [
                { duration: "30s", target: 2 }, // Ramp up to 2 users
                { duration: "1m", target: 2 }, // Stay at 2 users
                { duration: "30s", target: 0 }, // Ramp down
            ],
            gracefulRampDown: "10s",
        },
    },
    thresholds: {
        ...getThresholds("smoke"),
        smoke_test_errors: ["rate<0.05"], // Less than 5% errors
        smoke_test_response_time: ["p(95)<1000", "p(99)<2000"],
        http_req_duration: ["p(95)<1000"],
    },
    summaryTrendStats: ["avg", "min", "med", "max", "p(90)", "p(95)", "p(99)"],
};

export function setup() {
    console.log("╔══════════════════════════════════════════════════════════════════╗");
    console.log("║  Smoke Test with Pre-Generated Variable Data                    ║");
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
    console.log("Starting smoke test...");

    return {
        startTime: new Date(),
        baseUrl: environment.serviceUrl,
    };
}

export default function (data) {
    const baseUrl = data.baseUrl;

    // Each VU gets a different book from the pre-generated pool
    const bookIndex = (__VU - 1 + __ITER) % generatedBooks.length;
    const authorIndex = (__VU - 1 + __ITER) % generatedAuthors.length;

    const testBook = generatedBooks[bookIndex];
    const testAuthor = generatedAuthors[authorIndex];

    // Track which data was used (for validation)
    dataVariety.add(1, { book_index: bookIndex, author_index: authorIndex });

    // ========================================================================
    // Test 1: Create Book with Generated Data
    // ========================================================================
    group("Create Book (Generated Data)", function () {
        const createResponse = http.post(`${baseUrl}/api/v1/books`, JSON.stringify(testBook), {
            headers: { "Content-Type": "application/json" },
            timeout: "10s",
        });

        const success = checkCreateResponse(createResponse);
        recordMetrics(createResponse, success, "create_book");

        if (success) {
            const createdBook = JSON.parse(createResponse.body);
            console.log(
                `✓ VU${__VU} created book: "${testBook.title}" by ${testBook.author} (ID: ${createdBook.id})`
            );

            // ====================================================================
            // Test 2: Read the Created Book
            // ====================================================================
            group("Read Created Book", function () {
                sleep(0.5); // Brief pause

                const readResponse = http.get(`${baseUrl}/api/v1/books/${createdBook.id}`);
                const readSuccess = checkResponse(readResponse, 200);
                recordMetrics(readResponse, readSuccess, "read_book");

                if (readSuccess) {
                    const retrievedBook = JSON.parse(readResponse.body);
                    check(retrievedBook, {
                        "book title matches": (b) => b.title === testBook.title,
                        "book author matches": (b) => b.author === testBook.author,
                        "book price matches": (b) => b.price === testBook.price,
                        "book genre matches": (b) => b.genre === testBook.genre,
                    });
                }
            });

            // ====================================================================
            // Test 3: Update the Book
            // ====================================================================
            group("Update Book", function () {
                sleep(0.5);

                const updates = {
                    price: parseFloat((testBook.price * 1.1).toFixed(2)), // 10% price increase
                    stockQuantity: testBook.stockQuantity + 10,
                };

                const updateResponse = http.patch(
                    `${baseUrl}/api/v1/books/${createdBook.id}`,
                    JSON.stringify(updates),
                    {
                        headers: { "Content-Type": "application/json" },
                        timeout: "10s",
                    }
                );

                const updateSuccess = checkResponse(updateResponse, 200);
                recordMetrics(updateResponse, updateSuccess, "update_book");

                if (updateSuccess) {
                    console.log(`✓ VU${__VU} updated book price: $${testBook.price} → $${updates.price}`);
                }
            });

            // ====================================================================
            // Test 4: Delete the Book
            // ====================================================================
            group("Delete Book", function () {
                sleep(0.5);

                const deleteResponse = http.del(`${baseUrl}/api/v1/books/${createdBook.id}`, null, {
                    timeout: "10s",
                });

                const deleteSuccess = check(deleteResponse, {
                    "delete status is 204": (r) => r.status === 204,
                });

                recordMetrics(deleteResponse, deleteSuccess, "delete_book");

                if (deleteSuccess) {
                    console.log(`✓ VU${__VU} deleted book: "${testBook.title}"`);
                }
            });
        }
    });

    // ========================================================================
    // Test 5: List Books (Read-only operation)
    // ========================================================================
    group("List Books", function () {
        const listResponse = http.get(`${baseUrl}/api/v1/books?page=1&pageSize=10`);
        const success = checkResponse(listResponse, 200);
        recordMetrics(listResponse, success, "list_books");

        if (success && listResponse.body) {
            const books = JSON.parse(listResponse.body);
            console.log(`✓ VU${__VU} listed ${books.length} books`);
        }
    });

    // ========================================================================
    // Test 6: Search Books by Genre (using generated book's genre)
    // ========================================================================
    group("Search Books by Genre", function () {
        const searchResponse = http.get(`${baseUrl}/api/v1/books?genre=${testBook.genre}&page=1&pageSize=5`);
        const success = checkResponse(searchResponse, 200);
        recordMetrics(searchResponse, success, "search_books");

        if (success && searchResponse.body) {
            const books = JSON.parse(searchResponse.body);
            console.log(`✓ VU${__VU} found ${books.length} ${testBook.genre} books`);
        }
    });

    // Think time between iterations
    sleep(randomIntBetween(1, 3));
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
    console.log("║  Smoke Test Summary                                              ║");
    console.log("╚══════════════════════════════════════════════════════════════════╝");
    console.log(`Duration: ${Math.round(duration / 1000)}s`);
    console.log(`Books pool: ${generatedBooks.length} unique items`);
    console.log(`Authors pool: ${generatedAuthors.length} unique items`);
    console.log("");
    console.log("💡 Data Generation Tips:");
    console.log("   - Generate fresh data: make gen-batch");
    console.log("   - Custom count: make gen-books COUNT=200");
    console.log("   - View files: ls Tools/BookStore.Performance.RequestGenerator/test-data/");
    console.log("");
    console.log("✓ Smoke test completed");
}
