#!/bin/bash

# TumaNow Auth Flow Test Script
# Tests all auth endpoints to ensure everything is wired up correctly

API_BASE="http://localhost:3001/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "TumaNow Auth Flow Test"
echo "=========================================="
echo ""

# Test 1: Register a new user
echo -e "${YELLOW}Test 1: Register new user${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User '$(date +%s)'",
    "phone": "+250788'$(date +%s | tail -c 6)'",
    "email": "test'$(date +%s)'@example.com",
    "password": "password123",
    "customerType": "INDIVIDUAL"
  }')

if echo "$REGISTER_RESPONSE" | grep -q "accessToken"; then
  echo -e "${GREEN}✓ Registration successful${NC}"
  ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['accessToken'])" 2>/dev/null)
  REFRESH_TOKEN=$(echo "$REGISTER_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['refreshToken'])" 2>/dev/null)
  USER_PHONE=$(echo "$REGISTER_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['user']['phone'])" 2>/dev/null)
else
  echo -e "${RED}✗ Registration failed${NC}"
  echo "$REGISTER_RESPONSE"
  exit 1
fi

echo ""

# Test 2: Login
echo -e "${YELLOW}Test 2: Login${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"phoneOrEmail\": \"$USER_PHONE\",
    \"password\": \"password123\"
  }")

if echo "$LOGIN_RESPONSE" | grep -q "accessToken"; then
  echo -e "${GREEN}✓ Login successful${NC}"
  LOGIN_TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['accessToken'])" 2>/dev/null)
else
  echo -e "${RED}✗ Login failed${NC}"
  echo "$LOGIN_RESPONSE"
  exit 1
fi

echo ""

# Test 3: Get Profile
echo -e "${YELLOW}Test 3: Get Profile${NC}"
PROFILE_RESPONSE=$(curl -s -X GET "$API_BASE/auth/profile" \
  -H "Authorization: Bearer $LOGIN_TOKEN")

if echo "$PROFILE_RESPONSE" | grep -q "id"; then
  echo -e "${GREEN}✓ Profile retrieval successful${NC}"
  USER_NAME=$(echo "$PROFILE_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['name'])" 2>/dev/null)
  echo "  User: $USER_NAME"
else
  echo -e "${RED}✗ Profile retrieval failed${NC}"
  echo "$PROFILE_RESPONSE"
  exit 1
fi

echo ""

# Test 4: Forgot Password
echo -e "${YELLOW}Test 4: Forgot Password${NC}"
FORGOT_RESPONSE=$(curl -s -X POST "$API_BASE/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d "{
    \"phoneOrEmail\": \"$USER_PHONE\"
  }")

if echo "$FORGOT_RESPONSE" | grep -q "token\|message"; then
  echo -e "${GREEN}✓ Forgot password successful${NC}"
  RESET_TOKEN=$(echo "$FORGOT_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('token', ''))" 2>/dev/null)
  if [ -n "$RESET_TOKEN" ]; then
    echo "  Reset token received: ${RESET_TOKEN:0:20}..."
  fi
else
  echo -e "${RED}✗ Forgot password failed${NC}"
  echo "$FORGOT_RESPONSE"
fi

echo ""

# Test 5: Reset Password (if token available)
if [ -n "$RESET_TOKEN" ]; then
  echo -e "${YELLOW}Test 5: Reset Password${NC}"
  RESET_RESPONSE=$(curl -s -X POST "$API_BASE/auth/reset-password" \
    -H "Content-Type: application/json" \
    -d "{
      \"token\": \"$RESET_TOKEN\",
      \"password\": \"newpassword123\"
    }")

  if echo "$RESET_RESPONSE" | grep -q "successfully\|message"; then
    echo -e "${GREEN}✓ Password reset successful${NC}"
    
    # Test login with new password
    echo -e "${YELLOW}Test 5a: Login with new password${NC}"
    NEW_LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
      -H "Content-Type: application/json" \
      -d "{
        \"phoneOrEmail\": \"$USER_PHONE\",
        \"password\": \"newpassword123\"
      }")
    
    if echo "$NEW_LOGIN_RESPONSE" | grep -q "accessToken"; then
      echo -e "${GREEN}✓ Login with new password successful${NC}"
    else
      echo -e "${RED}✗ Login with new password failed${NC}"
    fi
  else
    echo -e "${RED}✗ Password reset failed${NC}"
    echo "$RESET_RESPONSE"
  fi
fi

echo ""

# Test 6: Refresh Token
echo -e "${YELLOW}Test 6: Refresh Token${NC}"
if [ -n "$REFRESH_TOKEN" ]; then
  REFRESH_RESPONSE=$(curl -s -X POST "$API_BASE/auth/refresh" \
    -H "Content-Type: application/json" \
    -d "{
      \"refreshToken\": \"$REFRESH_TOKEN\"
    }")

  if echo "$REFRESH_RESPONSE" | grep -q "accessToken"; then
    echo -e "${GREEN}✓ Token refresh successful${NC}"
  else
    echo -e "${RED}✗ Token refresh failed${NC}"
    echo "$REFRESH_RESPONSE"
  fi
else
  echo -e "${YELLOW}⚠ Refresh token not available${NC}"
fi

echo ""

# Test 7: Error Handling - Wrong Password
echo -e "${YELLOW}Test 7: Error Handling - Wrong Password${NC}"
ERROR_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"phoneOrEmail\": \"$USER_PHONE\",
    \"password\": \"wrongpassword\"
  }")

if echo "$ERROR_RESPONSE" | grep -q "401\|Invalid\|Unauthorized"; then
  echo -e "${GREEN}✓ Error handling works correctly${NC}"
  echo "  Response: $(echo "$ERROR_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('message', 'N/A'))" 2>/dev/null)"
else
  echo -e "${RED}✗ Error handling failed${NC}"
  echo "$ERROR_RESPONSE"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}All tests completed!${NC}"
echo "=========================================="

