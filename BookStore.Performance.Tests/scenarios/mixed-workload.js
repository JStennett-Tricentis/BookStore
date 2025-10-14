// Mixed workload scenario: Traditional CRUD + AI operations
// This test simulates realistic production traffic patterns with both types of operations

import { check, group, sleep } from "k6";
import http from "k6/http";
import { Rate, Trend, Counter, Gauge } from "k6/metrics";
import { randomIntBetween, randomItem } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

import { getEnvironment } from "../config/environments.js";
import { getThresholds } from "../config/thresholds.js";
import {
    getStages,
    getGracefulRampDown,
    getLLMPercentage,
    getAIEnabledUsers,
    getScenarioThresholds,
} from "../config/test-scenarios.js";
import { generateBookData, generateUserProfile } from "../utils/data-generators.js";
import { checkResponse, checkCreateResponse } from "../utils/assertions.js";

// Custom metrics
const crudErrorRate = new Rate("crud_errors");
const llmErrorRate = new Rate("llm_errors");
const crudResponseTime = new Trend("crud_response_time", true);
const llmResponseTime = new Trend("llm_response_time", true);
const totalOperations = new Counter("total_operations");
const llmOperations = new Counter("llm_operations");
const crudOperations = new Counter("crud_operations");
const activeUsers = new Gauge("active_users");
const systemLoad = new Gauge("system_load");

// Configuration
const environment = getEnvironment();
const scenario = __ENV.SCENARIO || "mixed";

// Workload distribution (from config or environment variables)
const LLM_TRAFFIC_PERCENTAGE = parseFloat(__ENV.LLM_PERCENTAGE) || getLLMPercentage(scenario);
const AI_ENABLED_USER_PERCENTAGE = parseFloat(__ENV.AI_USERS) || getAIEnabledUsers(scenario);

export const options = {
    scenarios: {
        // Realistic mixed workload
        mixed_workload: {
            executor: "ramping-vus",
            startVUs: 0,
            stages: getStages(scenario),
            gracefulRampDown: getGracefulRampDown(scenario),
        },
    },
    thresholds: getScenarioThresholds(scenario) || {
        // Default mixed workload thresholds if not in config
        crud_response_time: ["p(95)<1000", "p(99)<2000"],
        crud_errors: ["rate<0.01"],
        llm_response_time: ["p(95)<8000", "p(99)<12000"],
        llm_errors: ["rate<0.05"],
        http_req_duration: ["p(95)<5000", "p(99)<10000"],
        http_req_failed: ["rate<0.02"],
    },
    summaryTrendStats: ["avg", "min", "med", "max", "p(90)", "p(95)", "p(99)"],
};

export function setup() {
    console.log("=== Mixed Workload Test Configuration ===");
    console.log(`Environment: ${environment.name}`);
    console.log(`Service URL: ${environment.serviceUrl}`);
    console.log(`LLM Traffic: ${LLM_TRAFFIC_PERCENTAGE}%`);
    console.log(`AI-Enabled Users: ${AI_ENABLED_USER_PERCENTAGE}%`);
    console.log("==========================================");

    // Health check
    const healthResponse = http.get(`${environment.serviceUrl}/health`);
    if (healthResponse.status !== 200) {
        throw new Error(`Service health check failed: ${healthResponse.status}`);
    }

    // Seed data
    console.log("Seeding test data...");
    const seedResponse = http.post(`${environment.serviceUrl}/seed-data`, null, {
        timeout: "30s",
    });
    if (seedResponse.status !== 200) {
        console.warn("Failed to seed data, continuing with existing data");
    }

    // Get book IDs
    const booksResponse = http.get(`${environment.serviceUrl}/api/v1/Books?page=1&pageSize=50`);
    let bookIds = [];
    if (booksResponse.status === 200) {
        const responseData = JSON.parse(booksResponse.body);
        const books = responseData.books || responseData; // Support both old and new response format
        bookIds = books.map((book) => book.id);
        console.log(`✓ Found ${bookIds.length} books for testing`);
    }

    console.log("✓ Mixed workload test setup completed");
    return {
        startTime: new Date(),
        bookIds: bookIds,
        baseUrl: environment.serviceUrl,
    };
}

export default function (data) {
    activeUsers.add(1);

    const userProfile = generateUserProfile(__VU);
    const baseUrl = data.baseUrl;
    const bookIds = data.bookIds;

    // Determine if this user has AI features enabled
    const isAiEnabledUser = Math.random() * 100 < AI_ENABLED_USER_PERCENTAGE;

    // Execute mixed workload based on user profile
    group("Mixed Operations", function () {
        executeMixedWorkload(baseUrl, bookIds, userProfile, isAiEnabledUser);
    });

    // Think time
    const thinkTime = getThinkTime(userProfile.usagePattern);
    sleep(thinkTime);

    activeUsers.add(-1);
}

function executeMixedWorkload(baseUrl, bookIds, userProfile, isAiEnabled) {
    // Weight-based operation selection
    const operations = getOperationsForUser(userProfile, isAiEnabled);
    const selectedOp = selectWeightedOperation(operations);

    switch (selectedOp.type) {
        case "browse_books":
            browseBooksWithAi(baseUrl, bookIds, isAiEnabled);
            break;
        case "search_books":
            searchBooks(baseUrl);
            break;
        case "create_book":
            createBook(baseUrl);
            break;
        case "update_book":
            updateBook(baseUrl, bookIds);
            break;
        case "generate_summary":
            generateAiSummary(baseUrl, bookIds);
            break;
        case "bulk_summaries":
            bulkGenerateSummaries(baseUrl, bookIds);
            break;
        default:
            browseBooksWithAi(baseUrl, bookIds, isAiEnabled);
    }

    totalOperations.add(1);
}

function browseBooksWithAi(baseUrl, bookIds, isAiEnabled) {
    group("Browse Books", function () {
        const startTime = new Date().getTime();

        const response = http.get(`${baseUrl}/api/v1/Books?page=1&pageSize=10`);
        const duration = new Date().getTime() - startTime;

        const success = checkResponse(response, 200);
        crudResponseTime.add(duration);
        crudErrorRate.add(!success);
        crudOperations.add(1);

        if (success && isAiEnabled && Math.random() * 100 < LLM_TRAFFIC_PERCENTAGE) {
            // AI-enabled users occasionally request summaries
            const books = JSON.parse(response.body);
            if (books.length > 0) {
                const randomBook = randomItem(books);

                group("Get AI Summary", function () {
                    generateAiSummary(baseUrl, [randomBook.id]);
                });
            }
        }
    });
}

function searchBooks(baseUrl) {
    group("Search Books", function () {
        const searchTerms = ["fiction", "mystery", "romance", "classic", "adventure", "bestseller"];
        const query = randomItem(searchTerms);

        const startTime = new Date().getTime();
        const response = http.get(`${baseUrl}/api/v1/Books/search?query=${query}`);
        const duration = new Date().getTime() - startTime;

        const success = checkResponse(response, 200);
        crudResponseTime.add(duration);
        crudErrorRate.add(!success);
        crudOperations.add(1);
    });
}

function createBook(baseUrl) {
    group("Create Book", function () {
        const bookData = generateBookData();

        const startTime = new Date().getTime();
        const response = http.post(`${baseUrl}/api/v1/Books`, JSON.stringify(bookData), {
            headers: { "Content-Type": "application/json" },
            timeout: "10s",
        });
        const duration = new Date().getTime() - startTime;

        const success = checkCreateResponse(response);
        crudResponseTime.add(duration);
        crudErrorRate.add(!success);
        crudOperations.add(1);
    });
}

function updateBook(baseUrl, bookIds) {
    if (bookIds.length === 0) return;

    group("Update Book", function () {
        const bookId = randomItem(bookIds);
        const updates = {
            price: parseFloat((Math.random() * 30 + 10).toFixed(2)),
            stockQuantity: randomIntBetween(1, 100),
        };

        const startTime = new Date().getTime();
        const response = http.patch(`${baseUrl}/api/v1/Books/${bookId}`, JSON.stringify(updates), {
            headers: { "Content-Type": "application/json" },
            timeout: "10s",
        });
        const duration = new Date().getTime() - startTime;

        const success = checkResponse(response, 200);
        crudResponseTime.add(duration);
        crudErrorRate.add(!success);
        crudOperations.add(1);
    });
}

function generateAiSummary(baseUrl, bookIds) {
    if (bookIds.length === 0) return;

    group("Generate AI Summary", function () {
        const bookId = randomItem(bookIds);

        const startTime = new Date().getTime();
        const response = http.post(`${baseUrl}/api/v1/Books/${bookId}/generate-summary`, null, {
            timeout: "30s",
            tags: { operation: "llm", endpoint: "generate-summary" },
        });
        const duration = new Date().getTime() - startTime;

        const success = check(response, {
            "status is 200": (r) => r.status === 200,
            "has aiGeneratedSummary": (r) => {
                try {
                    const json = JSON.parse(r.body);
                    return (
                        json.hasOwnProperty("aiGeneratedSummary") &&
                        json.aiGeneratedSummary.length > 0
                    );
                } catch (e) {
                    return false;
                }
            },
        });

        llmResponseTime.add(duration);
        llmErrorRate.add(!success);
        llmOperations.add(1);

        // Log slow LLM requests
        if (duration > 10000) {
            console.warn(`Slow LLM request: ${duration}ms`);
        }
    });
}

function bulkGenerateSummaries(baseUrl, bookIds) {
    if (bookIds.length < 3) return;

    group("Bulk AI Summaries", function () {
        // Generate summaries for 2-3 books concurrently
        const count = randomIntBetween(2, 3);
        const selectedBooks = [];
        for (let i = 0; i < count; i++) {
            selectedBooks.push(randomItem(bookIds));
        }

        const requests = selectedBooks.map((bookId) => ({
            method: "POST",
            url: `${baseUrl}/api/v1/Books/${bookId}/generate-summary`,
            params: {
                timeout: "30s",
                tags: { operation: "llm", endpoint: "generate-summary" },
            },
        }));

        const startTime = new Date().getTime();
        const responses = http.batch(requests);
        const duration = new Date().getTime() - startTime;

        responses.forEach((response) => {
            const success = check(response, {
                "status is 200": (r) => r.status === 200,
                "has aiGeneratedSummary": (r) => {
                    try {
                        const json = JSON.parse(r.body);
                        return json.hasOwnProperty("aiGeneratedSummary");
                    } catch (e) {
                        return false;
                    }
                },
            });

            llmErrorRate.add(!success);
            llmOperations.add(1);
        });

        llmResponseTime.add(duration / responses.length);

        console.log(
            `Bulk summary generation: ${count} books in ${duration}ms (avg: ${duration / count}ms)`
        );
    });
}

function getOperationsForUser(userProfile, isAiEnabled) {
    const baseOps = {
        reader: [
            { type: "browse_books", weight: 5 },
            { type: "search_books", weight: 3 },
        ],
        librarian: [
            { type: "browse_books", weight: 3 },
            { type: "create_book", weight: 2 },
            { type: "update_book", weight: 3 },
            { type: "search_books", weight: 2 },
        ],
        manager: [
            { type: "browse_books", weight: 3 },
            { type: "create_book", weight: 2 },
            { type: "update_book", weight: 2 },
            { type: "search_books", weight: 2 },
        ],
    };

    let ops = baseOps[userProfile.type] || baseOps.reader;

    // Add AI operations for enabled users
    if (isAiEnabled) {
        ops = [
            ...ops,
            { type: "generate_summary", weight: 2 },
            { type: "bulk_summaries", weight: 1 },
        ];
    }

    return ops;
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

    return operations[0];
}

function getThinkTime(usagePattern) {
    const patterns = {
        heavy: randomIntBetween(1, 3), // 1-3 seconds
        light: randomIntBetween(3, 8), // 3-8 seconds
        burst: randomIntBetween(1, 2), // 1-2 seconds
    };

    return patterns[usagePattern] || patterns.light;
}

export function teardown(data) {
    const duration = (new Date() - data.startTime) / 1000;
    console.log("\n=== Mixed Workload Test Summary ===");
    console.log(`Duration: ${Math.round(duration)}s`);
    console.log(`Books tested: ${data.bookIds.length}`);
    console.log("===================================");
}
