// Chaos test using pre-generated variable data
// Combines all dashboard stressors with realistic, variable test data

import http from "k6/http";
import { sleep, check, group } from "k6";
import { SharedArray } from "k6/data";
import { Rate, Counter, Trend } from "k6/metrics";
import { chaosConfig } from "../config/chaos-config.js";

// Import utilities
const BASE_URL = __ENV.BASE_URL || "http://localhost:7002";

// ============================================================================
// GENERATED DATA - Load from C# Request Generator output
// ============================================================================

const generatedBooks = new SharedArray("books", function () {
    try {
        const data = JSON.parse(open("../../Tools/BookStore.Performance.RequestGenerator/test-data/books-bulk.json"));
        console.log(`✓ Loaded ${data.length} pre-generated books for chaos`);
        return data;
    } catch (e) {
        console.warn("⚠️  Could not load generated books, using fallback");
        return [
            {
                title: "Chaos Engineering",
                author: "Casey Rosenthal",
                isbn: "978-1-4920-4385-0",
                price: 49.99,
                genre: "Technology",
                description: "A guide to chaos engineering",
                stockQuantity: 100,
                publishedDate: "2024-01-01T00:00:00",
            },
        ];
    }
});

const generatedAuthors = new SharedArray("authors", function () {
    try {
        const data = JSON.parse(open("../../Tools/BookStore.Performance.RequestGenerator/test-data/authors-bulk.json"));
        console.log(`✓ Loaded ${data.length} pre-generated authors for chaos`);
        return data;
    } catch (e) {
        console.warn("⚠️  Could not load generated authors");
        return [
            {
                name: "Chaos Author",
                bio: "Expert in chaos engineering",
                nationality: "American",
                birthDate: "1980-01-01T00:00:00",
            },
        ];
    }
});

// Custom metrics
const errorRate = new Rate("errors");
const chaosOperations = new Counter("chaos_operations");
const responseTime = new Trend("chaos_response_time");

// Chaos test configuration
export const options = {
    scenarios: {
        // Scenario 0: Data setup
        data_setup: {
            executor: "shared-iterations",
            vus: 1,
            iterations: 1,
            maxDuration: chaosConfig.dataSetup.maxDuration,
            exec: "setupTestData",
            startTime: "0s",
        },

        // Scenario 1: Random user spikes
        random_spikes: {
            executor: "ramping-vus",
            startVUs: 1,
            stages: chaosConfig.randomSpikes.stages,
            gracefulRampDown: chaosConfig.randomSpikes.gracefulRampDown,
            exec: "chaosRequests",
            startTime: chaosConfig.randomSpikes.startTime,
        },

        // Scenario 2: Constant LLM load
        llm_bombardment: {
            executor: "constant-vus",
            vus: chaosConfig.llmBombardment.vus,
            duration: chaosConfig.llmBombardment.duration,
            exec: "llmChaos",
            startTime: chaosConfig.llmBombardment.startTime,
        },

        // Scenario 3: Error generator
        error_chaos: {
            executor: "constant-vus",
            vus: chaosConfig.errorChaos.vus,
            duration: chaosConfig.errorChaos.duration,
            exec: "errorChaos",
            startTime: chaosConfig.errorChaos.startTime,
        },

        // Scenario 4: Memory pressure
        memory_pressure: {
            executor: "constant-vus",
            vus: chaosConfig.memoryPressure.vus,
            duration: chaosConfig.memoryPressure.duration,
            exec: "memoryPressure",
            startTime: chaosConfig.memoryPressure.startTime,
        },

        // Scenario 5: Database hammering
        database_chaos: {
            executor: "ramping-vus",
            startVUs: 1,
            stages: chaosConfig.databaseChaos.stages,
            exec: "databaseChaos",
            startTime: chaosConfig.databaseChaos.startTime,
        },

        // Scenario 6: Connection pool chaos
        connection_chaos: {
            executor: "ramping-vus",
            startVUs: 1,
            stages: chaosConfig.connectionChaos.stages,
            exec: "connectionChaos",
            startTime: chaosConfig.connectionChaos.startTime,
        },

        // Scenario 7: Thread pool saturation
        thread_chaos: {
            executor: "constant-vus",
            vus: chaosConfig.threadChaos.vus,
            duration: chaosConfig.threadChaos.duration,
            exec: "threadChaos",
            startTime: chaosConfig.threadChaos.startTime,
        },
    },
    thresholds: {
        http_req_failed: [`rate<${chaosConfig.thresholds.maxErrorRate}`],
        http_req_duration: [`p(95)<${chaosConfig.thresholds.p95ResponseTime}`],
    },
};

// Global array to store created book IDs
let createdBookIds = [];

// Scenario 0: Setup with generated data
export function setupTestData() {
    console.log("🚀 Setting up test data with generated books/authors...");

    // Use bulk endpoint for faster setup
    const booksToCreate = generatedBooks.slice(0, Math.min(chaosConfig.dataSetup.numberOfBooks, generatedBooks.length));

    const bulkResponse = http.post(
        `${BASE_URL}/api/v1/Books/bulk`,
        JSON.stringify(booksToCreate.map((book, i) => ({
            ...book,
            title: `${book.title} - Chaos ${i + 1}`,
            isbn: `${book.isbn.substring(0, 10)}-${String(i).padStart(3, "0")}`,
        }))),
        {
            headers: { "Content-Type": "application/json" },
            timeout: "30s",
        }
    );

    if (bulkResponse.status === 200) {
        const result = JSON.parse(bulkResponse.body);
        createdBookIds = result.books.map(b => b.id);
        console.log(`✅ Created ${createdBookIds.length} books via bulk endpoint`);
    } else {
        console.warn(`⚠️  Bulk creation failed, falling back to individual creates`);
        // Fallback to individual creates
        for (let i = 0; i < Math.min(20, booksToCreate.length); i++) {
            const book = booksToCreate[i];
            const response = http.post(
                `${BASE_URL}/api/v1/Books`,
                JSON.stringify({
                    ...book,
                    title: `${book.title} - Chaos ${i + 1}`,
                }),
                { headers: { "Content-Type": "application/json" } }
            );

            if (response.status === 201) {
                createdBookIds.push(JSON.parse(response.body).id);
            }
        }
    }

    // Prime the cache
    for (let i = 0; i < Math.min(10, createdBookIds.length); i++) {
        http.get(`${BASE_URL}/api/v1/Books/${createdBookIds[i]}`);
    }

    console.log("✅ Test data setup complete!");
}

// Scenario 1: Random chaotic requests with generated data
export function chaosRequests() {
    group("Chaos CRUD Operations", function () {
        const operations = ["listBooks", "createBook", "getBook", "updateBook", "deleteBook", "searchBooks"];
        const operation = operations[Math.floor(Math.random() * operations.length)];

        chaosOperations.add(1, { operation: operation });

        const startTime = Date.now();
        let response;

        // Use generated data for operations
        const bookIndex = Math.floor(Math.random() * generatedBooks.length);
        const book = generatedBooks[bookIndex];

        switch (operation) {
            case "listBooks":
                response = http.get(`${BASE_URL}/api/v1/Books?page=${Math.floor(Math.random() * 10) + 1}&pageSize=${Math.floor(Math.random() * 50) + 1}`);
                break;

            case "createBook":
                response = http.post(
                    `${BASE_URL}/api/v1/Books`,
                    JSON.stringify({
                        ...book,
                        title: `${book.title} - ${Date.now()}`,
                        isbn: `${book.isbn}-${Math.random().toString(36).substring(7)}`,
                    }),
                    { headers: { "Content-Type": "application/json" } }
                );
                break;

            case "getBook":
                if (createdBookIds.length > 0 && Math.random() < chaosConfig.behavior.successRate) {
                    const bookId = createdBookIds[Math.floor(Math.random() * createdBookIds.length)];
                    response = http.get(`${BASE_URL}/api/v1/Books/${bookId}`);
                } else {
                    response = http.get(`${BASE_URL}/api/v1/Books/000000000000000000000000`);
                }
                break;

            case "updateBook":
                if (createdBookIds.length > 0 && Math.random() < chaosConfig.behavior.successRate) {
                    const updateId = createdBookIds[Math.floor(Math.random() * createdBookIds.length)];
                    response = http.patch(
                        `${BASE_URL}/api/v1/Books/${updateId}`,
                        JSON.stringify({
                            price: parseFloat((book.price * (1 + Math.random())).toFixed(2)),
                            stockQuantity: Math.floor(Math.random() * 200),
                        }),
                        { headers: { "Content-Type": "application/json" } }
                    );
                } else {
                    response = http.put(`${BASE_URL}/api/v1/Books/000000000000000000000000`, JSON.stringify({ title: "Not Found" }), {
                        headers: { "Content-Type": "application/json" },
                    });
                }
                break;

            case "deleteBook":
                if (createdBookIds.length > chaosConfig.behavior.minBooksToKeep && Math.random() < chaosConfig.behavior.deleteRate) {
                    const deleteId = createdBookIds.pop();
                    response = http.del(`${BASE_URL}/api/v1/Books/${deleteId}`);
                } else {
                    response = http.del(`${BASE_URL}/api/v1/Books/000000000000000000000000`);
                }
                break;

            case "searchBooks":
                response = http.get(`${BASE_URL}/api/v1/Books?genre=${book.genre}&page=1&pageSize=10`);
                break;
        }

        const duration = Date.now() - startTime;
        responseTime.add(duration);

        if (response) {
            errorRate.add(response.status >= 400);
        }

        sleep(Math.random() * 1.9 + 0.1);
    });
}

// Scenario 2: LLM chaos with generated data
export function llmChaos() {
    group("LLM Chaos", function () {
        const bookIndex = Math.floor(Math.random() * generatedBooks.length);
        const book = generatedBooks[bookIndex];

        const createResponse = http.post(
            `${BASE_URL}/api/v1/Books`,
            JSON.stringify({
                ...book,
                title: `LLM Test - ${book.title} ${Date.now()}`,
            }),
            { headers: { "Content-Type": "application/json" } }
        );

        if (createResponse.status === 201) {
            const bookId = JSON.parse(createResponse.body).id;
            const providers = ["ollama", "claude", "openai"];
            const provider = providers[Math.floor(Math.random() * providers.length)];

            http.post(`${BASE_URL}/api/v1/Books/${bookId}/generate-summary?provider=${provider}`, null, {
                timeout: "30s",
                tags: { chaos_op: "llm_summary", provider: provider },
            });
        }

        sleep(Math.random() * 3 + 2);
    });
}

// Scenario 3: Error chaos
export function errorChaos() {
    group("Error Chaos", function () {
        const errorCodes = [400, 401, 403, 404, 405, 409, 410, 415, 422, 429, 500, 502, 503, 504];
        const { min, max } = chaosConfig.behavior.errorsPerIteration;
        const numErrors = Math.floor(Math.random() * (max - min + 1)) + min;

        for (let i = 0; i < numErrors; i++) {
            const errorCode = errorCodes[Math.floor(Math.random() * errorCodes.length)];
            http.get(`${BASE_URL}/api/v1/ErrorTest/${errorCode}`, {
                tags: { error_type: errorCode.toString() },
            });
            sleep(Math.random() * 0.2);
        }

        sleep(Math.random() * 1 + 0.3);
    });
}

// Scenario 4: Memory pressure with generated data
export function memoryPressure() {
    group("Memory Pressure", function () {
        // Create books rapidly using generated data
        const booksToCreate = [];
        for (let i = 0; i < chaosConfig.memoryPressure.booksPerIteration; i++) {
            const bookIndex = Math.floor(Math.random() * generatedBooks.length);
            const book = generatedBooks[bookIndex];
            booksToCreate.push({
                ...book,
                title: `${book.title} - Memory ${Date.now()}-${i}`,
                description: book.description + "X".repeat(1000), // Large description
            });
        }

        // Use bulk endpoint for memory pressure
        http.post(`${BASE_URL}/api/v1/Books/bulk`, JSON.stringify(booksToCreate), {
            headers: { "Content-Type": "application/json" },
            tags: { chaos_op: "memory_pressure_bulk" },
        });

        // Rapid fire GETs
        for (let i = 0; i < chaosConfig.memoryPressure.rapidGets; i++) {
            http.get(`${BASE_URL}/api/v1/Books?page=${i}&pageSize=100`);
        }

        sleep(0.5);
    });
}

// Scenario 5: Database chaos
export function databaseChaos() {
    group("Database Chaos", function () {
        const operations = [
            () => http.get(`${BASE_URL}/api/v1/Books?page=1&pageSize=1000`),
            () => {
                const bookIndex = Math.floor(Math.random() * generatedBooks.length);
                const book = generatedBooks[bookIndex];
                http.post(
                    `${BASE_URL}/api/v1/Books`,
                    JSON.stringify({
                        ...book,
                        title: `DB Chaos - ${book.title} ${Date.now()}`,
                    }),
                    { headers: { "Content-Type": "application/json" } }
                );
            },
            () => {
                if (createdBookIds.length > 0) {
                    const bookId = createdBookIds[Math.floor(Math.random() * createdBookIds.length)];
                    for (let i = 0; i < 5; i++) {
                        http.get(`${BASE_URL}/api/v1/Books/${bookId}`);
                    }
                }
            },
        ];

        operations[Math.floor(Math.random() * operations.length)]();
        sleep(Math.random() * 1.5);
    });
}

// Scenario 6: Connection pool chaos
export function connectionChaos() {
    group("Connection Pool Chaos", function () {
        const batchRequests = [];

        for (let i = 0; i < chaosConfig.connectionChaos.batchSize; i++) {
            batchRequests.push({
                method: "GET",
                url: `${BASE_URL}/api/v1/Books?page=${i + 1}&pageSize=50`,
                params: { tags: { chaos_op: "connection_saturation" } },
            });
        }

        http.batch(batchRequests);
        sleep(0.1);
    });
}

// Scenario 7: Thread pool chaos
export function threadChaos() {
    group("Thread Pool Chaos", function () {
        const operations = [
            () => http.get(`${BASE_URL}/api/v1/Books?page=1&pageSize=500`, { timeout: "15s" }),
            () => {
                for (let i = 0; i < chaosConfig.threadChaos.rapidRequestCount; i++) {
                    http.get(`${BASE_URL}/api/v1/Books?page=${i + 1}&pageSize=10`);
                }
            },
            () => {
                const batch = [];
                for (let i = 0; i < chaosConfig.threadChaos.batchRequestCount; i++) {
                    batch.push({
                        method: "GET",
                        url: `${BASE_URL}/api/v1/Books?page=${i + 1}`,
                    });
                }
                http.batch(batch);
            },
        ];

        operations[Math.floor(Math.random() * operations.length)]();
        sleep(Math.random() + 0.5);
    });
}
