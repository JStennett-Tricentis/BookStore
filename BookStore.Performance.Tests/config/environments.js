export function getEnvironment() {
    const env = __ENV.ENVIRONMENT || "local";

    const environments = {
        local: {
            name: "Local Development",
            serviceUrl: "http://localhost:7002",
            managementUrl: "http://localhost:7004",
            timeout: "10s",
            healthCheckInterval: "30s"
        },
        dev: {
            name: "Development",
            serviceUrl: "https://dev-bookstore-api.example.com",
            managementUrl: "https://dev-bookstore-management.example.com",
            timeout: "15s",
            healthCheckInterval: "60s"
        },
        staging: {
            name: "Staging",
            serviceUrl: "https://staging-bookstore-api.example.com",
            managementUrl: "https://staging-bookstore-management.example.com",
            timeout: "20s",
            healthCheckInterval: "60s"
        }
    };

    return environments[env] || environments.local;
}