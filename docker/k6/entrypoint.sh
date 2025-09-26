#!/bin/bash
set -e

# Set default environment variables
export TEST_ID=${TEST_ID:-"$(date +%s)"}
export SCENARIO=${SCENARIO:-"load"}
export ENVIRONMENT=${ENVIRONMENT:-"local"}

# Create results directory structure
mkdir -p "/shared/${TEST_ID}"
export RESULTS_DIR="/shared/${TEST_ID}"

# Log test start
echo "Starting K6 test: ${TEST_ID}"
echo "Scenario: ${SCENARIO}"
echo "Environment: ${ENVIRONMENT}"
echo "Command: k6 $@"
echo "Results will be saved to: ${RESULTS_DIR}"

# Set output file path in the results directory
if [[ "$*" == *"--out"* ]]; then
    # If --out is already specified, use it as-is
    exec k6 "$@"
else
    # Add default output configuration
    exec k6 "$@" --out "json=${RESULTS_DIR}/results.json" --out "summary=${RESULTS_DIR}/summary.txt"
fi