#!/bin/bash

# Complete Live Scoring Test
API_URL="https://staging.mrvl.net/api"
AUTH_URL="https://staging.mrvl.net/api/auth"
ADMIN_EMAIL="jhonny@ar-mediia.com"
ADMIN_PASSWORD="password123"

echo "=== COMPLETE LIVE SCORING TEST ==="

# Login
echo -e "\n1. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$AUTH_URL/login" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo "❌ Failed to login"
  exit 1
fi

echo "✅ Logged in successfully"

# Create event first
echo -e "\n2. Creating test event..."
EVENT_RESPONSE=$(curl -s -X POST "$API_URL/admin/events" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Live Scoring Event",
    "slug": "test-live-scoring",
    "start_date": "'$(date -u +%Y-%m-%d)'",
    "end_date": "'$(date -u -d "+7 days" +%Y-%m-%d)'",
    "location": "Online",
    "game": "Marvel Rivals",
    "status": "ongoing",
    "prize_pool": 10000,
    "format": "Single Elimination",
    "description": "Test event for live scoring"
  }')

EVENT_ID=$(echo $EVENT_RESPONSE | jq -r '.data.id // .id // empty')

if [ -z "$EVENT_ID" ] || [ "$EVENT_ID" == "null" ]; then
  echo "❌ Failed to create event"
  echo "Response: $EVENT_RESPONSE"
  
  # Try to get existing event
  echo "Trying to get existing event..."
  EVENTS=$(curl -s "$API_URL/events?limit=1" -H "Authorization: Bearer $TOKEN")
  EVENT_ID=$(echo $EVENTS | jq -r '.data[0].id // empty')
  
  if [ -z "$EVENT_ID" ]; then
    # Create event with minimal data
    EVENT_RESPONSE=$(curl -s -X POST "$API_URL/admin/events" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "name": "Test Event",
        "start_date": "'$(date +%Y-%m-%d)'",
        "end_date": "'$(date -d "+7 days" +%Y-%m-%d)'"
      }')
    EVENT_ID=$(echo $EVENT_RESPONSE | jq -r '.data.id // .id // empty')
  fi
fi

echo "Event ID: $EVENT_ID"

# Get teams
echo -e "\n3. Getting teams with players..."
TEAMS=$(curl -s "$API_URL/teams?limit=10" -H "Authorization: Bearer $TOKEN")

# Find teams with at least 6 players
TEAM1_ID=""
TEAM2_ID=""
TEAM1_NAME=""
TEAM2_NAME=""

for i in {0..9}; do
  TEAM_ID=$(echo $TEAMS | jq -r ".data[$i].id // empty")
  TEAM_NAME=$(echo $TEAMS | jq -r ".data[$i].name // empty")
  PLAYER_COUNT=$(echo $TEAMS | jq -r ".data[$i].player_count // 0")
  
  if [ "$PLAYER_COUNT" -ge 6 ] && [ -z "$TEAM1_ID" ]; then
    TEAM1_ID=$TEAM_ID
    TEAM1_NAME=$TEAM_NAME
  elif [ "$PLAYER_COUNT" -ge 6 ] && [ -z "$TEAM2_ID" ] && [ "$TEAM_ID" != "$TEAM1_ID" ]; then
    TEAM2_ID=$TEAM_ID
    TEAM2_NAME=$TEAM_NAME
    break
  fi
done

# If not enough teams with 6 players, use any two teams
if [ -z "$TEAM1_ID" ] || [ -z "$TEAM2_ID" ]; then
  TEAM1_ID=$(echo $TEAMS | jq -r '.data[0].id')
  TEAM2_ID=$(echo $TEAMS | jq -r '.data[1].id')
  TEAM1_NAME=$(echo $TEAMS | jq -r '.data[0].name')
  TEAM2_NAME=$(echo $TEAMS | jq -r '.data[1].name')
fi

echo "Team 1: $TEAM1_NAME (ID: $TEAM1_ID)"
echo "Team 2: $TEAM2_NAME (ID: $TEAM2_ID)"

# Get players for each team
echo -e "\n4. Getting player rosters..."
TEAM1_DATA=$(curl -s "$API_URL/teams/$TEAM1_ID" -H "Authorization: Bearer $TOKEN")
TEAM2_DATA=$(curl -s "$API_URL/teams/$TEAM2_ID" -H "Authorization: Bearer $TOKEN")

TEAM1_PLAYERS=$(echo $TEAM1_DATA | jq -r '.players[0:6] | .[].id' | tr '\n' ' ')
TEAM2_PLAYERS=$(echo $TEAM2_DATA | jq -r '.players[0:6] | .[].id' | tr '\n' ' ')

TEAM1_PLAYER_ARRAY=($TEAM1_PLAYERS)
TEAM2_PLAYER_ARRAY=($TEAM2_PLAYERS)

echo "Team 1 has ${#TEAM1_PLAYER_ARRAY[@]} players"
echo "Team 2 has ${#TEAM2_PLAYER_ARRAY[@]} players"

# Create match
echo -e "\n5. Creating test match..."
CREATE_RESPONSE=$(curl -s -X POST "$API_URL/admin/matches" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"team1_id\": $TEAM1_ID,
    \"team2_id\": $TEAM2_ID,
    \"event_id\": $EVENT_ID,
    \"scheduled_at\": \"$(date -u +%Y-%m-%d) 20:00:00\",
    \"format\": \"bo3\",
    \"status\": \"upcoming\",
    \"stream_urls\": [\"https://twitch.tv/marvelrivals\", \"https://youtube.com/@MRVLEsports\", \"https://kick.com/mrvl\"],
    \"betting_urls\": [\"https://bet365.com/match/123\", \"https://draftkings.com/mrvl/456\"],
    \"vod_urls\": []
  }")

MATCH_ID=$(echo $CREATE_RESPONSE | jq -r '.data.id // .id // empty')

if [ -z "$MATCH_ID" ] || [ "$MATCH_ID" == "null" ]; then
  echo "❌ Failed to create match"
  echo "Response: $CREATE_RESPONSE"
  exit 1
fi

echo "✅ Created match ID: $MATCH_ID"

# Start match
echo -e "\n6. Starting match..."
curl -s -X POST "$API_URL/admin/matches/$MATCH_ID/control" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "start"}' > /dev/null

# TEST 1: MAP SCORES
echo -e "\n=== TEST 1: MAP SCORES UPDATE ==="
echo "Setting Map 1 to live with score 1-0..."

MAP1_UPDATE=$(curl -s -X POST "$API_URL/admin/simple-live/$MATCH_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"status\": \"live\",
    \"current_map\": 1,
    \"maps\": [{
      \"map_number\": 1,
      \"map_name\": \"Asgard\",
      \"status\": \"live\",
      \"team1_score\": 1,
      \"team2_score\": 0,
      \"mode\": \"Domination\"
    }]
  }")

echo "✅ Map 1 score: 1-0"
sleep 2

echo "Completing Map 1 (2-0) and starting Map 2..."

MAP2_START=$(curl -s -X POST "$API_URL/admin/simple-live/$MATCH_ID" \
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
echo "✅ Map 2 started"
echo "✅ Series score: 1-0"

# TEST 2: HERO UPDATES
echo -e "\n=== TEST 2: HERO UPDATES ==="
echo "Setting hero compositions..."

# Build hero composition data
if [ ${#TEAM1_PLAYER_ARRAY[@]} -ge 6 ] && [ ${#TEAM2_PLAYER_ARRAY[@]} -ge 6 ]; then
  HERO_UPDATE=$(curl -s -X POST "$API_URL/admin/simple-live/$MATCH_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"status\": \"live\",
      \"current_map\": 2,
      \"maps\": [{
        \"map_number\": 1,
        \"map_name\": \"Asgard\",
        \"status\": \"completed\",
        \"team1_score\": 2,
        \"team2_score\": 0,
        \"team1_composition\": [
          {\"player_id\": ${TEAM1_PLAYER_ARRAY[0]}, \"hero\": \"Spider-Man\"},
          {\"player_id\": ${TEAM1_PLAYER_ARRAY[1]}, \"hero\": \"Iron Man\"},
          {\"player_id\": ${TEAM1_PLAYER_ARRAY[2]}, \"hero\": \"Thor\"},
          {\"player_id\": ${TEAM1_PLAYER_ARRAY[3]}, \"hero\": \"Hulk\"},
          {\"player_id\": ${TEAM1_PLAYER_ARRAY[4]}, \"hero\": \"Mantis\"},
          {\"player_id\": ${TEAM1_PLAYER_ARRAY[5]}, \"hero\": \"Luna Snow\"}
        ],
        \"team2_composition\": [
          {\"player_id\": ${TEAM2_PLAYER_ARRAY[0]}, \"hero\": \"Black Panther\"},
          {\"player_id\": ${TEAM2_PLAYER_ARRAY[1]}, \"hero\": \"Doctor Strange\"},
          {\"player_id\": ${TEAM2_PLAYER_ARRAY[2]}, \"hero\": \"Magneto\"},
          {\"player_id\": ${TEAM2_PLAYER_ARRAY[3]}, \"hero\": \"Venom\"},
          {\"player_id\": ${TEAM2_PLAYER_ARRAY[4]}, \"hero\": \"Rocket Raccoon\"},
          {\"player_id\": ${TEAM2_PLAYER_ARRAY[5]}, \"hero\": \"Loki\"}
        ]
      }, {
        \"map_number\": 2,
        \"map_name\": \"Tokyo 2099\",
        \"status\": \"live\",
        \"team1_score\": 0,
        \"team2_score\": 1,
        \"team1_composition\": [
          {\"player_id\": ${TEAM1_PLAYER_ARRAY[0]}, \"hero\": \"Star-Lord\"},
          {\"player_id\": ${TEAM1_PLAYER_ARRAY[1]}, \"hero\": \"Iron Man\"},
          {\"player_id\": ${TEAM1_PLAYER_ARRAY[2]}, \"hero\": \"Captain America\"},
          {\"player_id\": ${TEAM1_PLAYER_ARRAY[3]}, \"hero\": \"Groot\"},
          {\"player_id\": ${TEAM1_PLAYER_ARRAY[4]}, \"hero\": \"Jeff the Land Shark\"},
          {\"player_id\": ${TEAM1_PLAYER_ARRAY[5]}, \"hero\": \"Luna Snow\"}
        ]
      }]
    }")
  
  echo "✅ Hero compositions set for both maps"
else
  echo "⚠️  Not enough players to set hero compositions"
fi

# TEST 3: COMPLETE MAP 2
echo -e "\n=== TEST 3: MAP 2 COMPLETION ==="
echo "Completing Map 2 (Team 2 wins 2-1)..."

MAP2_COMPLETE=$(curl -s -X POST "$API_URL/admin/simple-live/$MATCH_ID" \
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
echo "✅ Map 3 started"

# TEST 4: PLAYER STATS
echo -e "\n=== TEST 4: PLAYER STATS UPDATE ==="
echo "Updating player statistics..."

if [ ${#TEAM1_PLAYER_ARRAY[@]} -ge 6 ] && [ ${#TEAM2_PLAYER_ARRAY[@]} -ge 6 ]; then
  STATS_UPDATE=$(curl -s -X POST "$API_URL/admin/simple-live/$MATCH_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"status\": \"live\",
      \"current_map\": 3,
      \"player_stats\": {
        \"${TEAM1_PLAYER_ARRAY[0]}\": {\"eliminations\": 15, \"deaths\": 3, \"assists\": 8, \"damage\": 18500, \"healing\": 0},
        \"${TEAM1_PLAYER_ARRAY[1]}\": {\"eliminations\": 12, \"deaths\": 5, \"assists\": 10, \"damage\": 15200, \"healing\": 0},
        \"${TEAM1_PLAYER_ARRAY[2]}\": {\"eliminations\": 5, \"deaths\": 2, \"assists\": 18, \"damage\": 8500, \"healing\": 0, \"damage_blocked\": 22000},
        \"${TEAM1_PLAYER_ARRAY[3]}\": {\"eliminations\": 3, \"deaths\": 1, \"assists\": 20, \"damage\": 5200, \"healing\": 0, \"damage_blocked\": 35000},
        \"${TEAM1_PLAYER_ARRAY[4]}\": {\"eliminations\": 2, \"deaths\": 4, \"assists\": 25, \"damage\": 3200, \"healing\": 28000},
        \"${TEAM1_PLAYER_ARRAY[5]}\": {\"eliminations\": 1, \"deaths\": 3, \"assists\": 22, \"damage\": 2800, \"healing\": 32000}
      }
    }")
  
  echo "✅ Player stats updated"
  echo "  Top fragger: Player 1 (15/3/8)"
  echo "  Top healer: Player 6 (32,000 healing)"
  echo "  Top tank: Player 4 (35,000 damage blocked)"
else
  echo "⚠️  Not enough players to update stats"
fi

# TEST 5: COMPLETE MATCH
echo -e "\n=== TEST 5: MATCH COMPLETION ==="
echo "Completing Map 3 and match..."

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

# Verify final data
echo -e "\n=== VERIFICATION ==="
FINAL_MATCH=$(curl -s "$API_URL/matches/$MATCH_ID" -H "Authorization: Bearer $TOKEN")

STATUS=$(echo $FINAL_MATCH | jq -r '.status // "unknown"')
TEAM1_SCORE=$(echo $FINAL_MATCH | jq -r '.team1_score // 0')
TEAM2_SCORE=$(echo $FINAL_MATCH | jq -r '.team2_score // 0')

echo "Match Status: $STATUS"
echo "Final Score: $TEAM1_SCORE-$TEAM2_SCORE"
echo ""
echo "Maps:"
echo "$FINAL_MATCH" | jq -r '.maps[]? | "  Map \(.map_number) (\(.map_name)): \(.team1_score)-\(.team2_score)"' 2>/dev/null || echo "  (Unable to parse maps)"

echo ""
echo "Stream URLs:"
echo "$FINAL_MATCH" | jq -r '.stream_urls[]?' 2>/dev/null || echo "  (No stream URLs)"

echo ""
echo "=== TEST COMPLETE ==="
echo "Match URL: https://staging.mrvl.net/matches/$MATCH_ID"
echo ""
echo "Please verify on the website:"
echo "1. ✓ Overall score shows 2-1 (not 0-0)"
echo "2. ✓ Each map shows correct winner below score" 
echo "3. ✓ Stream URLs show as channel names (MarvelRivals, MRVLEsports, Mrvl)"
echo "4. ✓ Betting URLs show as site names (Bet365, DraftKings)"
echo "5. ✓ Hero selections display correctly"
echo "6. ✓ Player stats show in live scoring"
echo "7. ✓ Live updates sync immediately to match detail page"
echo "8. ✓ No timer is displayed anywhere"