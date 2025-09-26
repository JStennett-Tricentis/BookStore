import { check } from "k6";

export function checkResponse(response, expectedStatus) {
    return check(response, {
        [`status is ${expectedStatus}`]: (r) => r.status === expectedStatus,
        "response has body": (r) => r.body.length > 0,
        "response time < 5s": (r) => r.timings.duration < 5000,
    });
}

export function checkPerformance(response, thresholds) {
    return check(response, {
        [`response time < ${thresholds.maxDuration}ms`]: (r) =>
            r.timings.duration < thresholds.maxDuration,
        [`time to first byte < ${thresholds.maxTTFB}ms`]: (r) =>
            r.timings.waiting < thresholds.maxTTFB,
        [`download time < ${thresholds.maxDownload}ms`]: (r) =>
            r.timings.receiving < thresholds.maxDownload,
    });
}

export function checkBookResponse(response) {
    const success = checkResponse(response, 200);

    if (success && response.body) {
        try {
            const data = JSON.parse(response.body);
            return check(data, {
                "has valid book structure": (d) =>
                    typeof d === "object" &&
                    (d.title !== undefined || Array.isArray(d)),
                "book has required fields": (d) => {
                    if (Array.isArray(d)) {
                        return d.length === 0 || (d[0].title && d[0].author);
                    }
                    return d.title && d.author;
                }
            });
        } catch (e) {
            return false;
        }
    }

    return success;
}

export function checkAuthorResponse(response) {
    const success = checkResponse(response, 200);

    if (success && response.body) {
        try {
            const data = JSON.parse(response.body);
            return check(data, {
                "has valid author structure": (d) =>
                    typeof d === "object" &&
                    (d.name !== undefined || Array.isArray(d)),
                "author has required fields": (d) => {
                    if (Array.isArray(d)) {
                        return d.length === 0 || d[0].name;
                    }
                    return d.name;
                }
            });
        } catch (e) {
            return false;
        }
    }

    return success;
}

export function checkCreateResponse(response) {
    return check(response, {
        "status is 201": (r) => r.status === 201,
        "response has location header": (r) => r.headers.Location !== undefined,
        "response has created object": (r) => {
            try {
                const data = JSON.parse(r.body);
                return data.id !== undefined;
            } catch (e) {
                return false;
            }
        }
    });
}

export function checkDeleteResponse(response) {
    return check(response, {
        "status is 204": (r) => r.status === 204,
        "response has no body": (r) => r.body.length === 0,
    });
}