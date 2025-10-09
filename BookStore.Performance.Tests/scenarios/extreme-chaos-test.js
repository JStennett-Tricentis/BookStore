import http from "k6/http";
import { sleep, check, group } from "k6";
import { SharedArray } from "k6/data";
import { Rate, Counter, Trend } from "k6/metrics";
import { extremeChaosConfig } from "../config/extreme-chaos-config.js";

// Import utilities
const BASE_URL = __ENV.BASE_URL || "http://localhost:7002";

// Custom metrics
const errorRate = new Rate("errors");
const chaosOperations = new Counter("chaos_operations");
const responseTime = new Trend("chaos_response_time");
const systemBreakage = new Counter("system_breakage"); // Track complete failures

// Load test data
const books = new SharedArray("books", function () {
    return [
        { title: "Extreme Chaos Engineering", author: "Casey Rosenthal", isbn: "9781492043850" },
        { title: "The Phoenix Project", author: "Gene Kim", isbn: "9780988262508" },
        { title: "Site Reliability Engineering", author: "Betsy Beyer", isbn: "9781491929124" },
        { title: "Chaos Monkeys", author: "Antonio García Martínez", isbn: "9780062458193" },
        { title: "Release It!", author: "Michael Nygard", isbn: "9781680502398" },
    ];
});

// EXTREME Chaos test configuration
export const options = {
    scenarios: {
        // Scenario 0: Data setup - massive initial dataset
        data_setup: {
            executor: "shared-iterations",
            vus: 1,
            iterations: 1,
            maxDuration: extremeChaosConfig.dataSetup.maxDuration,
            exec: "setupTestData",
            startTime: "0s",
        },

        // Scenario 1: EXTREME random spikes (500+ VUs)
        random_spikes: {
            executor: "ramping-vus",
            startVUs: 1,
            stages: extremeChaosConfig.randomSpikes.stages,
            gracefulRampDown: extremeChaosConfig.randomSpikes.gracefulRampDown,
            exec: "extremeChaosRequests",
            startTime: extremeChaosConfig.randomSpikes.startTime,
        },

        // Scenario 2: MASSIVE LLM bombardment
        llm_bombardment: {
            executor: "constant-vus",
            vus: extremeChaosConfig.llmBombardment.vus,
            duration: extremeChaosConfig.llmBombardment.duration,
            exec: "extremeLLMChaos",
            startTime: extremeChaosConfig.llmBombardment.startTime,
        },

        // Scenario 3: Error flood - testing error handling limits
        error_chaos: {
            executor: "constant-vus",
            vus: extremeChaosConfig.errorChaos.vus,
            duration: extremeChaosConfig.errorChaos.duration,
            exec: "extremeErrorChaos",
            startTime: extremeChaosConfig.errorChaos.startTime,
        },

        // Scenario 4: EXTREME memory pressure
        memory_pressure: {
            executor: "constant-vus",
            vus: extremeChaosConfig.memoryPressure.vus,
            duration: extremeChaosConfig.memoryPressure.duration,
            exec: "extremeMemoryPressure",
            startTime: extremeChaosConfig.memoryPressure.startTime,
        },

        // Scenario 5: Database flooding
        database_chaos: {
            executor: "ramping-vus",
            startVUs: 1,
            stages: extremeChaosConfig.databaseChaos.stages,
            exec: "extremeDatabaseChaos",
            startTime: extremeChaosConfig.databaseChaos.startTime,
        },

        // Scenario 6: Connection pool exhaustion (700 VUs!)
        connection_chaos: {
            executor: "ramping-vus",
            startVUs: 1,
            stages: extremeChaosConfig.connectionChaos.stages,
            exec: "extremeConnectionChaos",
            startTime: extremeChaosConfig.connectionChaos.startTime,
        },

        // Scenario 7: Thread pool destruction
        thread_chaos: {
            executor: "constant-vus",
            vus: extremeChaosConfig.threadChaos.vus,
            duration: extremeChaosConfig.threadChaos.duration,
            exec: "extremeThreadChaos",
            startTime: extremeChaosConfig.threadChaos.startTime,
        },
    },
    thresholds: {
        // EXTREME thresholds - we expect massive failures
        http_req_failed: [`rate<${extremeChaosConfig.thresholds.maxErrorRate}`],
        http_req_duration: [`p(95)<${extremeChaosConfig.thresholds.p95ResponseTime}`],
    },
};

// Global array to store created book IDs
let createdBookIds = [];

// Scenario 0: Setup MASSIVE test data
export function setupTestData() {
    console.log("🔥 EXTREME CHAOS: Setting up massive test dataset...");

    // Create tons of books
    for (let i = 0; i < extremeChaosConfig.dataSetup.numberOfBooks; i++) {
        const book = books[i % books.length];
        const response = http.post(
            `${BASE_URL}/api/v1/Books`,
            JSON.stringify({
                title: `${book.title} - Extreme Edition ${i + 1}`,
                author: book.author,
                isbn: `${book.isbn.substring(0, 10)}-${String(i).padStart(4, "0")}`,
                publishedDate: new Date(2020 + (i % 5), (i % 12), (i % 28) + 1).toISOString(),
                genre: ["Technology", "Science", "Business", "Fiction", "Chaos"][i % 5],
                price: Math.round((10 + Math.random() * 190) * 100) / 100,
                stockQuantity: Math.floor(Math.random() * 500),
                description: `EXTREME: ${book.title}. This edition is designed for extreme stress testing and chaos engineering. Contains comprehensive examples and extreme load scenarios.`,
            }),
            {
                headers: { "Content-Type": "application/json" },
                timeout: "30s",
            }
        );

        if (response.status === 201) {
            const createdBook = JSON.parse(response.body);
            createdBookIds.push(createdBook.id);
        }

        // Brief pause every 50 books
        if (i % 50 === 0 && i > 0) {
            sleep(0.1);
        }
    }

    console.log(`✅ EXTREME: Created ${createdBookIds.length} books for stress testing`);
}

// Helper: Inject EXTREME random errors
function maybeInjectExtremeRandomError() {
    if (Math.random() < extremeChaosConfig.behavior.randomErrorRate) {
        const errorCodes = [400, 401, 403, 404, 405, 409, 410, 415, 422, 429, 500, 502, 503, 504];
        const randomCode = errorCodes[Math.floor(Math.random() * errorCodes.length)];

        try {
            http.get(`${BASE_URL}/api/v1/ErrorTest/${randomCode}`, {
                tags: { injected_error: randomCode.toString() },
                timeout: "5s",
            });
        } catch (e) {
            systemBreakage.add(1, { reason: "error_endpoint_unreachable" });
        }
    }
}

// Scenario 1: EXTREME chaotic requests
export function extremeChaosRequests() {
    group("EXTREME Chaos CRUD", function () {
        const operations = ["listBooks", "createBook", "getBook", "updateBook", "deleteBook", "listAuthors", "searchBooks"];

        // Inject errors frequently
        maybeInjectExtremeRandomError();

        const operation = operations[Math.floor(Math.random() * operations.length)];
        chaosOperations.add(1, { operation: operation });

        const startTime = Date.now();
        let response;

        try {
            switch (operation) {
                case "listBooks":
                    const page = Math.floor(Math.random() * 20) + 1;
                    const pageSize = Math.floor(Math.random() * 100) + 1;
                    response = http.get(`${BASE_URL}/api/v1/Books?page=${page}&pageSize=${pageSize}`, {
                        tags: { extreme_op: "list_books" },
                        timeout: "10s",
                    });
                    break;

                case "createBook":
                    const book = books[Math.floor(Math.random() * books.length)];
                    response = http.post(
                        `${BASE_URL}/api/v1/Books`,
                        JSON.stringify({
                            title: `${book.title} - EXTREME ${Date.now()}`,
                            author: book.author,
                            isbn: `${book.isbn}-${Math.random().toString(36).substring(7)}`,
                            publishedDate: new Date().toISOString(),
                            genre: "Extreme",
                            description: "X".repeat(2000), // Large payload
                        }),
                        {
                            headers: { "Content-Type": "application/json" },
                            tags: { extreme_op: "create_book" },
                            timeout: "10s",
                        }
                    );
                    break;

                case "getBook":
                    if (createdBookIds.length > 0 && Math.random() < extremeChaosConfig.behavior.successRate) {
                        const bookId = createdBookIds[Math.floor(Math.random() * createdBookIds.length)];
                        response = http.get(`${BASE_URL}/api/v1/Books/${bookId}`, {
                            tags: { extreme_op: "get_book" },
                            timeout: "10s",
                        });
                    } else {
                        response = http.get(`${BASE_URL}/api/v1/Books/000000000000000000000000`, {
                            tags: { extreme_op: "get_book_404" },
                            timeout: "10s",
                        });
                    }
                    break;

                case "updateBook":
                    if (createdBookIds.length > 0 && Math.random() < extremeChaosConfig.behavior.successRate) {
                        const updateId = createdBookIds[Math.floor(Math.random() * createdBookIds.length)];
                        response = http.put(
                            `${BASE_URL}/api/v1/Books/${updateId}`,
                            JSON.stringify({
                                title: `EXTREME Updated - ${Date.now()}`,
                                author: "Extreme Chaos Author",
                                price: Math.round(Math.random() * 500 * 100) / 100,
                                stockQuantity: Math.floor(Math.random() * 1000),
                            }),
                            {
                                headers: { "Content-Type": "application/json" },
                                tags: { extreme_op: "update_book" },
                                timeout: "10s",
                            }
                        );
                    } else {
                        response = http.put(
                            `${BASE_URL}/api/v1/Books/000000000000000000000000`,
                            JSON.stringify({ title: "Not Found" }),
                            {
                                headers: { "Content-Type": "application/json" },
                                tags: { extreme_op: "update_book_404" },
                                timeout: "10s",
                            }
                        );
                    }
                    break;

                case "deleteBook":
                    if (createdBookIds.length > extremeChaosConfig.behavior.minBooksToKeep &&
                        Math.random() < extremeChaosConfig.behavior.deleteRate) {
                        const deleteId = createdBookIds.pop();
                        response = http.del(`${BASE_URL}/api/v1/Books/${deleteId}`, null, {
                            tags: { extreme_op: "delete_book" },
                            timeout: "10s",
                        });
                    } else {
                        response = http.del(`${BASE_URL}/api/v1/Books/000000000000000000000000`, null, {
                            tags: { extreme_op: "delete_book_404" },
                            timeout: "10s",
                        });
                    }
                    break;

                case "listAuthors":
                    response = http.get(`${BASE_URL}/api/v1/Authors`, {
                        tags: { extreme_op: "list_authors" },
                        timeout: "10s",
                    });
                    break;

                case "searchBooks":
                    const searchTerms = ["extreme", "chaos", "test", "stress", "breaking"];
                    const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];
                    response = http.get(`${BASE_URL}/api/v1/Books?search=${term}`, {
                        tags: { extreme_op: "search_books" },
                        timeout: "10s",
                    });
                    break;
            }

            const duration = Date.now() - startTime;
            responseTime.add(duration);

            if (response) {
                errorRate.add(response.status >= 400);

                // Track complete system breakage
                if (response.status === 0 || response.status >= 500) {
                    systemBreakage.add(1, { status_code: response.status.toString() });
                }
            }
        } catch (e) {
            errorRate.add(1);
            systemBreakage.add(1, { reason: "request_exception" });
        }

        // Very short sleep - keep the pressure on!
        sleep(Math.random() * 0.5 + 0.05);
    });
}

// Scenario 2: EXTREME LLM chaos
export function extremeLLMChaos() {
    group("EXTREME LLM Chaos", function () {
        try {
            const createResponse = http.post(
                `${BASE_URL}/api/v1/Books`,
                JSON.stringify({
                    title: `EXTREME LLM Test ${Date.now()}`,
                    author: "AI Stress Tester",
                    isbn: `978-${Math.random().toString().substring(2, 12)}`,
                    publishedDate: new Date().toISOString(),
                    genre: "AI Testing",
                    description: "A".repeat(3000), // Large description for heavy processing
                }),
                {
                    headers: { "Content-Type": "application/json" },
                    timeout: "15s",
                }
            );

            if (createResponse.status === 201) {
                const bookId = JSON.parse(createResponse.body).id;
                const providers = ["ollama", "claude", "openai"];
                const provider = providers[Math.floor(Math.random() * providers.length)];

                const summaryResponse = http.post(
                    `${BASE_URL}/api/v1/Books/${bookId}/generate-summary?provider=${provider}`,
                    null,
                    {
                        timeout: "60s", // LLM needs time even under stress
                        tags: { extreme_op: "llm_summary", provider: provider },
                    }
                );

                if (summaryResponse.status >= 500) {
                    systemBreakage.add(1, { reason: "llm_failure" });
                }
            }
        } catch (e) {
            systemBreakage.add(1, { reason: "llm_exception" });
        }

        sleep(Math.random() * 2 + 1); // 1-3 second sleep
    });
}

// Scenario 3: EXTREME error chaos
export function extremeErrorChaos() {
    group("EXTREME Error Chaos", function () {
        const errorScenarios = [
            () => http.get(`${BASE_URL}/api/v1/ErrorTest/400`, { tags: { error_type: "400" }, timeout: "5s" }),
            () => http.get(`${BASE_URL}/api/v1/ErrorTest/401`, { tags: { error_type: "401" }, timeout: "5s" }),
            () => http.get(`${BASE_URL}/api/v1/ErrorTest/403`, { tags: { error_type: "403" }, timeout: "5s" }),
            () => http.get(`${BASE_URL}/api/v1/ErrorTest/404`, { tags: { error_type: "404" }, timeout: "5s" }),
            () => http.get(`${BASE_URL}/api/v1/ErrorTest/500`, { tags: { error_type: "500" }, timeout: "5s" }),
            () => http.get(`${BASE_URL}/api/v1/ErrorTest/503`, { tags: { error_type: "503" }, timeout: "5s" }),
            () => http.get(`${BASE_URL}/api/v1/ErrorTest/random`, { tags: { error_type: "random" }, timeout: "5s" }),
        ];

        // Fire TONS of errors
        const { min, max } = extremeChaosConfig.behavior.errorsPerIteration;
        const numErrors = Math.floor(Math.random() * (max - min + 1)) + min;

        for (let i = 0; i < numErrors; i++) {
            const randomIndex = Math.floor(Math.random() * errorScenarios.length);
            try {
                errorScenarios[randomIndex]();
            } catch (e) {
                // System might be breaking - track it
                systemBreakage.add(1, { reason: "error_chaos_exception" });
            }
            sleep(Math.random() * 0.1); // Minimal sleep - flood with errors!
        }

        sleep(Math.random() * 0.5);
    });
}

// Scenario 4: EXTREME memory pressure
export function extremeMemoryPressure() {
    group("EXTREME Memory Pressure", function () {
        maybeInjectExtremeRandomError();

        // Create TONS of objects rapidly
        for (let i = 0; i < extremeChaosConfig.memoryPressure.booksPerIteration; i++) {
            try {
                http.post(
                    `${BASE_URL}/api/v1/Books`,
                    JSON.stringify({
                        title: `Memory Killer ${Date.now()}-${i}`,
                        author: `Author ${Math.random().toString(36).substring(7)}`,
                        isbn: `978-${Math.random().toString().substring(2, 12)}`,
                        publishedDate: new Date().toISOString(),
                        genre: "Memory Test",
                        description: "M".repeat(5000), // HUGE description
                    }),
                    {
                        headers: { "Content-Type": "application/json" },
                        tags: { extreme_op: "memory_pressure" },
                        timeout: "10s",
                    }
                );
            } catch (e) {
                systemBreakage.add(1, { reason: "memory_pressure_failure" });
            }
        }

        // Rapid fire GETs to slam cache
        for (let i = 0; i < extremeChaosConfig.memoryPressure.rapidGets; i++) {
            try {
                http.get(`${BASE_URL}/api/v1/Books?page=${i}&pageSize=200`, {
                    tags: { extreme_op: "cache_flood" },
                    timeout: "10s",
                });
            } catch (e) {
                systemBreakage.add(1, { reason: "cache_flood_failure" });
            }
        }

        sleep(0.2);
    });
}

// Scenario 5: EXTREME database chaos
export function extremeDatabaseChaos() {
    group("EXTREME Database Chaos", function () {
        maybeInjectExtremeRandomError();

        const operations = [
            () => http.get(`${BASE_URL}/api/v1/Books?page=1&pageSize=2000`, { timeout: "20s" }),
            () =>
                http.post(
                    `${BASE_URL}/api/v1/Books`,
                    JSON.stringify({
                        title: `DB Killer ${Date.now()}`,
                        author: "DB Tester",
                        isbn: `978-${Math.random().toString().substring(2, 12)}`,
                        publishedDate: new Date().toISOString(),
                        genre: "Database Flooding",
                        tags: Array.from({ length: 100 }, (_, i) => `tag${i}`),
                    }),
                    { headers: { "Content-Type": "application/json" }, timeout: "15s" }
                ),
            () => {
                if (createdBookIds.length > 0) {
                    const bookId = createdBookIds[Math.floor(Math.random() * createdBookIds.length)];
                    for (let i = 0; i < 10; i++) {
                        try {
                            http.get(`${BASE_URL}/api/v1/Books/${bookId}`, { timeout: "5s" });
                        } catch (e) {}
                    }
                }
            },
        ];

        try {
            const op = operations[Math.floor(Math.random() * operations.length)];
            op();
        } catch (e) {
            systemBreakage.add(1, { reason: "database_chaos_failure" });
        }

        sleep(Math.random());
    });
}

// Scenario 6: EXTREME connection chaos
export function extremeConnectionChaos() {
    group("EXTREME Connection Chaos", function () {
        const batchRequests = [];

        for (let i = 0; i < extremeChaosConfig.connectionChaos.batchSize; i++) {
            batchRequests.push({
                method: "GET",
                url: `${BASE_URL}/api/v1/Books?page=${i + 1}&pageSize=100`,
                params: {
                    tags: { extreme_op: "connection_flood" },
                    timeout: "15s",
                },
            });
        }

        try {
            http.batch(batchRequests);
        } catch (e) {
            systemBreakage.add(1, { reason: "connection_saturation" });
        }

        sleep(0.05); // Minimal sleep - keep connections saturated!
    });
}

// Scenario 7: EXTREME thread chaos
export function extremeThreadChaos() {
    group("EXTREME Thread Chaos", function () {
        const operations = [
            () => http.get(`${BASE_URL}/api/v1/Books?page=1&pageSize=1000`, {
                timeout: "30s",
                tags: { extreme_op: "thread_blocking" },
            }),
            () => {
                for (let i = 0; i < extremeChaosConfig.threadChaos.rapidRequestCount; i++) {
                    try {
                        http.get(`${BASE_URL}/api/v1/Books?page=${i + 1}&pageSize=20`, {
                            tags: { extreme_op: "thread_churn" },
                            timeout: "5s",
                        });
                    } catch (e) {}
                }
            },
            () => {
                const batch = [];
                for (let i = 0; i < extremeChaosConfig.threadChaos.batchRequestCount; i++) {
                    batch.push({
                        method: "GET",
                        url: `${BASE_URL}/api/v1/Books?page=${i + 1}`,
                        params: { tags: { extreme_op: "batch_threading" }, timeout: "10s" },
                    });
                }
                try {
                    http.batch(batch);
                } catch (e) {
                    systemBreakage.add(1, { reason: "thread_pool_saturation" });
                }
            },
        ];

        try {
            const op = operations[Math.floor(Math.random() * operations.length)];
            op();
        } catch (e) {
            systemBreakage.add(1, { reason: "thread_chaos_failure" });
        }

        sleep(Math.random() * 0.5);
    });
}
