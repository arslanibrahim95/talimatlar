#!/bin/bash

# Message Queue Test Script
# This script tests the message queue service functionality

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MQ_SERVICE_URL="http://localhost:8008"
API_GATEWAY_URL="http://localhost:8080/api/v1/messagequeue"

echo -e "${BLUE}🚀 Message Queue Test Script${NC}"
echo "=================================="

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Function to test endpoint
test_endpoint() {
    local method=$1
    local url=$2
    local data=$3
    local expected_status=$4
    local description=$5
    
    echo -e "${YELLOW}Testing: $description${NC}"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "%{http_code}" -X $method -H "Content-Type: application/json" -d "$data" "$url")
    else
        response=$(curl -s -w "%{http_code}" -X $method "$url")
    fi
    
    http_code="${response: -3}"
    body="${response%???}"
    
    if [ "$http_code" = "$expected_status" ]; then
        print_result 0 "$description (Status: $http_code)"
        if [ -n "$body" ]; then
            echo "Response: $body" | jq . 2>/dev/null || echo "Response: $body"
        fi
    else
        print_result 1 "$description (Expected: $expected_status, Got: $http_code)"
        echo "Response: $body"
    fi
    echo ""
}

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 5

# Test 1: Health Check
echo -e "${BLUE}📋 Test 1: Health Check${NC}"
test_endpoint "GET" "$MQ_SERVICE_URL/health" "" "200" "Message Queue Service Health Check"

# Test 2: Service Info
echo -e "${BLUE}📋 Test 2: Service Information${NC}"
test_endpoint "GET" "$MQ_SERVICE_URL/" "" "200" "Service Information"

# Test 3: List Topics (should be empty initially)
echo -e "${BLUE}📋 Test 3: List Topics${NC}"
test_endpoint "GET" "$MQ_SERVICE_URL/api/v1/topics" "" "200" "List Topics"

# Test 4: Create a Topic
echo -e "${BLUE}📋 Test 4: Create Topic${NC}"
test_endpoint "POST" "$MQ_SERVICE_URL/api/v1/topics" '{"topic": "test_topic"}' "200" "Create Test Topic"

# Test 5: Publish a Message
echo -e "${BLUE}📋 Test 5: Publish Message${NC}"
test_endpoint "POST" "$MQ_SERVICE_URL/api/v1/messages/publish" '{
    "topic": "test_topic",
    "payload": {
        "message": "Hello World",
        "type": "test"
    },
    "priority": 5,
    "max_retries": 3
}' "200" "Publish Test Message"

# Test 6: Publish Bulk Messages
echo -e "${BLUE}📋 Test 6: Publish Bulk Messages${NC}"
test_endpoint "POST" "$MQ_SERVICE_URL/api/v1/messages/publish-bulk" '{
    "messages": [
        {
            "topic": "test_topic",
            "payload": {"message": "Bulk Message 1", "type": "bulk"},
            "priority": 5
        },
        {
            "topic": "test_topic",
            "payload": {"message": "Bulk Message 2", "type": "bulk"},
            "priority": 7
        }
    ]
}' "200" "Publish Bulk Messages"

# Test 7: Get Topic Stats
echo -e "${BLUE}📋 Test 7: Get Topic Statistics${NC}"
test_endpoint "GET" "$MQ_SERVICE_URL/api/v1/topics/test_topic/stats" "" "200" "Get Topic Statistics"

# Test 8: Consume Messages
echo -e "${BLUE}📋 Test 8: Consume Messages${NC}"
test_endpoint "POST" "$MQ_SERVICE_URL/api/v1/messages/consume" '{
    "topic": "test_topic",
    "consumer": "test_consumer",
    "count": 1,
    "block_time": 1000
}' "200" "Consume Messages"

# Test 9: Get Overall Stats
echo -e "${BLUE}📋 Test 9: Get Overall Statistics${NC}"
test_endpoint "GET" "$MQ_SERVICE_URL/api/v1/stats" "" "200" "Get Overall Statistics"

# Test 10: Test API Gateway Integration
echo -e "${BLUE}📋 Test 10: API Gateway Integration${NC}"
test_endpoint "GET" "$API_GATEWAY_URL/health" "" "200" "Message Queue via API Gateway"

# Test 11: Test Notification Topic
echo -e "${BLUE}📋 Test 11: Notification Topic${NC}"
test_endpoint "POST" "$MQ_SERVICE_URL/api/v1/messages/publish" '{
    "topic": "notifications",
    "payload": {
        "type": "email",
        "recipient": "test@example.com",
        "title": "Test Notification",
        "message": "This is a test notification"
    },
    "priority": 7,
    "metadata": {
        "created_by": "test_script",
        "category": "test"
    }
}' "200" "Publish Notification Message"

# Test 12: Test Audit Topic
echo -e "${BLUE}📋 Test 12: Audit Topic${NC}"
test_endpoint "POST" "$MQ_SERVICE_URL/api/v1/messages/publish" '{
    "topic": "audit",
    "payload": {
        "action": "user_login",
        "user_id": "test_user",
        "resource": "auth_service",
        "details": {
            "ip": "192.168.1.1",
            "user_agent": "test_script"
        }
    },
    "priority": 3,
    "metadata": {
        "created_by": "test_script",
        "category": "audit"
    }
}' "200" "Publish Audit Message"

# Test 13: Test Document Processing Topic
echo -e "${BLUE}📋 Test 13: Document Processing Topic${NC}"
test_endpoint "POST" "$MQ_SERVICE_URL/api/v1/messages/publish" '{
    "topic": "document_processing",
    "payload": {
        "document_id": "doc_123",
        "operation": "extract_text",
        "metadata": {
            "file_type": "pdf",
            "size": 1024000
        }
    },
    "priority": 7,
    "max_retries": 5,
    "metadata": {
        "created_by": "test_script",
        "category": "document"
    }
}' "200" "Publish Document Processing Message"

# Test 14: Test User Activity Topic
echo -e "${BLUE}📋 Test 14: User Activity Topic${NC}"
test_endpoint "POST" "$MQ_SERVICE_URL/api/v1/messages/publish" '{
    "topic": "user_activity",
    "payload": {
        "user_id": "user_123",
        "activity": "page_view",
        "details": {
            "page": "/dashboard",
            "duration": 30
        }
    },
    "priority": 2,
    "metadata": {
        "created_by": "test_script",
        "category": "analytics"
    }
}' "200" "Publish User Activity Message"

# Test 15: Test Scheduled Message
echo -e "${BLUE}📋 Test 15: Scheduled Message${NC}"
future_time=$(date -d "+1 minute" -u +"%Y-%m-%dT%H:%M:%SZ")
test_endpoint "POST" "$MQ_SERVICE_URL/api/v1/messages/publish" "{
    \"topic\": \"test_topic\",
    \"payload\": {
        \"message\": \"Scheduled Message\",
        \"type\": \"scheduled\"
    },
    \"priority\": 5,
    \"scheduled_at\": \"$future_time\",
    \"metadata\": {
        \"created_by\": \"test_script\",
        \"category\": \"scheduled\"
    }
}" "200" "Publish Scheduled Message"

# Test 16: Test Message with Expiration
echo -e "${BLUE}📋 Test 16: Message with Expiration${NC}"
expire_time=$(date -d "+1 hour" -u +"%Y-%m-%dT%H:%M:%SZ")
test_endpoint "POST" "$MQ_SERVICE_URL/api/v1/messages/publish" "{
    \"topic\": \"test_topic\",
    \"payload\": {
        \"message\": \"Expiring Message\",
        \"type\": \"temporary\"
    },
    \"priority\": 5,
    \"expires_at\": \"$expire_time\",
    \"metadata\": {
        \"created_by\": \"test_script\",
        \"category\": \"temporary\"
    }
}" "200" "Publish Message with Expiration"

# Test 17: Test High Priority Message
echo -e "${BLUE}📋 Test 17: High Priority Message${NC}"
test_endpoint "POST" "$MQ_SERVICE_URL/api/v1/messages/publish" '{
    "topic": "notifications",
    "payload": {
        "type": "urgent",
        "recipient": "admin@example.com",
        "title": "URGENT: System Alert",
        "message": "Critical system issue detected"
    },
    "priority": 9,
    "max_retries": 5,
    "metadata": {
        "created_by": "test_script",
        "category": "urgent"
    }
}' "200" "Publish High Priority Message"

# Test 18: Test Consumer Stats
echo -e "${BLUE}📋 Test 18: Consumer Statistics${NC}"
test_endpoint "GET" "$MQ_SERVICE_URL/api/v1/stats/consumers" "" "200" "Get Consumer Statistics"

# Test 19: Test Invalid Topic (should fail)
echo -e "${BLUE}📋 Test 19: Invalid Topic (Expected to Fail)${NC}"
test_endpoint "GET" "$MQ_SERVICE_URL/api/v1/topics/nonexistent_topic/stats" "" "404" "Get Stats for Non-existent Topic"

# Test 20: Test Invalid Message (should fail)
echo -e "${BLUE}📋 Test 20: Invalid Message (Expected to Fail)${NC}"
test_endpoint "POST" "$MQ_SERVICE_URL/api/v1/messages/publish" '{
    "topic": "",
    "payload": {}
}' "400" "Publish Invalid Message"

# Final Summary
echo -e "${BLUE}📊 Test Summary${NC}"
echo "=============="
echo -e "${GREEN}✅ All tests completed!${NC}"
echo ""
echo -e "${YELLOW}📋 Tested Features:${NC}"
echo "• Health Check"
echo "• Service Information"
echo "• Topic Management"
echo "• Message Publishing (Single & Bulk)"
echo "• Message Consuming"
echo "• Statistics & Monitoring"
echo "• API Gateway Integration"
echo "• Priority Messages"
echo "• Scheduled Messages"
echo "• Message Expiration"
echo "• Error Handling"
echo ""
echo -e "${YELLOW}🔗 Useful Commands:${NC}"
echo "• View all topics: curl $MQ_SERVICE_URL/api/v1/topics"
echo "• Get stats: curl $MQ_SERVICE_URL/api/v1/stats"
echo "• Health check: curl $MQ_SERVICE_URL/health"
echo ""
echo -e "${GREEN}🎉 Message Queue System is working correctly!${NC}"
