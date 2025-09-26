// K6 script to seed test data

import http from "k6/http";
import { getEnvironment } from "../config/environments.js";

const environment = getEnvironment();

export const options = {
    vus: 1,
    iterations: 1,
};

export default function () {
    console.log("Seeding test data...");

    const response = http.post(
        `${environment.serviceUrl}/seed-data`,
        null,
        {
            headers: {
                "Content-Type": "application/json"
            },
            timeout: "30s"
        }
    );

    if (response.status === 200) {
        console.log("✓ Test data seeded successfully");
        console.log(response.body);
    } else {
        console.error(`✗ Failed to seed data: ${response.status}`);
        console.error(response.body);
    }
}