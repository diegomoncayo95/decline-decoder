#!/bin/bash
# Decline Decoder API — Quick Test Script
# Usage: ./test-endpoints.sh [base_url]
BASE=${1:-http://localhost:8080}

echo "╔══════════════════════════════════════╗"
echo "║  Decline Decoder — Endpoint Tests    ║"
echo "╚══════════════════════════════════════╝"
echo ""

# 1. Health check
echo "1️⃣  GET /api/health"
curl -s "$BASE/api/health" | python3 -m json.tool
echo ""

# 2. MUST 1 — Decode Decline
echo "2️⃣  POST /api/decode-decline (MUST 1)"
curl -s -X POST "$BASE/api/decode-decline" \
  -H "Content-Type: application/json" \
  -d '{
    "declineCode": "insufficient_credit_limit",
    "merchantName": "Best Buy",
    "amount": 349.99,
    "userId": "sarah-chen-001"
  }' | python3 -m json.tool
echo ""

# 3. MUST 2 — Pre-Checkout Risk
echo "3️⃣  POST /api/pre-checkout-risk (MUST 2)"
curl -s -X POST "$BASE/api/pre-checkout-risk" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "sarah-chen-001",
    "merchantName": "Target",
    "amount": 150
  }' | python3 -m json.tool
echo ""

# 4. What-If slider (no AI, fast)
echo "4️⃣  POST /api/pre-checkout-risk/what-if"
curl -s -X POST "$BASE/api/pre-checkout-risk/what-if" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "sarah-chen-001",
    "merchantName": "Amazon",
    "amount": 80
  }' | python3 -m json.tool
echo ""

# 5. User Profile
echo "5️⃣  GET /api/user-profile/sarah-chen-001"
curl -s "$BASE/api/user-profile/sarah-chen-001" | python3 -m json.tool
echo ""

# 6. Decline History
echo "6️⃣  GET /api/decline-history/sarah-chen-001"
curl -s "$BASE/api/decline-history/sarah-chen-001?limit=3" | python3 -m json.tool
echo ""

echo "✅ All tests completed!"
