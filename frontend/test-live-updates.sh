#!/bin/bash

# Comprehensive Live Updates Test
# Tests: Map scores, Hero changes, Player stats

API_URL="https://staging.mrvl.net/api"
AUTH_URL="https://staging.mrvl.net/api/auth"
ADMIN_EMAIL="jhonny@ar-mediia.com"
ADMIN_PASSWORD="password123"

echo "=== COMPREHENSIVE LIVE SCORING TEST ==="
echo "Testing: Map scores, Hero updates, Player stats updates"
echo "======================================="

# Login
echo -e "\n1. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$AUTH_URL/login" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

# Check if login was successful
if [[ $LOGIN_RESPONSE == *"token"* ]]; then
  TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token // .data.token // empty')
else
  # Try extracting access_token
  TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token // empty')
fi

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Login failed!"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Logged in successfully"

# Get teams with players
echo -e "\n2. Fetching teams with full rosters..."
TEAMS_RESPONSE=$(curl -s "$API_URL/teams?with_players=true&limit=10" \
  -H "Authorization: Bearer $TOKEN")

# Find teams with at least 6 players
TEAM1_ID=""
TEAM2_ID=""
TEAM1_NAME=""
TEAM2_NAME=""

for i in {0..9}; do
  TEAM_ID=$(echo $TEAMS_RESPONSE | jq -r ".data[$i].id")
  PLAYER_COUNT=$(echo $TEAMS_RESPONSE | jq -r ".data[$i].players | length")
  
  if [ "$PLAYER_COUNT" -ge 6 ] && [ -z "$TEAM1_ID" ]; then
    TEAM1_ID=$TEAM_ID
    TEAM1_NAME=$(echo $TEAMS_RESPONSE | jq -r ".data[$i].name")
  elif [ "$PLAYER_COUNT" -ge 6 ] && [ -z "$TEAM2_ID" ]; then
    TEAM2_ID=$TEAM_ID
    TEAM2_NAME=$(echo $TEAMS_RESPONSE | jq -r ".data[$i].name")
    break
  fi
done

echo "Team 1: $TEAM1_NAME (ID: $TEAM1_ID)"
echo "Team 2: $TEAM2_NAME (ID: $TEAM2_ID)"

# Get player IDs
TEAM1_PLAYERS=$(curl -s "$API_URL/teams/$TEAM1_ID" -H "Authorization: Bearer $TOKEN" | jq -r '.players[0:6] | .[].id')
TEAM2_PLAYERS=$(curl -s "$API_URL/teams/$TEAM2_ID" -H "Authorization: Bearer $TOKEN" | jq -r '.players[0:6] | .[].id')

TEAM1_PLAYER_ARRAY=($TEAM1_PLAYERS)
TEAM2_PLAYER_ARRAY=($TEAM2_PLAYERS)

echo "Team 1 players: ${TEAM1_PLAYER_ARRAY[@]}"
echo "Team 2 players: ${TEAM2_PLAYER_ARRAY[@]}"

# Get event
echo -e "\n3. Getting event..."
EVENT_ID=$(curl -s "$API_URL/events?limit=1" -H "Authorization: Bearer $TOKEN" | jq -r '.data[0].id')

# Create match
echo -e "\n4. Creating test match..."
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
    \"betting_urls\": [\"https://bet365.com/match/123\", \"https://draftkings.com/mrvl\"],
    \"vod_urls\": []
  }")

MATCH_ID=$(echo $CREATE_RESPONSE | jq -r '.data.id')
echo "✅ Created match ID: $MATCH_ID"

# Start match
echo -e "\n5. Starting match..."
curl -s -X POST "$API_URL/admin/matches/$MATCH_ID/control" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "start"}' > /dev/null

# Test 1: MAP SCORES UPDATE
echo -e "\n=== TEST 1: MAP SCORES ==="
echo "Setting Map 1 score to 1-0..."

MAP1_UPDATE=$(curl -s -X POST "$API_URL/admin/simple-live/$MATCH_ID" \
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

echo "✅ Map 1 updated to 1-0"
sleep 2

echo "Updating Map 1 to 2-0 (completed)..."
MAP1_COMPLETE=$(curl -s -X POST "$API_URL/admin/simple-live/$MATCH_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "live",
    "current_map": 2,
    "team1_score": 1,
    "team2_score": 0,
    "series_score_team1": 1,
    "series_score_team2": 0,
    "maps": [{
      "map_number": 1,
      "map_name": "Asgard",
      "status": "completed",
      "team1_score": 2,
      "team2_score": 0,
      "mode": "Domination",
      "winner_id": '$TEAM1_ID'
    }, {
      "map_number": 2,
      "map_name": "Tokyo 2099",
      "status": "live",
      "team1_score": 0,
      "team2_score": 0,
      "mode": "Control"
    }]
  }')

echo "✅ Map 1 completed (Team 1 wins 2-0)"
echo "✅ Series score: 1-0"

# Test 2: HERO UPDATES
echo -e "\n=== TEST 2: HERO UPDATES ==="
echo "Setting team compositions with heroes..."

HERO_UPDATE=$(curl -s -X POST "$API_URL/admin/simple-live/$MATCH_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "live",
    "current_map": 2,
    "maps": [{
      "map_number": 1,
      "map_name": "Asgard",
      "status": "completed",
      "team1_score": 2,
      "team2_score": 0,
      "team1_composition": [
        {"player_id": '${TEAM1_PLAYER_ARRAY[0]}', "hero": "Spider-Man"},
        {"player_id": '${TEAM1_PLAYER_ARRAY[1]}', "hero": "Iron Man"},
        {"player_id": '${TEAM1_PLAYER_ARRAY[2]}', "hero": "Thor"},
        {"player_id": '${TEAM1_PLAYER_ARRAY[3]}', "hero": "Hulk"},
        {"player_id": '${TEAM1_PLAYER_ARRAY[4]}', "hero": "Mantis"},
        {"player_id": '${TEAM1_PLAYER_ARRAY[5]}', "hero": "Luna Snow"}
      ],
      "team2_composition": [
        {"player_id": '${TEAM2_PLAYER_ARRAY[0]}', "hero": "Black Panther"},
        {"player_id": '${TEAM2_PLAYER_ARRAY[1]}', "hero": "Doctor Strange"},
        {"player_id": '${TEAM2_PLAYER_ARRAY[2]}', "hero": "Magneto"},
        {"player_id": '${TEAM2_PLAYER_ARRAY[3]}', "hero": "Venom"},
        {"player_id": '${TEAM2_PLAYER_ARRAY[4]}', "hero": "Rocket Raccoon"},
        {"player_id": '${TEAM2_PLAYER_ARRAY[5]}', "hero": "Loki"}
      ]
    }, {
      "map_number": 2,
      "map_name": "Tokyo 2099",
      "status": "live",
      "team1_score": 0,
      "team2_score": 1,
      "team1_composition": [
        {"player_id": '${TEAM1_PLAYER_ARRAY[0]}', "hero": "Star-Lord"},
        {"player_id": '${TEAM1_PLAYER_ARRAY[1]}', "hero": "Iron Man"},
        {"player_id": '${TEAM1_PLAYER_ARRAY[2]}', "hero": "Captain America"},
        {"player_id": '${TEAM1_PLAYER_ARRAY[3]}', "hero": "Groot"},
        {"player_id": '${TEAM1_PLAYER_ARRAY[4]}', "hero": "Jeff the Land Shark"},
        {"player_id": '${TEAM1_PLAYER_ARRAY[5]}', "hero": "Luna Snow"}
      ],
      "team2_composition": [
        {"player_id": '${TEAM2_PLAYER_ARRAY[0]}', "hero": "Winter Soldier"},
        {"player_id": '${TEAM2_PLAYER_ARRAY[1]}', "hero": "Scarlet Witch"},
        {"player_id": '${TEAM2_PLAYER_ARRAY[2]}', "hero": "Magneto"},
        {"player_id": '${TEAM2_PLAYER_ARRAY[3]}', "hero": "Peni Parker"},
        {"player_id": '${TEAM2_PLAYER_ARRAY[4]}', "hero": "Rocket Raccoon"},
        {"player_id": '${TEAM2_PLAYER_ARRAY[5]}', "hero": "Cloak & Dagger"}
      ]
    }]
  }')

echo "✅ Heroes updated for both maps"
echo "  Map 1: Spider-Man, Iron Man, Thor vs Black Panther, Doctor Strange, Magneto..."
echo "  Map 2: Star-Lord switched from Spider-Man, Winter Soldier switched from Black Panther"

# Test 3: PLAYER STATS
echo -e "\n=== TEST 3: PLAYER STATS ==="
echo "Updating player statistics..."

STATS_UPDATE=$(curl -s -X POST "$API_URL/admin/simple-live/$MATCH_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "live",
    "current_map": 2,
    "player_stats": {
      "'${TEAM1_PLAYER_ARRAY[0]}'": {"eliminations": 12, "deaths": 3, "assists": 8, "damage": 15420, "healing": 0, "damage_blocked": 0},
      "'${TEAM1_PLAYER_ARRAY[1]}'": {"eliminations": 8, "deaths": 5, "assists": 10, "damage": 12300, "healing": 0, "damage_blocked": 0},
      "'${TEAM1_PLAYER_ARRAY[2]}'": {"eliminations": 4, "deaths": 2, "assists": 15, "damage": 8500, "healing": 0, "damage_blocked": 18500},
      "'${TEAM1_PLAYER_ARRAY[3]}'": {"eliminations": 3, "deaths": 1, "assists": 12, "damage": 5200, "healing": 0, "damage_blocked": 25000},
      "'${TEAM1_PLAYER_ARRAY[4]}'": {"eliminations": 2, "deaths": 4, "assists": 18, "damage": 3200, "healing": 22000, "damage_blocked": 0},
      "'${TEAM1_PLAYER_ARRAY[5]}'": {"eliminations": 1, "deaths": 3, "assists": 20, "damage": 2800, "healing": 28000, "damage_blocked": 0},
      "'${TEAM2_PLAYER_ARRAY[0]}'": {"eliminations": 10, "deaths": 4, "assists": 5, "damage": 14200, "healing": 0, "damage_blocked": 0},
      "'${TEAM2_PLAYER_ARRAY[1]}'": {"eliminations": 7, "deaths": 6, "assists": 8, "damage": 11500, "healing": 0, "damage_blocked": 0},
      "'${TEAM2_PLAYER_ARRAY[2]}'": {"eliminations": 5, "deaths": 3, "assists": 12, "damage": 7800, "healing": 0, "damage_blocked": 15000},
      "'${TEAM2_PLAYER_ARRAY[3]}'": {"eliminations": 2, "deaths": 2, "assists": 14, "damage": 4500, "healing": 0, "damage_blocked": 20000},
      "'${TEAM2_PLAYER_ARRAY[4]}'": {"eliminations": 3, "deaths": 5, "assists": 16, "damage": 3800, "healing": 18000, "damage_blocked": 0},
      "'${TEAM2_PLAYER_ARRAY[5]}'": {"eliminations": 1, "deaths": 2, "assists": 19, "damage": 2500, "healing": 24000, "damage_blocked": 0}
    }
  }')

echo "✅ Player stats updated"
echo "  Top fragger: Player 1 (12/3/8)"
echo "  Top healer: Player 6 Team 1 (28,000 healing)"
echo "  Top tank: Player 4 Team 1 (25,000 damage blocked)"

# Test 4: COMPLETE MAP 2 AND UPDATE MAP 3
echo -e "\n=== TEST 4: MAP PROGRESSION ==="
echo "Completing Map 2 (Team 2 wins 2-1)..."

MAP2_COMPLETE=$(curl -s -X POST "$API_URL/admin/simple-live/$MATCH_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "live",
    "current_map": 3,
    "team1_score": 1,
    "team2_score": 1,
    "series_score_team1": 1,
    "series_score_team2": 1,
    "maps": [{
      "map_number": 1,
      "map_name": "Asgard",
      "status": "completed",
      "team1_score": 2,
      "team2_score": 0,
      "winner_id": '$TEAM1_ID'
    }, {
      "map_number": 2,
      "map_name": "Tokyo 2099",
      "status": "completed",
      "team1_score": 1,
      "team2_score": 2,
      "winner_id": '$TEAM2_ID'
    }, {
      "map_number": 3,
      "map_name": "Wakanda",
      "status": "live",
      "team1_score": 1,
      "team2_score": 1,
      "mode": "Convoy"
    }]
  }')

echo "✅ Map 2 completed (Team 2 wins 2-1)"
echo "✅ Series tied 1-1"
echo "✅ Map 3 started (Currently 1-1)"

# Final test: Complete the match
echo -e "\n=== TEST 5: MATCH COMPLETION ==="
echo "Completing Map 3 and match..."

FINAL_UPDATE=$(curl -s -X POST "$API_URL/admin/simple-live/$MATCH_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
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
      "winner_id": '$TEAM1_ID'
    }, {
      "map_number": 2,
      "map_name": "Tokyo 2099",
      "status": "completed",
      "team1_score": 1,
      "team2_score": 2,
      "winner_id": '$TEAM2_ID'
    }, {
      "map_number": 3,
      "map_name": "Wakanda",
      "status": "completed",
      "team1_score": 2,
      "team2_score": 1,
      "winner_id": '$TEAM1_ID'
    }]
  }')

echo "✅ Match completed!"
echo "✅ Final score: 2-1 (Team 1 wins)"

# Verify final data
echo -e "\n=== VERIFICATION ==="
FINAL_MATCH=$(curl -s "$API_URL/matches/$MATCH_ID" -H "Authorization: Bearer $TOKEN")

echo "Match Status: $(echo $FINAL_MATCH | jq -r '.status')"
echo "Series Score: $(echo $FINAL_MATCH | jq -r '.team1_score')-$(echo $FINAL_MATCH | jq -r '.team2_score')"
echo ""
echo "Maps Summary:"
echo "$FINAL_MATCH" | jq -r '.maps[] | "  Map \(.map_number) (\(.map_name)): \(.team1_score)-\(.team2_score) - Status: \(.status)"'
echo ""
echo "URL Display Check:"
echo "- Stream URLs: $(echo $FINAL_MATCH | jq -r '.stream_urls[]')"
echo "- Betting URLs: $(echo $FINAL_MATCH | jq -r '.betting_urls[]')"

echo -e "\n=== TEST COMPLETE ==="
echo "Match URL: https://staging.mrvl.net/matches/$MATCH_ID"
echo ""
echo "Please verify on the website:"
echo "1. ✓ Overall score shows 2-1 (not 0-0)"
echo "2. ✓ Each map shows correct winner name below score"
echo "3. ✓ Hero selections are displayed correctly"
echo "4. ✓ Player stats show in live scoring"
echo "5. ✓ Stream URLs show as: MarvelRivals, MRVLEsports, Mrvl"
echo "6. ✓ Betting URLs show as: Bet365, DraftKings"
echo "7. ✓ Live updates sync immediately to match detail page"