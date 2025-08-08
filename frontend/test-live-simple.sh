#!/bin/bash

# Simple Live Scoring Test with Better Debugging
API_URL="https://staging.mrvl.net/api"
AUTH_URL="https://staging.mrvl.net/api/auth"
ADMIN_EMAIL="jhonny@ar-mediia.com"
ADMIN_PASSWORD="password123"

echo "=== SIMPLE LIVE SCORING TEST ==="

# Login
echo -e "\n1. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$AUTH_URL/login" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

echo "Login response: $LOGIN_RESPONSE"
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token // .data.token // .access_token // empty')

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo "❌ Failed to get token"
  exit 1
fi

echo "✅ Got token: ${TOKEN:0:20}..."

# Get teams
echo -e "\n2. Getting teams..."
TEAMS=$(curl -s "$API_URL/teams?limit=2" -H "Authorization: Bearer $TOKEN")
echo "Teams response (first 200 chars): ${TEAMS:0:200}"

TEAM1_ID=$(echo $TEAMS | jq -r '.data[0].id // empty')
TEAM2_ID=$(echo $TEAMS | jq -r '.data[1].id // empty')

if [ -z "$TEAM1_ID" ] || [ -z "$TEAM2_ID" ]; then
  echo "❌ Failed to get teams"
  echo "Full response: $TEAMS"
  exit 1
fi

echo "Team 1 ID: $TEAM1_ID"
echo "Team 2 ID: $TEAM2_ID"

# Get event
echo -e "\n3. Getting event..."
EVENTS=$(curl -s "$API_URL/events?limit=1" -H "Authorization: Bearer $TOKEN")
EVENT_ID=$(echo $EVENTS | jq -r '.data[0].id // empty')

if [ -z "$EVENT_ID" ]; then
  echo "❌ Failed to get event"
  echo "Response: $EVENTS"
  exit 1
fi

echo "Event ID: $EVENT_ID"

# Create match
echo -e "\n4. Creating match..."
MATCH_DATA="{
  \"team1_id\": $TEAM1_ID,
  \"team2_id\": $TEAM2_ID,
  \"event_id\": $EVENT_ID,
  \"scheduled_at\": \"$(date -u +%Y-%m-%d) 20:00:00\",
  \"format\": \"bo3\",
  \"status\": \"upcoming\",
  \"stream_urls\": [\"https://twitch.tv/marvelrivals\"],
  \"betting_urls\": [],
  \"vod_urls\": []
}"

echo "Match data: $MATCH_DATA"

CREATE_RESPONSE=$(curl -s -X POST "$API_URL/admin/matches" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$MATCH_DATA")

echo "Create response: $CREATE_RESPONSE"
MATCH_ID=$(echo $CREATE_RESPONSE | jq -r '.data.id // .id // empty')

if [ -z "$MATCH_ID" ] || [ "$MATCH_ID" == "null" ]; then
  echo "❌ Failed to create match"
  exit 1
fi

echo "✅ Created match ID: $MATCH_ID"

# Start match
echo -e "\n5. Starting match..."
START_RESPONSE=$(curl -s -X POST "$API_URL/admin/matches/$MATCH_ID/control" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "start"}')

echo "Start response: $START_RESPONSE"

# Test live update
echo -e "\n6. Testing live update..."
LIVE_UPDATE=$(curl -s -X POST "$API_URL/admin/simple-live/$MATCH_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "live",
    "current_map": 1,
    "team1_score": 1,
    "team2_score": 0,
    "maps": [{
      "map_number": 1,
      "map_name": "Asgard",
      "status": "live",
      "team1_score": 1,
      "team2_score": 0
    }]
  }')

echo "Live update response: $LIVE_UPDATE"

# Get final match data
echo -e "\n7. Getting match data..."
FINAL_MATCH=$(curl -s "$API_URL/matches/$MATCH_ID" -H "Authorization: Bearer $TOKEN")
echo "Final match (first 300 chars): ${FINAL_MATCH:0:300}"

echo -e "\n=== TEST COMPLETE ==="
echo "Match URL: https://staging.mrvl.net/matches/$MATCH_ID"