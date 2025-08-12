#!/bin/bash

# Simulate a REAL Marvel Rivals Tournament Match - Rare Atom vs Soniqs
# Best of 5 Grand Finals

echo "================================================"
echo "🎮 MARVEL RIVALS GRAND FINALS - BEST OF 5"
echo "🔴 RARE ATOM vs SONIQS 🔵"
echo "================================================"
echo ""

# Get auth token (you may need to update this)
TOKEN="YOUR_AUTH_TOKEN_HERE"
# Or try to get from localStorage if available
# TOKEN=$(grep 'authToken' ~/.config/google-chrome/Default/Local\ Storage/leveldb/*.log 2>/dev/null | head -1 | cut -d'"' -f4)

API_URL="https://staging.mrvl.net/api/admin/matches/1/update-live-stats"

# Function to send update
send_update() {
    local data=$1
    local description=$2
    echo "📤 $description"
    curl -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d "$data" \
        -s | jq '.success' 2>/dev/null || echo "Request sent"
    sleep 2
}

echo "====== PRE-MATCH SETUP ======"
echo "⏰ Match starting in 30 seconds..."
echo "📋 Teams finalizing compositions..."
sleep 2

# Initial match setup - Map 1 starting
echo ""
echo "====== MAP 1: TOKYO 2099 - DOMINATION ======"
echo "🗺️ Loading map..."
sleep 2

# Map 1 - Initial compositions
echo "📋 Team compositions locked in:"
echo "  Rare Atom: Spider-Man, Scarlet Witch, Mantis, Luna Snow, Magneto, Venom"
echo "  Soniqs: Star-Lord, Iron Man, Rocket, Adam Warlock, Dr. Strange, Hulk"

initial_data='{
  "current_map": 1,
  "series_score_team1": 0,
  "series_score_team2": 0,
  "team1_score": 0,
  "team2_score": 0,
  "status": "live",
  "team1_players": [
    {"name": "genius19", "hero": "Spider-Man", "kills": 0, "deaths": 0, "assists": 0},
    {"name": "thunder86", "hero": "Scarlet Witch", "kills": 0, "deaths": 0, "assists": 0},
    {"name": "flow58", "hero": "Mantis", "kills": 0, "deaths": 0, "assists": 0},
    {"name": "blade02", "hero": "Luna Snow", "kills": 0, "deaths": 0, "assists": 0},
    {"name": "storm99", "hero": "Magneto", "kills": 0, "deaths": 0, "assists": 0},
    {"name": "frost21", "hero": "Venom", "kills": 0, "deaths": 0, "assists": 0}
  ],
  "team2_players": [
    {"name": "pulse47", "hero": "Star-Lord", "kills": 0, "deaths": 0, "assists": 0},
    {"name": "wave33", "hero": "Iron Man", "kills": 0, "deaths": 0, "assists": 0},
    {"name": "echo91", "hero": "Rocket Raccoon", "kills": 0, "deaths": 0, "assists": 0},
    {"name": "nova18", "hero": "Adam Warlock", "kills": 0, "deaths": 0, "assists": 0},
    {"name": "gamma77", "hero": "Doctor Strange", "kills": 0, "deaths": 0, "assists": 0},
    {"name": "omega42", "hero": "Hulk", "kills": 0, "deaths": 0, "assists": 0}
  ]
}'

send_update "$initial_data" "Map 1 starting - compositions locked"

echo ""
echo "⚔️ ROUND 1 BEGINS!"
sleep 3

# Map 1 - First blood
echo "🩸 FIRST BLOOD! Spider-Man eliminates Star-Lord!"
first_blood='{
  "current_map": 1,
  "team1_score": 1,
  "team2_score": 0,
  "team1_players": [
    {"name": "genius19", "hero": "Spider-Man", "kills": 1, "deaths": 0, "assists": 0, "damage": 3500}
  ],
  "team2_players": [
    {"name": "pulse47", "hero": "Star-Lord", "kills": 0, "deaths": 1, "assists": 0, "damage": 2200}
  ]
}'
send_update "$first_blood" "First blood - Rare Atom 1-0"

# Map 1 - Mid game
echo ""
echo "⏱️ 5 MINUTES IN - Teams fighting for control"
echo "💥 Team fight at point B!"
sleep 2

mid_game='{
  "current_map": 1,
  "team1_score": 8,
  "team2_score": 6,
  "team1_players": [
    {"name": "genius19", "hero": "Spider-Man", "kills": 8, "deaths": 2, "assists": 4, "damage": 22000},
    {"name": "thunder86", "hero": "Scarlet Witch", "kills": 6, "deaths": 3, "assists": 3, "damage": 18000},
    {"name": "flow58", "hero": "Mantis", "kills": 1, "deaths": 2, "assists": 12, "healing": 15000},
    {"name": "blade02", "hero": "Luna Snow", "kills": 2, "deaths": 1, "assists": 10, "healing": 13000},
    {"name": "storm99", "hero": "Magneto", "kills": 4, "deaths": 3, "assists": 8, "damage": 12000, "damage_blocked": 9000},
    {"name": "frost21", "hero": "Venom", "kills": 3, "deaths": 4, "assists": 9, "damage": 10000, "damage_blocked": 11000}
  ],
  "team2_players": [
    {"name": "pulse47", "hero": "Star-Lord", "kills": 6, "deaths": 4, "assists": 5, "damage": 19000},
    {"name": "wave33", "hero": "Iron Man", "kills": 5, "deaths": 5, "assists": 4, "damage": 17000},
    {"name": "echo91", "hero": "Rocket Raccoon", "kills": 2, "deaths": 3, "assists": 11, "healing": 14000},
    {"name": "nova18", "hero": "Adam Warlock", "kills": 1, "deaths": 2, "assists": 9, "healing": 12000},
    {"name": "gamma77", "hero": "Doctor Strange", "kills": 3, "deaths": 4, "assists": 6, "damage": 9000, "damage_blocked": 8000},
    {"name": "omega42", "hero": "Hulk", "kills": 2, "deaths": 6, "assists": 7, "damage": 8000, "damage_blocked": 12000}
  ]
}'
send_update "$mid_game" "Mid game update - Rare Atom 8-6 Soniqs"

echo "🔥 Spider-Man is ON FIRE! 8 eliminations!"
sleep 2

# Map 1 - Final push
echo ""
echo "⚡ FINAL MINUTE - Score: 14-13"
echo "🎯 Both teams pushing for final point!"
sleep 2

echo "💥 HUGE ULTIMATE from Scarlet Witch! Triple kill!"
sleep 1
echo "🏆 RARE ATOM TAKES MAP 1!"

map1_final='{
  "current_map": 1,
  "series_score_team1": 1,
  "series_score_team2": 0,
  "team1_score": 16,
  "team2_score": 14,
  "team1_players": [
    {"name": "genius19", "hero": "Spider-Man", "kills": 15, "deaths": 3, "assists": 8, "damage": 45000},
    {"name": "thunder86", "hero": "Scarlet Witch", "kills": 12, "deaths": 5, "assists": 6, "damage": 38000},
    {"name": "flow58", "hero": "Mantis", "kills": 2, "deaths": 4, "assists": 25, "healing": 28000},
    {"name": "blade02", "hero": "Luna Snow", "kills": 3, "deaths": 3, "assists": 22, "healing": 31000},
    {"name": "storm99", "hero": "Magneto", "kills": 8, "deaths": 6, "assists": 15, "damage": 25000, "damage_blocked": 18000},
    {"name": "frost21", "hero": "Venom", "kills": 6, "deaths": 7, "assists": 18, "damage": 22000, "damage_blocked": 21000}
  ],
  "team2_players": [
    {"name": "pulse47", "hero": "Star-Lord", "kills": 12, "deaths": 8, "assists": 10, "damage": 38000},
    {"name": "wave33", "hero": "Iron Man", "kills": 10, "deaths": 9, "assists": 8, "damage": 35000},
    {"name": "echo91", "hero": "Rocket Raccoon", "kills": 4, "deaths": 6, "assists": 20, "healing": 26000},
    {"name": "nova18", "hero": "Adam Warlock", "kills": 2, "deaths": 5, "assists": 18, "healing": 24000},
    {"name": "gamma77", "hero": "Doctor Strange", "kills": 5, "deaths": 8, "assists": 12, "damage": 20000, "damage_blocked": 16000},
    {"name": "omega42", "hero": "Hulk", "kills": 4, "deaths": 10, "assists": 14, "damage": 18000, "damage_blocked": 22000}
  ],
  "maps": {
    "1": {"team1_score": 16, "team2_score": 14, "status": "completed", "winner": 1}
  }
}'
send_update "$map1_final" "Map 1 Complete - Rare Atom wins 16-14"

echo ""
echo "📊 MAP 1 FINAL STATS:"
echo "  🏆 Rare Atom 16 - 14 Soniqs"
echo "  ⭐ MVP: Spider-Man (15/3/8 KDA)"
echo "  Series: Rare Atom 1-0 Soniqs"
echo ""
sleep 3

echo "====== MAP 2: MIDTOWN MANHATTAN - CONVOY ======"
echo "🔄 HERO SWAPS INCOMING!"
sleep 2

echo "📋 Soniqs making changes:"
echo "  OUT: Star-Lord → IN: Winter Soldier"  
echo "  OUT: Rocket Raccoon → IN: Loki"
echo ""
echo "📋 Rare Atom adjusting:"
echo "  OUT: Spider-Man → IN: Psylocke"
echo "  OUT: Mantis → IN: Jeff the Shark"

map2_start='{
  "current_map": 2,
  "series_score_team1": 1,
  "series_score_team2": 0,
  "team1_score": 0,
  "team2_score": 0,
  "team1_players": [
    {"name": "genius19", "hero": "Psylocke", "kills": 0, "deaths": 0, "assists": 0},
    {"name": "thunder86", "hero": "Scarlet Witch", "kills": 0, "deaths": 0, "assists": 0},
    {"name": "flow58", "hero": "Jeff the Shark", "kills": 0, "deaths": 0, "assists": 0},
    {"name": "blade02", "hero": "Luna Snow", "kills": 0, "deaths": 0, "assists": 0},
    {"name": "storm99", "hero": "Magneto", "kills": 0, "deaths": 0, "assists": 0},
    {"name": "frost21", "hero": "Venom", "kills": 0, "deaths": 0, "assists": 0}
  ],
  "team2_players": [
    {"name": "pulse47", "hero": "Winter Soldier", "kills": 0, "deaths": 0, "assists": 0},
    {"name": "wave33", "hero": "Iron Man", "kills": 0, "deaths": 0, "assists": 0},
    {"name": "echo91", "hero": "Loki", "kills": 0, "deaths": 0, "assists": 0},
    {"name": "nova18", "hero": "Adam Warlock", "kills": 0, "deaths": 0, "assists": 0},
    {"name": "gamma77", "hero": "Doctor Strange", "kills": 0, "deaths": 0, "assists": 0},
    {"name": "omega42", "hero": "Hulk", "kills": 0, "deaths": 0, "assists": 0}
  ]
}'
send_update "$map2_start" "Map 2 starting with new heroes"

echo ""
echo "⚔️ MAP 2 BEGINS!"
echo "🚀 Convoy moving through Midtown Manhattan"
sleep 2

echo "💥 Early aggression from Soniqs!"
echo "🎯 Winter Soldier gets a double kill!"
sleep 2

map2_mid='{
  "current_map": 2,
  "team1_score": 5,
  "team2_score": 8,
  "team1_players": [
    {"name": "genius19", "hero": "Psylocke", "kills": 4, "deaths": 3, "assists": 2, "damage": 12000},
    {"name": "flow58", "hero": "Jeff the Shark", "kills": 0, "deaths": 2, "assists": 8, "healing": 10000}
  ],
  "team2_players": [
    {"name": "pulse47", "hero": "Winter Soldier", "kills": 6, "deaths": 2, "assists": 3, "damage": 15000},
    {"name": "echo91", "hero": "Loki", "kills": 3, "deaths": 1, "assists": 6, "damage": 8000}
  ]
}'
send_update "$map2_mid" "Soniqs leading 8-5 mid-map"

echo "🔄 Soniqs maintaining pressure!"
echo "🛡️ Loki's illusions causing chaos!"
sleep 3

echo ""
echo "🏁 FINAL PUSH - Score 12-15"
echo "⏰ 30 seconds remaining!"
sleep 2

echo "🎯 Winter Soldier clutch play!"
echo "🏆 SONIQS TAKES MAP 2!"

map2_final='{
  "current_map": 2,
  "series_score_team1": 1,
  "series_score_team2": 1,
  "team1_score": 12,
  "team2_score": 16,
  "team1_players": [
    {"name": "genius19", "hero": "Psylocke", "kills": 8, "deaths": 5, "assists": 5, "damage": 28000},
    {"name": "flow58", "hero": "Jeff the Shark", "kills": 1, "deaths": 4, "assists": 15, "healing": 22000}
  ],
  "team2_players": [
    {"name": "pulse47", "hero": "Winter Soldier", "kills": 14, "deaths": 4, "assists": 7, "damage": 40000},
    {"name": "echo91", "hero": "Loki", "kills": 6, "deaths": 3, "assists": 12, "damage": 18000}
  ],
  "maps": {
    "1": {"team1_score": 16, "team2_score": 14, "status": "completed", "winner": 1},
    "2": {"team1_score": 12, "team2_score": 16, "status": "completed", "winner": 2}
  }
}'
send_update "$map2_final" "Map 2 Complete - Soniqs wins 16-12"

echo ""
echo "📊 MAP 2 FINAL STATS:"
echo "  🏆 Soniqs 16 - 12 Rare Atom"
echo "  ⭐ MVP: Winter Soldier (14/4/7 KDA)"
echo "  Series: Rare Atom 1-1 Soniqs"
echo ""
sleep 3

echo "====== MAP 3: YGGSGARD - CONVERGENCE ======"
echo "🏆 POTENTIAL SERIES POINT FOR RARE ATOM"
echo "🔥 Counter-picks incoming!"
sleep 2

echo "📋 Final compositions:"
echo "  Rare Atom: Psylocke, Hela, Jeff, Luna, Peni Parker, Venom"
echo "  Soniqs: Punisher, Iron Man, C&D, Adam, Strange, Hulk"

map3_start='{
  "current_map": 3,
  "series_score_team1": 1,
  "series_score_team2": 1,
  "team1_score": 0,
  "team2_score": 0,
  "team1_players": [
    {"name": "genius19", "hero": "Psylocke", "kills": 0, "deaths": 0, "assists": 0},
    {"name": "thunder86", "hero": "Hela", "kills": 0, "deaths": 0, "assists": 0},
    {"name": "flow58", "hero": "Jeff the Shark", "kills": 0, "deaths": 0, "assists": 0},
    {"name": "blade02", "hero": "Luna Snow", "kills": 0, "deaths": 0, "assists": 0},
    {"name": "storm99", "hero": "Peni Parker", "kills": 0, "deaths": 0, "assists": 0},
    {"name": "frost21", "hero": "Venom", "kills": 0, "deaths": 0, "assists": 0}
  ],
  "team2_players": [
    {"name": "pulse47", "hero": "Punisher", "kills": 0, "deaths": 0, "assists": 0},
    {"name": "wave33", "hero": "Iron Man", "kills": 0, "deaths": 0, "assists": 0},
    {"name": "echo91", "hero": "Cloak & Dagger", "kills": 0, "deaths": 0, "assists": 0},
    {"name": "nova18", "hero": "Adam Warlock", "kills": 0, "deaths": 0, "assists": 0},
    {"name": "gamma77", "hero": "Doctor Strange", "kills": 0, "deaths": 0, "assists": 0},
    {"name": "omega42", "hero": "Hulk", "kills": 0, "deaths": 0, "assists": 0}
  ]
}'
send_update "$map3_start" "Map 3 - Decider map starting"

echo ""
echo "⚔️ THE DECIDER MAP BEGINS!"
sleep 2

echo "🎯 Hela dominating the high ground!"
echo "💀 Triple headshot from Hela!"
sleep 2

echo "🔄 Back and forth action - Score 8-8"
sleep 2

echo "🚀 Rare Atom pulls ahead 14-11!"
echo "💥 Peni Parker's spider nest controlling the point!"
sleep 2

echo ""
echo "🏁 MATCH POINT - Rare Atom 15-13"
echo "⚡ FINAL TEAM FIGHT!"
sleep 2

echo "🎯 HELA WITH THE QUAD KILL!"
echo "🏆🏆🏆 RARE ATOM WINS THE SERIES!"

map3_final='{
  "current_map": 3,
  "series_score_team1": 2,
  "series_score_team2": 1,
  "team1_score": 16,
  "team2_score": 13,
  "status": "completed",
  "team1_players": [
    {"name": "genius19", "hero": "Psylocke", "kills": 10, "deaths": 4, "assists": 6, "damage": 32000},
    {"name": "thunder86", "hero": "Hela", "kills": 18, "deaths": 3, "assists": 4, "damage": 52000},
    {"name": "flow58", "hero": "Jeff the Shark", "kills": 2, "deaths": 3, "assists": 20, "healing": 25000},
    {"name": "blade02", "hero": "Luna Snow", "kills": 3, "deaths": 2, "assists": 18, "healing": 27000},
    {"name": "storm99", "hero": "Peni Parker", "kills": 7, "deaths": 5, "assists": 12, "damage": 20000, "damage_blocked": 24000},
    {"name": "frost21", "hero": "Venom", "kills": 5, "deaths": 6, "assists": 14, "damage": 18000, "damage_blocked": 20000}
  ],
  "team2_players": [
    {"name": "pulse47", "hero": "Punisher", "kills": 9, "deaths": 7, "assists": 6, "damage": 30000},
    {"name": "wave33", "hero": "Iron Man", "kills": 8, "deaths": 8, "assists": 7, "damage": 28000},
    {"name": "echo91", "hero": "Cloak & Dagger", "kills": 3, "deaths": 4, "assists": 16, "healing": 23000},
    {"name": "nova18", "hero": "Adam Warlock", "kills": 2, "deaths": 3, "assists": 14, "healing": 21000},
    {"name": "gamma77", "hero": "Doctor Strange", "kills": 4, "deaths": 6, "assists": 10, "damage": 17000, "damage_blocked": 15000},
    {"name": "omega42", "hero": "Hulk", "kills": 3, "deaths": 9, "assists": 11, "damage": 15000, "damage_blocked": 19000}
  ],
  "maps": {
    "1": {"team1_score": 16, "team2_score": 14, "status": "completed", "winner": 1},
    "2": {"team1_score": 12, "team2_score": 16, "status": "completed", "winner": 2},
    "3": {"team1_score": 16, "team2_score": 13, "status": "completed", "winner": 1}
  }
}'
send_update "$map3_final" "MATCH COMPLETE - Rare Atom wins 2-1!"

echo ""
echo "================================================"
echo "🏆 GRAND FINALS COMPLETE!"
echo "🥇 RARE ATOM WINS 2-1"
echo ""
echo "📊 SERIES SUMMARY:"
echo "  Map 1: Rare Atom 16-14 (Tokyo 2099)"
echo "  Map 2: Soniqs 16-12 (Midtown Manhattan)"
echo "  Map 3: Rare Atom 16-13 (Yggsgard)"
echo ""
echo "⭐ SERIES MVP: Hela (18/3/4 on Map 3)"
echo "================================================"
echo ""
echo "✅ Match simulation complete!"
echo "Check https://staging.mrvl.net/#match-detail/1 to see the updates"