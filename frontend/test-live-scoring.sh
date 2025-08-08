#!/bin/bash

# Test Live Scoring System
# This script creates a test match and verifies all live scoring functionality

API_URL="https://staging.mrvl.net/api"
ADMIN_EMAIL="jhonny@ar-mediia.com"
ADMIN_PASSWORD="password123"

echo "=== Live Scoring System Test ==="
echo "1. Logging in as admin..."

# Login and get token
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Login failed!"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Logged in successfully"
echo "Token: ${TOKEN:0:20}..."

# Get teams for testing
echo -e "\n2. Fetching teams..."
TEAMS_RESPONSE=$(curl -s "$API_URL/teams?limit=10" \
  -H "Authorization: Bearer $TOKEN")

TEAM1_ID=$(echo $TEAMS_RESPONSE | jq -r '.data[0].id')
TEAM2_ID=$(echo $TEAMS_RESPONSE | jq -r '.data[1].id')
TEAM1_NAME=$(echo $TEAMS_RESPONSE | jq -r '.data[0].name')
TEAM2_NAME=$(echo $TEAMS_RESPONSE | jq -r '.data[1].name')

echo "Using teams: $TEAM1_NAME (ID: $TEAM1_ID) vs $TEAM2_NAME (ID: $TEAM2_ID)"

# Get an event
echo -e "\n3. Fetching event..."
EVENTS_RESPONSE=$(curl -s "$API_URL/events?limit=1" \
  -H "Authorization: Bearer $TOKEN")

EVENT_ID=$(echo $EVENTS_RESPONSE | jq -r '.data[0].id')
EVENT_NAME=$(echo $EVENTS_RESPONSE | jq -r '.data[0].name')

echo "Using event: $EVENT_NAME (ID: $EVENT_ID)"

# Create a test match
echo -e "\n4. Creating test match..."
CREATE_MATCH_RESPONSE=$(curl -s -X POST "$API_URL/admin/matches" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"team1_id\": $TEAM1_ID,
    \"team2_id\": $TEAM2_ID,
    \"event_id\": $EVENT_ID,
    \"scheduled_at\": \"$(date -u +%Y-%m-%d) 20:00:00\",
    \"format\": \"bo3\",
    \"status\": \"upcoming\",
    \"stream_urls\": [\"https://twitch.tv/marvelrivals\", \"https://youtube.com/@MRVLEsports\"],
    \"betting_urls\": [\"https://bet365.com\", \"https://draftkings.com\"],
    \"vod_urls\": []
  }")

MATCH_ID=$(echo $CREATE_MATCH_RESPONSE | jq -r '.data.id')

if [ "$MATCH_ID" == "null" ] || [ -z "$MATCH_ID" ]; then
  echo "❌ Failed to create match!"
  echo "Response: $CREATE_MATCH_RESPONSE"
  exit 1
fi

echo "✅ Created match ID: $MATCH_ID"

# Start the match (change status to live)
echo -e "\n5. Starting match (changing to live)..."
UPDATE_STATUS_RESPONSE=$(curl -s -X POST "$API_URL/admin/matches/$MATCH_ID/control" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "start"}')

echo "Response: $UPDATE_STATUS_RESPONSE"

# Simulate map 1 scores
echo -e "\n6. Simulating Map 1 (team1 wins 2-0)..."
MAP1_UPDATE=$(curl -s -X POST "$API_URL/admin/simple-live/$MATCH_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "live",
    "current_map": 1,
    "team1_score": 0,
    "team2_score": 0,
    "maps": [{
      "map_number": 1,
      "map_name": "Asgard",
      "status": "completed",
      "team1_score": 2,
      "team2_score": 0,
      "mode": "Domination"
    }]
  }')

echo "Map 1 update response: $(echo $MAP1_UPDATE | jq -r '.message' 2>/dev/null || echo $MAP1_UPDATE)"

# Simulate map 2 scores
echo -e "\n7. Simulating Map 2 (team2 wins 2-1)..."
MAP2_UPDATE=$(curl -s -X POST "$API_URL/admin/simple-live/$MATCH_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "live",
    "current_map": 2,
    "team1_score": 1,
    "team2_score": 1,
    "maps": [{
      "map_number": 1,
      "map_name": "Asgard",
      "status": "completed",
      "team1_score": 2,
      "team2_score": 0,
      "mode": "Domination"
    }, {
      "map_number": 2,
      "map_name": "Tokyo 2099",
      "status": "completed",
      "team1_score": 1,
      "team2_score": 2,
      "mode": "Control"
    }]
  }')

echo "Map 2 update response: $(echo $MAP2_UPDATE | jq -r '.message' 2>/dev/null || echo $MAP2_UPDATE)"

# Simulate map 3 scores
echo -e "\n8. Simulating Map 3 (team1 wins 2-0)..."
MAP3_UPDATE=$(curl -s -X POST "$API_URL/admin/simple-live/$MATCH_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "live",
    "current_map": 3,
    "team1_score": 2,
    "team2_score": 1,
    "series_score_team1": 2,
    "series_score_team2": 1,
    "maps": [{
      "map_number": 1,
      "map_name": "Asgard",
      "status": "completed",
      "team1_score": 2,
      "team2_score": 0,
      "mode": "Domination"
    }, {
      "map_number": 2,
      "map_name": "Tokyo 2099",
      "status": "completed",
      "team1_score": 1,
      "team2_score": 2,
      "mode": "Control"
    }, {
      "map_number": 3,
      "map_name": "Wakanda",
      "status": "completed",
      "team1_score": 2,
      "team2_score": 0,
      "mode": "Convoy"
    }]
  }')

echo "Map 3 update response: $(echo $MAP3_UPDATE | jq -r '.message' 2>/dev/null || echo $MAP3_UPDATE)"

# Complete the match
echo -e "\n9. Completing match..."
COMPLETE_RESPONSE=$(curl -s -X POST "$API_URL/admin/matches/$MATCH_ID/control" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "complete"}')

echo "Complete response: $COMPLETE_RESPONSE"

# Verify final match data
echo -e "\n10. Verifying final match data..."
FINAL_MATCH=$(curl -s "$API_URL/matches/$MATCH_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "Final match data:"
echo "- Status: $(echo $FINAL_MATCH | jq -r '.status')"
echo "- Team1 Score: $(echo $FINAL_MATCH | jq -r '.team1_score')"
echo "- Team2 Score: $(echo $FINAL_MATCH | jq -r '.team2_score')"
echo "- Series Score Team1: $(echo $FINAL_MATCH | jq -r '.series_score_team1')"
echo "- Series Score Team2: $(echo $FINAL_MATCH | jq -r '.series_score_team2')"
echo "- Maps:"
echo "$FINAL_MATCH" | jq -r '.maps[] | "  Map \(.map_number): \(.map_name) - \(.team1_score)-\(.team2_score) (\(.status))"'

echo -e "\n=== Test Complete ==="
echo "Match URL: https://staging.mrvl.net/matches/$MATCH_ID"
echo ""
echo "Please verify:"
echo "1. Overall score shows 2-1 (not 0-0)"
echo "2. Each map shows correct winner below the score"
echo "3. Stream URLs show channel names (MarvelRivals, MRVLEsports)"
echo "4. Live updates sync immediately between pages"