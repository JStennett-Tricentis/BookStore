# Custom K6 image with additional utilities
FROM grafana/k6:0.47.0

USER root

# Install additional utilities
RUN apk add --no-cache \
    curl \
    jq \
    bash \
    ca-certificates \
    tzdata

# Create directories for scripts and results
RUN mkdir -p /scripts /shared /results && \
    chown -R k6:k6 /scripts /shared /results

# Copy custom entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Switch back to k6 user
USER k6

WORKDIR /scripts

ENTRYPOINT ["/entrypoint.sh"]
CMD ["run", "--out", "json=/shared/results.json", "/scripts/tests/books.js"]