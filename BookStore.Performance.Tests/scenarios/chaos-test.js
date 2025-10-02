import http from "k6/http";
import { sleep, check, group } from "k6";
import { SharedArray } from "k6/data";
import { Rate, Counter, Trend } from "k6/metrics";
import { chaosConfig } from "../config/chaos-config.js";

// Import utilities
const BASE_URL = __ENV.BASE_URL || "http://localhost:7002";

// Custom metrics
const errorRate = new Rate("errors");
const chaosOperations = new Counter("chaos_operations");
const responseTime = new Trend("chaos_response_time");

// Load test data
const books = new SharedArray("books", function () {
    return [
        { title: "Chaos Engineering", author: "Casey Rosenthal", isbn: "9781492043850" },
        { title: "The Phoenix Project", author: "Gene Kim", isbn: "9780988262508" },
        { title: "Site Reliability Engineering", author: "Betsy Beyer", isbn: "9781491929124" },
    ];
});

// Chaos test configuration (loaded from config file)
export const options = {
    scenarios: {
        // Scenario 0: Data setup - runs first to create test data
        data_setup: {
            executor: "shared-iterations",
            vus: 1,
            iterations: 1,
            maxDuration: chaosConfig.dataSetup.maxDuration,
            exec: "setupTestData",
            startTime: "0s",
        },

        // Scenario 1: Random user spikes (tests HTTP metrics, Kestrel, threading)
        random_spikes: {
            executor: "ramping-vus",
            startVUs: 1,
            stages: chaosConfig.randomSpikes.stages,
            gracefulRampDown: chaosConfig.randomSpikes.gracefulRampDown,
            exec: "chaosRequests",
            startTime: chaosConfig.randomSpikes.startTime,
        },

        // Scenario 2: Constant LLM load (tests LLM metrics, AI costs)
        llm_bombardment: {
            executor: "constant-vus",
            vus: chaosConfig.llmBombardment.vus,
            duration: chaosConfig.llmBombardment.duration,
            exec: "llmChaos",
            startTime: chaosConfig.llmBombardment.startTime,
        },

        // Scenario 3: Error generator (tests error dashboards)
        error_chaos: {
            executor: "constant-vus",
            vus: chaosConfig.errorChaos.vus,
            duration: chaosConfig.errorChaos.duration,
            exec: "errorChaos",
            startTime: chaosConfig.errorChaos.startTime,
        },

        // Scenario 4: Memory pressure (tests .NET runtime, GC metrics)
        memory_pressure: {
            executor: "constant-vus",
            vus: chaosConfig.memoryPressure.vus,
            duration: chaosConfig.memoryPressure.duration,
            exec: "memoryPressure",
            startTime: chaosConfig.memoryPressure.startTime,
        },

        // Scenario 5: Database hammering (tests external dependencies)
        database_chaos: {
            executor: "ramping-vus",
            startVUs: 1,
            stages: chaosConfig.databaseChaos.stages,
            exec: "databaseChaos",
            startTime: chaosConfig.databaseChaos.startTime,
        },

        // Scenario 6: Connection pool chaos (tests Kestrel metrics, queued connections)
        connection_chaos: {
            executor: "ramping-vus",
            startVUs: 1,
            stages: chaosConfig.connectionChaos.stages,
            exec: "connectionChaos",
            startTime: chaosConfig.connectionChaos.startTime,
        },

        // Scenario 7: Thread pool saturation (tests threading metrics)
        thread_chaos: {
            executor: "constant-vus",
            vus: chaosConfig.threadChaos.vus,
            duration: chaosConfig.threadChaos.duration,
            exec: "threadChaos",
            startTime: chaosConfig.threadChaos.startTime,
        },
    },
    thresholds: {
        // Intentionally loose thresholds - we want chaos!
        http_req_failed: [`rate<${chaosConfig.thresholds.maxErrorRate}`],
        http_req_duration: [`p(95)<${chaosConfig.thresholds.p95ResponseTime}`],
    },
};

// Global array to store created book IDs
let createdBookIds = [];

// Scenario 0: Setup test data - creates books/authors to test with
export function setupTestData() {
    console.log("🚀 Setting up test data...");

    // Create books with varied data (amount from config)
    for (let i = 0; i < chaosConfig.dataSetup.numberOfBooks; i++) {
        const book = books[i % books.length];
        const response = http.post(
            `${BASE_URL}/api/v1/Books`,
            JSON.stringify({
                title: `${book.title} - Edition ${i + 1}`,
                author: book.author,
                isbn: `${book.isbn.substring(0, 10)}-${String(i).padStart(3, "0")}`,
                publishedDate: new Date(2020 + (i % 5), (i % 12), (i % 28) + 1).toISOString(),
                genre: ["Technology", "Science", "Business", "Fiction", "NonFiction"][i % 5],
                price: Math.round((10 + Math.random() * 90) * 100) / 100,
                stockQuantity: Math.floor(Math.random() * 100),
                description: `A comprehensive guide covering ${book.title}. This edition includes updated content and examples.`,
            }),
            {
                headers: { "Content-Type": "application/json" },
            }
        );

        if (response.status === 201) {
            const createdBook = JSON.parse(response.body);
            createdBookIds.push(createdBook.id);
        }
    }

    console.log(`✅ Created ${createdBookIds.length} books for testing`);

    // Prime the cache by reading some books
    for (let i = 0; i < 10; i++) {
        if (createdBookIds[i]) {
            http.get(`${BASE_URL}/api/v1/Books/${createdBookIds[i]}`);
        }
    }

    console.log("✅ Test data setup complete!");
}

// Helper: Inject random errors for TRUE CHAOS
function maybeInjectRandomError() {
    if (Math.random() < chaosConfig.behavior.randomErrorRate) {
        const randomErrors = [
            () =>
                http.post(`${BASE_URL}/api/v1/Books`, JSON.stringify({ bad: "data" }), {
                    headers: { "Content-Type": "application/json" },
                    tags: { injected_error: "400" },
                }),
            () =>
                http.get(`${BASE_URL}/api/v1/Books/999999999999999999999999`, {
                    tags: { injected_error: "404" },
                }),
            () =>
                http.post(
                    `${BASE_URL}/api/v1/Books`,
                    JSON.stringify({ title: "", author: "" }),
                    {
                        headers: { "Content-Type": "application/json" },
                        tags: { injected_error: "422" },
                    }
                ),
        ];
        const randomError = randomErrors[Math.floor(Math.random() * randomErrors.length)];
        randomError();
    }
}

// Scenario 1: Random chaotic requests - hits all CRUD operations
export function chaosRequests() {
    group("Chaos CRUD Operations", function () {
        const operations = [
            "listBooks",
            "createBook",
            "getBook",
            "updateBook",
            "deleteBook",
            "listAuthors",
            "searchBooks",
        ];

        // CHAOS: Maybe inject a random error before main operation
        maybeInjectRandomError();

        // Pick random operation
        const operation = operations[Math.floor(Math.random() * operations.length)];
        chaosOperations.add(1, { operation: operation });

        const startTime = Date.now();
        let response;

        switch (operation) {
            case "listBooks":
                // Random pagination
                const page = Math.floor(Math.random() * 10) + 1;
                const pageSize = Math.floor(Math.random() * 50) + 1;
                response = http.get(
                    `${BASE_URL}/api/v1/Books?page=${page}&pageSize=${pageSize}`,
                    {
                        tags: { chaos_op: "list_books" },
                    }
                );
                break;

            case "createBook":
                const book = books[Math.floor(Math.random() * books.length)];
                response = http.post(
                    `${BASE_URL}/api/v1/Books`,
                    JSON.stringify({
                        title: `${book.title} - ${Date.now()}`,
                        author: book.author,
                        isbn: `${book.isbn}-${Math.random().toString(36).substring(7)}`,
                        publishedDate: new Date().toISOString(),
                        genre: "Technology",
                    }),
                    {
                        headers: { "Content-Type": "application/json" },
                        tags: { chaos_op: "create_book" },
                    }
                );
                break;

            case "getBook":
                // Get a real book from our created list (uses config success rate)
                if (createdBookIds.length > 0 && Math.random() < chaosConfig.behavior.successRate) {
                    const bookId = createdBookIds[Math.floor(Math.random() * createdBookIds.length)];
                    response = http.get(`${BASE_URL}/api/v1/Books/${bookId}`, {
                        tags: { chaos_op: "get_book" },
                    });
                } else {
                    // Remaining % chance of 404
                    response = http.get(`${BASE_URL}/api/v1/Books/000000000000000000000000`, {
                        tags: { chaos_op: "get_book_404" },
                    });
                }
                break;

            case "updateBook":
                // Update a real book (uses config success rate)
                if (createdBookIds.length > 0 && Math.random() < chaosConfig.behavior.successRate) {
                    const updateId = createdBookIds[Math.floor(Math.random() * createdBookIds.length)];
                    response = http.put(
                        `${BASE_URL}/api/v1/Books/${updateId}`,
                        JSON.stringify({
                            title: `Updated - ${Date.now()}`,
                            author: "Chaos Author",
                            price: Math.round(Math.random() * 100 * 100) / 100,
                            stockQuantity: Math.floor(Math.random() * 200),
                        }),
                        {
                            headers: { "Content-Type": "application/json" },
                            tags: { chaos_op: "update_book" },
                        }
                    );
                } else {
                    // Remaining % chance of 404
                    response = http.put(
                        `${BASE_URL}/api/v1/Books/000000000000000000000000`,
                        JSON.stringify({ title: "Not Found" }),
                        {
                            headers: { "Content-Type": "application/json" },
                            tags: { chaos_op: "update_book_404" },
                        }
                    );
                }
                break;

            case "deleteBook":
                // Delete a real book occasionally (uses config delete rate)
                if (createdBookIds.length > chaosConfig.behavior.minBooksToKeep && Math.random() < chaosConfig.behavior.deleteRate) {
                    const deleteId = createdBookIds.pop(); // Remove from our list
                    response = http.del(`${BASE_URL}/api/v1/Books/${deleteId}`, null, {
                        tags: { chaos_op: "delete_book" },
                    });
                } else {
                    // Usually try to delete non-existent (404)
                    response = http.del(`${BASE_URL}/api/v1/Books/000000000000000000000000`, null, {
                        tags: { chaos_op: "delete_book_404" },
                    });
                }
                break;

            case "listAuthors":
                response = http.get(`${BASE_URL}/api/v1/Authors`, {
                    tags: { chaos_op: "list_authors" },
                });
                break;

            case "searchBooks":
                const searchTerms = ["chaos", "test", "engineering", "random"];
                const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];
                response = http.get(`${BASE_URL}/api/v1/Books?search=${term}`, {
                    tags: { chaos_op: "search_books" },
                });
                break;
        }

        const duration = Date.now() - startTime;
        responseTime.add(duration);

        if (response) {
            errorRate.add(response.status >= 400);
        }

        // Random sleep between 0.1s and 2s
        sleep(Math.random() * 1.9 + 0.1);
    });
}

// Scenario 2: LLM chaos - hits AI endpoints to generate cost metrics
export function llmChaos() {
    group("LLM Chaos", function () {
        // First, ensure we have a book to generate summaries for
        const createResponse = http.post(
            `${BASE_URL}/api/v1/Books`,
            JSON.stringify({
                title: `LLM Test Book ${Date.now()}`,
                author: "AI Tester",
                isbn: `978-${Math.random().toString().substring(2, 12)}`,
                publishedDate: new Date().toISOString(),
                genre: "Technology",
            }),
            {
                headers: { "Content-Type": "application/json" },
            }
        );

        if (createResponse.status === 201) {
            const bookId = JSON.parse(createResponse.body).id;

            // Generate summary with random provider
            const providers = ["ollama", "claude", "openai"];
            const provider = providers[Math.floor(Math.random() * providers.length)];

            const summaryResponse = http.post(
                `${BASE_URL}/api/v1/Books/${bookId}/generate-summary?provider=${provider}`,
                null,
                {
                    timeout: "30s",
                    tags: { chaos_op: "llm_summary", provider: provider },
                }
            );

            check(summaryResponse, {
                "LLM request processed": (r) => r.status === 200 || r.status === 500,
            });
        }

        sleep(Math.random() * 3 + 2); // 2-5 second sleep for LLM calls
    });
}

// Scenario 3: Error chaos - intentionally generates all error types
export function errorChaos() {
    group("Error Chaos", function () {
        const errorScenarios = [
            // 400 Bad Request
            () =>
                http.post(
                    `${BASE_URL}/api/v1/Books`,
                    JSON.stringify({ invalid: "data" }),
                    {
                        headers: { "Content-Type": "application/json" },
                        tags: { error_type: "400" },
                    }
                ),

            // 401 Unauthorized
            () =>
                http.get(`${BASE_URL}/api/v1/Books`, {
                    headers: { Authorization: "Bearer invalid_token" },
                    tags: { error_type: "401" },
                }),

            // 404 Not Found
            () =>
                http.get(`${BASE_URL}/api/v1/Books/000000000000000000000000`, {
                    tags: { error_type: "404" },
                }),

            // 409 Conflict (duplicate ISBN)
            () =>
                http.post(
                    `${BASE_URL}/api/v1/Books`,
                    JSON.stringify({
                        title: "Duplicate Book",
                        author: "Duplicate Author",
                        isbn: "978-DUPLICATE-ISBN",
                        publishedDate: new Date().toISOString(),
                    }),
                    {
                        headers: { "Content-Type": "application/json" },
                        tags: { error_type: "409" },
                    }
                ),

            // 422 Unprocessable Entity
            () =>
                http.post(
                    `${BASE_URL}/api/v1/Books`,
                    JSON.stringify({
                        title: "",
                        author: "",
                        isbn: "invalid",
                    }),
                    {
                        headers: { "Content-Type": "application/json" },
                        tags: { error_type: "422" },
                    }
                ),

            // 500 Internal Server Error (invalid LLM provider)
            () =>
                http.post(
                    `${BASE_URL}/api/v1/Books/507f1f77bcf86cd799439011/generate-summary?provider=invalid_provider`,
                    null,
                    {
                        tags: { error_type: "500" },
                    }
                ),
        ];

        // TRUE CHAOS: Execute multiple random errors simultaneously (from config)
        const { min, max } = chaosConfig.behavior.errorsPerIteration;
        const numErrors = Math.floor(Math.random() * (max - min + 1)) + min;
        const selectedErrors = [];

        // Randomly select which errors to fire (with duplicates possible for more chaos)
        for (let i = 0; i < numErrors; i++) {
            const randomIndex = Math.floor(Math.random() * errorScenarios.length);
            selectedErrors.push(errorScenarios[randomIndex]);
        }

        // Fire all selected errors with tiny random delays (chaos!)
        selectedErrors.forEach((errorFn) => {
            errorFn();
            sleep(Math.random() * 0.2); // 0-200ms between errors
        });

        sleep(Math.random() * 1 + 0.3);
    });
}

// Scenario 4: Memory pressure - creates lots of objects to stress GC
export function memoryPressure() {
    group("Memory Pressure", function () {
        // CHAOS: Random error injection
        maybeInjectRandomError();

        // Create many books rapidly to pressure memory/GC (from config)
        for (let i = 0; i < chaosConfig.memoryPressure.booksPerIteration; i++) {
            const response = http.post(
                `${BASE_URL}/api/v1/Books`,
                JSON.stringify({
                    title: `Memory Pressure Book ${Date.now()}-${i}`,
                    author: `Author ${Math.random().toString(36).substring(7)}`,
                    isbn: `978-${Math.random().toString().substring(2, 12)}`,
                    publishedDate: new Date().toISOString(),
                    genre: "Memory Test",
                    description: "A".repeat(1000), // Large description to use memory
                }),
                {
                    headers: { "Content-Type": "application/json" },
                    tags: { chaos_op: "memory_pressure" },
                }
            );
        }

        // Rapid fire GETs to trigger caching (from config)
        for (let i = 0; i < chaosConfig.memoryPressure.rapidGets; i++) {
            http.get(`${BASE_URL}/api/v1/Books?page=${i}&pageSize=100`, {
                tags: { chaos_op: "cache_pressure" },
            });
        }

        sleep(0.5);
    });
}

// Scenario 5: Database chaos - hammers MongoDB/Redis
export function databaseChaos() {
    group("Database Chaos", function () {
        // CHAOS: Random error injection
        maybeInjectRandomError();

        const operations = [
            // Heavy pagination (MongoDB stress)
            () => http.get(`${BASE_URL}/api/v1/Books?page=1&pageSize=1000`),

            // Create with complex data (MongoDB write stress)
            () =>
                http.post(
                    `${BASE_URL}/api/v1/Books`,
                    JSON.stringify({
                        title: `DB Chaos ${Date.now()}`,
                        author: "DB Tester",
                        isbn: `978-${Math.random().toString().substring(2, 12)}`,
                        publishedDate: new Date().toISOString(),
                        genre: "Database Testing",
                        tags: Array.from({ length: 50 }, (_, i) => `tag${i}`),
                    }),
                    { headers: { "Content-Type": "application/json" } }
                ),

            // Rapid cache hits (Redis stress) - use real books
            () => {
                if (createdBookIds.length > 0) {
                    const bookId = createdBookIds[Math.floor(Math.random() * createdBookIds.length)];
                    for (let i = 0; i < 5; i++) {
                        http.get(`${BASE_URL}/api/v1/Books/${bookId}`);
                    }
                }
            },

            // Author list (MongoDB query stress)
            () => http.get(`${BASE_URL}/api/v1/Authors`),
        ];

        const op = operations[Math.floor(Math.random() * operations.length)];
        op();

        sleep(Math.random() * 1.5);
    });
}

// Scenario 6: Connection pool chaos - fills connection pools and queues
export function connectionChaos() {
    group("Connection Pool Chaos", function () {
        // Fire multiple concurrent requests to fill connection pools
        // This tests: Kestrel connection metrics, queued connections, active requests
        const batchRequests = [];

        for (let i = 0; i < chaosConfig.connectionChaos.batchSize; i++) {
            // Use batch() to send parallel requests
            batchRequests.push(["GET", `${BASE_URL}/api/v1/Books?page=${i + 1}&pageSize=50`]);
            batchRequests.push(["GET", `${BASE_URL}/api/v1/Authors`]);
        }

        // Send all requests at once to saturate connections
        const responses = http.batch(batchRequests.map(req => ({
            method: req[0],
            url: req[1],
            params: {
                tags: { chaos_op: "connection_saturation" },
            },
        })));

        // Very short sleep to maintain pressure
        sleep(0.1);
    });
}

// Scenario 7: Thread pool chaos - creates blocking operations to stress thread pool
export function threadChaos() {
    group("Thread Pool Chaos", function () {
        const operations = [
            // Long-running list operations (blocks threads)
            () => http.get(`${BASE_URL}/api/v1/Books?page=1&pageSize=500`, {
                timeout: "15s",
                tags: { chaos_op: "thread_blocking" },
            }),

            // Multiple rapid small requests (thread pool churn, from config)
            () => {
                for (let i = 0; i < chaosConfig.threadChaos.rapidRequestCount; i++) {
                    http.get(`${BASE_URL}/api/v1/Books?page=${i + 1}&pageSize=10`, {
                        tags: { chaos_op: "thread_churn" },
                    });
                }
            },

            // Concurrent batch operations (tests thread pool queue, from config)
            () => {
                const batch = [];
                for (let i = 0; i < chaosConfig.threadChaos.batchRequestCount; i++) {
                    batch.push({
                        method: "GET",
                        url: `${BASE_URL}/api/v1/Books?page=${i + 1}`,
                        params: { tags: { chaos_op: "batch_threading" } },
                    });
                }
                http.batch(batch);
            },

            // Database + Cache combo (stresses both systems simultaneously)
            () => {
                if (createdBookIds.length > 0) {
                    const bookId = createdBookIds[Math.floor(Math.random() * createdBookIds.length)];
                    // First request hits database
                    http.get(`${BASE_URL}/api/v1/Books/${bookId}`);
                    // Second request should hit cache (tests cache read thread pool)
                    http.get(`${BASE_URL}/api/v1/Books/${bookId}`);
                }
            },
        ];

        const op = operations[Math.floor(Math.random() * operations.length)];
        op();

        sleep(Math.random() + 0.5);
    });
}
