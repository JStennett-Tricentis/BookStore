#!/bin/bash
# Quick test script for API Simulator endpoints

set -e

echo "🧪 Testing API Simulator Endpoints..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

test_endpoint() {
    local name=$1
    local url=$2
    local method=${3:-GET}
    local data=$4
    
    echo -n "Testing ${name}... "
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X ${method} "${url}" \
            -H "Content-Type: application/json" \
            -d "${data}" 2>/dev/null || echo "000")
    else
        response=$(curl -s -w "\n%{http_code}" -X ${method} "${url}" 2>/dev/null || echo "000")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ] || [ "$http_code" = "204" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP ${http_code})"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP ${http_code})"
        ((FAILED++))
    fi
}

echo -e "${BLUE}=== Simulator Management ===${NC}"
test_endpoint "Simulator Settings" "http://localhost:28880/api/agent/settings"

echo ""
echo -e "${BLUE}=== BookStore REST API (Port 17777) ===${NC}"
test_endpoint "List Books" "http://localhost:17777/api/v1/Books"
test_endpoint "Get Book by ID" "http://localhost:17777/api/v1/Books/68dedb16887eae6ff6743f51"

echo ""
echo -e "${BLUE}=== LLM Provider Mocks ===${NC}"
test_endpoint "Claude Messages" "http://localhost:17070/v1/messages" "POST" \
    '{"model":"claude-3-5-sonnet-20241022","max_tokens":100,"messages":[{"role":"user","content":"test"}]}'

test_endpoint "OpenAI Chat" "http://localhost:18080/v1/chat/completions" "POST" \
    '{"model":"gpt-4o","messages":[{"role":"user","content":"test"}]}'

test_endpoint "Ollama Generate" "http://localhost:11434/api/generate" "POST" \
    '{"model":"llama3.2","prompt":"test"}'

test_endpoint "Bedrock Invoke" "http://localhost:19090/model/us.anthropic.claude-sonnet-4-v1:0/invoke" "POST" \
    '{"anthropic_version":"bedrock-2023-05-31","max_tokens":100,"messages":[{"role":"user","content":"test"}]}'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Results: ${GREEN}${PASSED} passed${NC}, ${RED}${FAILED} failed${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
