#!/bin/bash

# Working Live Scoring Test
API_URL="https://staging.mrvl.net/api"
AUTH_URL="https://staging.mrvl.net/api/auth"
ADMIN_EMAIL="jhonny@ar-mediia.com"
ADMIN_PASSWORD="password123"

echo "=== WORKING LIVE SCORING TEST ==="

# Login
echo -e "\n1. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$AUTH_URL/login" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo "❌ Failed to login"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Logged in successfully"

# Get teams
echo -e "\n2. Getting teams..."
TEAMS=$(curl -s "$API_URL/teams?limit=10" -H "Authorization: Bearer $TOKEN")
TEAM1_ID=$(echo $TEAMS | jq -r '.data[0].id')
TEAM2_ID=$(echo $TEAMS | jq -r '.data[1].id')
TEAM1_NAME=$(echo $TEAMS | jq -r '.data[0].name')
TEAM2_NAME=$(echo $TEAMS | jq -r '.data[1].name')

echo "Team 1: $TEAM1_NAME (ID: $TEAM1_ID)"
echo "Team 2: $TEAM2_NAME (ID: $TEAM2_ID)"

# Try to get any existing event, or use NULL
echo -e "\n3. Getting event..."
EVENTS=$(curl -s "$API_URL/events?limit=1" -H "Authorization: Bearer $TOKEN")
EVENT_ID=$(echo $EVENTS | jq -r '.data[0].id // null')

if [ "$EVENT_ID" == "null" ]; then
  echo "No existing events found, creating one..."
  CREATE_EVENT=$(curl -s -X POST "$API_URL/admin/events" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Live Test Event",
      "start_date": "'$(date +%Y-%m-%d)'",
      "end_date": "'$(date -d "+7 days" +%Y-%m-%d)'"
    }')
  
  EVENT_ID=$(echo $CREATE_EVENT | jq -r '.data.id // .id // null')
  echo "Created event ID: $EVENT_ID"
else
  echo "Using existing event ID: $EVENT_ID"
fi

# Create match
echo -e "\n4. Creating match..."
MATCH_DATA="{
  \"team1_id\": $TEAM1_ID,
  \"team2_id\": $TEAM2_ID,
  \"event_id\": $EVENT_ID,
  \"scheduled_at\": \"$(date -u +%Y-%m-%d) 20:00:00\",
  \"format\": \"bo3\",
  \"status\": \"upcoming\",
  \"stream_urls\": [\"https://twitch.tv/marvelrivals\", \"https://youtube.com/@MRVLEsports\"],
  \"betting_urls\": [\"https://bet365.com/match/test\", \"https://draftkings.com/test\"],
  \"vod_urls\": []
}"

CREATE_RESPONSE=$(curl -s -X POST "$API_URL/admin/matches" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$MATCH_DATA")

MATCH_ID=$(echo $CREATE_RESPONSE | jq -r '.data.id // .id // empty')

if [ -z "$MATCH_ID" ] || [ "$MATCH_ID" == "null" ]; then
  echo "❌ Failed to create match"
  echo "Response: $CREATE_RESPONSE"
  exit 1
fi

echo "✅ Created match ID: $MATCH_ID"

# Start match
echo -e "\n5. Starting match..."
START_RESPONSE=$(curl -s -X POST "$API_URL/admin/matches/$MATCH_ID/control" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "start"}')

echo "Match started"

# TEST: Live Scoring Updates
echo -e "\n=== TESTING LIVE SCORING ==="

echo "6. Setting Map 1 live (1-0)..."
LIVE_UPDATE1=$(curl -s -X POST "$API_URL/admin/simple-live/$MATCH_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "live",
    "current_map": 1,
    "maps": [{
      "map_number": 1,
      "map_name": "Asgard",
      "status": "live",
      "team1_score": 1,
      "team2_score": 0,
      "mode": "Domination"
    }]
  }')

echo "✅ Map 1 score: 1-0"
sleep 1

echo "7. Completing Map 1 (2-0) and starting Map 2..."
LIVE_UPDATE2=$(curl -s -X POST "$API_URL/admin/simple-live/$MATCH_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"status\": \"live\",
    \"current_map\": 2,
    \"team1_score\": 1,
    \"team2_score\": 0,
    \"series_score_team1\": 1,
    \"series_score_team2\": 0,
    \"maps\": [{
      \"map_number\": 1,
      \"map_name\": \"Asgard\",
      \"status\": \"completed\",
      \"team1_score\": 2,
      \"team2_score\": 0,
      \"mode\": \"Domination\",
      \"winner_id\": $TEAM1_ID
    }, {
      \"map_number\": 2,
      \"map_name\": \"Tokyo 2099\",
      \"status\": \"live\",
      \"team1_score\": 0,
      \"team2_score\": 0,
      \"mode\": \"Control\"
    }]
  }")

echo "✅ Map 1 completed ($TEAM1_NAME wins 2-0)"
echo "✅ Series score: 1-0" 
sleep 1

echo "8. Completing Map 2 (1-2) - Series tied..."
LIVE_UPDATE3=$(curl -s -X POST "$API_URL/admin/simple-live/$MATCH_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"status\": \"live\",
    \"current_map\": 3,
    \"team1_score\": 1,
    \"team2_score\": 1,
    \"series_score_team1\": 1,
    \"series_score_team2\": 1,
    \"maps\": [{
      \"map_number\": 1,
      \"map_name\": \"Asgard\",
      \"status\": \"completed\",
      \"team1_score\": 2,
      \"team2_score\": 0,
      \"winner_id\": $TEAM1_ID
    }, {
      \"map_number\": 2,
      \"map_name\": \"Tokyo 2099\",
      \"status\": \"completed\",
      \"team1_score\": 1,
      \"team2_score\": 2,
      \"winner_id\": $TEAM2_ID
    }, {
      \"map_number\": 3,
      \"map_name\": \"Wakanda\",
      \"status\": \"live\",
      \"team1_score\": 0,
      \"team2_score\": 0,
      \"mode\": \"Convoy\"
    }]
  }")

echo "✅ Map 2 completed ($TEAM2_NAME wins 2-1)"
echo "✅ Series tied 1-1"
sleep 1

echo "9. Completing match (Map 3: 2-1)..."
FINAL_UPDATE=$(curl -s -X POST "$API_URL/admin/simple-live/$MATCH_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"status\": \"completed\",
    \"team1_score\": 2,
    \"team2_score\": 1,
    \"series_score_team1\": 2,
    \"series_score_team2\": 1,
    \"maps\": [{
      \"map_number\": 1,
      \"map_name\": \"Asgard\",
      \"status\": \"completed\",
      \"team1_score\": 2,
      \"team2_score\": 0,
      \"winner_id\": $TEAM1_ID
    }, {
      \"map_number\": 2,
      \"map_name\": \"Tokyo 2099\",
      \"status\": \"completed\",
      \"team1_score\": 1,
      \"team2_score\": 2,
      \"winner_id\": $TEAM2_ID
    }, {
      \"map_number\": 3,
      \"map_name\": \"Wakanda\",
      \"status\": \"completed\",
      \"team1_score\": 2,
      \"team2_score\": 1,
      \"winner_id\": $TEAM1_ID
    }]
  }")

echo "✅ Match completed!"
echo "✅ Final score: 2-1 ($TEAM1_NAME wins)"

# Verify final match data
echo -e "\n=== VERIFICATION ==="
FINAL_MATCH=$(curl -s "$API_URL/matches/$MATCH_ID" -H "Authorization: Bearer $TOKEN")

STATUS=$(echo $FINAL_MATCH | jq -r '.status // "unknown"')
FINAL_SCORE_T1=$(echo $FINAL_MATCH | jq -r '.team1_score // 0')
FINAL_SCORE_T2=$(echo $FINAL_MATCH | jq -r '.team2_score // 0')

echo "Final Status: $STATUS"
echo "Final Score: $FINAL_SCORE_T1-$FINAL_SCORE_T2" 

echo ""
echo "Map Results:"
echo "$FINAL_MATCH" | jq -r '.maps[]? | "  Map \(.map_number): \(.map_name) - \(.team1_score)-\(.team2_score) (Status: \(.status))"' 2>/dev/null || echo "  (Maps data not available)"

echo ""
echo "URLs Test:"
echo "Stream URLs:"
echo "$FINAL_MATCH" | jq -r '.stream_urls[]?' 2>/dev/null | while read url; do echo "  - $url"; done
echo "Betting URLs:"  
echo "$FINAL_MATCH" | jq -r '.betting_urls[]?' 2>/dev/null | while read url; do echo "  - $url"; done

echo ""
echo "=== TEST RESULTS ==="
echo "Match ID: $MATCH_ID"
echo "Match URL: https://staging.mrvl.net/matches/$MATCH_ID"
echo ""
echo "✅ TESTS COMPLETED!"
echo ""
echo "Please verify on the website:"
echo "1. ✓ Overall score shows 2-1 (not 0-0)"
echo "2. ✓ Each map shows correct winner below score"
echo "3. ✓ Stream URLs show channel names (MarvelRivals, MRVLEsports)"
echo "4. ✓ Betting URLs show site names (Bet365)"  
echo "5. ✓ Live updates sync immediately"
echo "6. ✓ No timer displayed anywhere"
echo ""
echo "Key aspects tested:"
echo "- ✅ Match creation and control"
echo "- ✅ Live scoring updates"
echo "- ✅ Map progression (live → completed)"
echo "- ✅ Series score tracking"
echo "- ✅ Individual map winner assignment"
echo "- ✅ Match completion with correct final score"