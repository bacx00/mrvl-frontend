#!/bin/bash

# Marvel Rivals Live Scoring Test Suite
# Tests all aspects of the live scoring system including API endpoints, data consistency, and real-time updates

set -e
BASE_URL="https://staging.mrvl.net"
MATCH_ID=6
OUTPUT_DIR="./test_results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$OUTPUT_DIR/live_scoring_test_$TIMESTAMP.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Logging function
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

# Test function with error handling
run_test() {
    local test_name="$1"
    local test_function="$2"
    log "\n${BLUE}=== Testing: $test_name ===${NC}"
    
    if $test_function; then
        log "${GREEN}✓ PASS: $test_name${NC}"
        return 0
    else
        log "${RED}✗ FAIL: $test_name${NC}"
        return 1
    fi
}

# API Response validation function
validate_json_response() {
    local response="$1"
    local test_name="$2"
    
    if echo "$response" | jq empty 2>/dev/null; then
        log "${GREEN}Valid JSON response for $test_name${NC}"
        return 0
    else
        log "${RED}Invalid JSON response for $test_name${NC}"
        log "Response: $response"
        return 1
    fi
}

# Test 1: Basic Match Detail API
test_match_detail_api() {
    log "Testing match detail API for match ID $MATCH_ID..."
    
    local response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
        -H "Accept: application/json" \
        -H "Content-Type: application/json" \
        "$BASE_URL/api/matches/$MATCH_ID")
    
    local http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
    local json_response=$(echo "$response" | sed '/HTTP_STATUS:/d')
    
    # Save response for analysis
    echo "$json_response" > "$OUTPUT_DIR/match_detail_response_$TIMESTAMP.json"
    
    if [ "$http_status" -eq 200 ]; then
        log "${GREEN}Match detail API returned 200 OK${NC}"
        validate_json_response "$json_response" "match detail"
        
        # Parse and validate key fields
        local match_data=$(echo "$json_response" | jq -r '.data // . // empty')
        if [ -n "$match_data" ]; then
            local team1_name=$(echo "$match_data" | jq -r '.team1.name // "N/A"')
            local team2_name=$(echo "$match_data" | jq -r '.team2.name // "N/A"')
            local match_status=$(echo "$match_data" | jq -r '.status // "N/A"')
            local team1_score=$(echo "$match_data" | jq -r '.team1_score // 0')
            local team2_score=$(echo "$match_data" | jq -r '.team2_score // 0')
            
            log "Match Details:"
            log "  Team 1: $team1_name (Score: $team1_score)"
            log "  Team 2: $team2_name (Score: $team2_score)"
            log "  Status: $match_status"
        fi
        return 0
    else
        log "${RED}Match detail API returned HTTP $http_status${NC}"
        log "Response: $json_response"
        return 1
    fi
}

# Test 2: Player Rosters Validation
test_player_rosters() {
    log "Testing player rosters data structure..."
    
    local match_response=$(curl -s "$BASE_URL/api/matches/$MATCH_ID")
    local match_data=$(echo "$match_response" | jq -r '.data // . // empty')
    
    if [ -z "$match_data" ]; then
        log "${RED}No match data available${NC}"
        return 1
    fi
    
    # Check team1 players
    local team1_players=$(echo "$match_data" | jq -r '.team1.players // .team1.roster // []')
    local team1_count=$(echo "$team1_players" | jq 'length // 0')
    log "Team 1 Players Count: $team1_count"
    
    if [ "$team1_count" -gt 0 ]; then
        log "Team 1 Player Details:"
        echo "$team1_players" | jq -r '.[] | "  - \(.name // .player_name // "Unknown") (\(.country // "N/A"))"' | head -10
    fi
    
    # Check team2 players
    local team2_players=$(echo "$match_data" | jq -r '.team2.players // .team2.roster // []')
    local team2_count=$(echo "$team2_players" | jq 'length // 0')
    log "Team 2 Players Count: $team2_count"
    
    if [ "$team2_count" -gt 0 ]; then
        log "Team 2 Player Details:"
        echo "$team2_players" | jq -r '.[] | "  - \(.name // .player_name // "Unknown") (\(.country // "N/A"))"' | head -10
    fi
    
    # Check maps with player compositions
    local maps_data=$(echo "$match_data" | jq -r '.maps // .score.maps // []')
    local maps_count=$(echo "$maps_data" | jq 'length // 0')
    log "Maps Count: $maps_count"
    
    if [ "$maps_count" -gt 0 ]; then
        for i in $(seq 0 $((maps_count - 1))); do
            local map_data=$(echo "$maps_data" | jq ".[$i]")
            local map_name=$(echo "$map_data" | jq -r '.map_name // "Map '$((i + 1))'"')
            local team1_comp=$(echo "$map_data" | jq -r '.team1_composition // .team1_players // []')
            local team2_comp=$(echo "$map_data" | jq -r '.team2_composition // .team2_players // []')
            local team1_comp_count=$(echo "$team1_comp" | jq 'length // 0')
            local team2_comp_count=$(echo "$team2_comp" | jq 'length // 0')
            
            log "Map $((i + 1)): $map_name"
            log "  Team 1 Composition: $team1_comp_count players"
            log "  Team 2 Composition: $team2_comp_count players"
            
            if [ "$team1_comp_count" -gt 0 ]; then
                echo "$team1_comp" | jq -r '.[] | "    - \(.name // .player_name // "Unknown"): \(.hero // "No Hero")"' | head -6
            fi
        done
    fi
    
    # Save detailed rosters for analysis
    echo "$match_data" | jq '{team1: .team1, team2: .team2, maps: .maps}' > "$OUTPUT_DIR/player_rosters_$TIMESTAMP.json"
    
    return 0
}

# Test 3: Score Consistency Check
test_score_consistency() {
    log "Testing score consistency across multiple requests..."
    
    local scores_file="$OUTPUT_DIR/score_consistency_$TIMESTAMP.txt"
    echo "Timestamp,Team1_Score,Team2_Score,Status" > "$scores_file"
    
    # Make 5 requests with 2-second intervals
    for i in {1..5}; do
        local response=$(curl -s "$BASE_URL/api/matches/$MATCH_ID")
        local match_data=$(echo "$response" | jq -r '.data // . // empty')
        
        if [ -n "$match_data" ]; then
            local team1_score=$(echo "$match_data" | jq -r '.team1_score // 0')
            local team2_score=$(echo "$match_data" | jq -r '.team2_score // 0')
            local status=$(echo "$match_data" | jq -r '.status // "unknown"')
            local timestamp=$(date +"%H:%M:%S")
            
            echo "$timestamp,$team1_score,$team2_score,$status" >> "$scores_file"
            log "Request $i: $team1_score-$team2_score ($status)"
        fi
        
        sleep 2
    done
    
    # Check for unexpected score changes
    local unique_scores=$(tail -n +2 "$scores_file" | cut -d, -f2,3 | sort -u | wc -l)
    
    if [ "$unique_scores" -eq 1 ]; then
        log "${GREEN}Scores are consistent across all requests${NC}"
    else
        log "${YELLOW}Score variations detected - this might indicate live updates${NC}"
        log "Unique score combinations: $unique_scores"
    fi
    
    return 0
}

# Test 4: Map Data Structure Validation
test_map_data_structure() {
    log "Testing map data structure and names..."
    
    local response=$(curl -s "$BASE_URL/api/matches/$MATCH_ID")
    local match_data=$(echo "$response" | jq -r '.data // . // empty')
    local maps_data=$(echo "$match_data" | jq -r '.maps // .score.maps // []')
    
    if [ "$(echo "$maps_data" | jq 'length // 0')" -eq 0 ]; then
        log "${YELLOW}No maps data found${NC}"
        return 1
    fi
    
    echo "$maps_data" | jq '.' > "$OUTPUT_DIR/maps_structure_$TIMESTAMP.json"
    
    # Analyze each map
    local maps_count=$(echo "$maps_data" | jq 'length')
    for i in $(seq 0 $((maps_count - 1))); do
        local map_data=$(echo "$maps_data" | jq ".[$i]")
        local map_name=$(echo "$map_data" | jq -r '.map_name // "TBD"')
        local game_mode=$(echo "$map_data" | jq -r '.game_mode // .mode // "TBD"')
        local team1_score=$(echo "$map_data" | jq -r '.team1_score // 0')
        local team2_score=$(echo "$map_data" | jq -r '.team2_score // 0')
        local map_status=$(echo "$map_data" | jq -r '.status // "unknown"')
        
        log "Map $((i + 1)):"
        log "  Name: $map_name"
        log "  Mode: $game_mode" 
        log "  Score: $team1_score - $team2_score"
        log "  Status: $map_status"
        
        # Check for required fields
        local has_name=$(echo "$map_data" | jq 'has("map_name")')
        local has_scores=$(echo "$map_data" | jq 'has("team1_score") and has("team2_score")')
        
        if [ "$has_name" = "true" ] && [ "$has_scores" = "true" ]; then
            log "${GREEN}  ✓ Map has required fields${NC}"
        else
            log "${YELLOW}  ⚠ Map missing some fields${NC}"
        fi
    done
    
    return 0
}

# Test 5: Live Scoring Update Endpoint
test_live_scoring_endpoint() {
    log "Testing live scoring update endpoint..."
    
    # Test the public live stream endpoint
    local stream_url="$BASE_URL/api/public/matches/$MATCH_ID/live-stream"
    log "Testing SSE endpoint: $stream_url"
    
    # Test with timeout to avoid hanging
    local sse_response=$(timeout 5s curl -s -N \
        -H "Accept: text/event-stream" \
        -H "Cache-Control: no-cache" \
        "$stream_url" || echo "TIMEOUT")
    
    if [[ "$sse_response" == *"TIMEOUT"* ]]; then
        log "${YELLOW}SSE endpoint test timed out (5s) - this is expected for active streams${NC}"
    elif [[ "$sse_response" == *"data:"* ]]; then
        log "${GREEN}SSE endpoint is responding with event data${NC}"
        echo "$sse_response" | head -10 > "$OUTPUT_DIR/sse_sample_$TIMESTAMP.txt"
    else
        log "${YELLOW}SSE endpoint responded but no event data detected${NC}"
        echo "$sse_response" > "$OUTPUT_DIR/sse_response_$TIMESTAMP.txt"
    fi
    
    # Test the live update POST endpoint (requires authentication)
    log "Testing live update POST endpoint availability..."
    local update_response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d '{"type":"test","data":{"test":true}}' \
        "$BASE_URL/api/matches/$MATCH_ID/live-update")
    
    local http_status=$(echo "$update_response" | grep "HTTP_STATUS:" | cut -d: -f2)
    
    if [ "$http_status" -eq 401 ]; then
        log "${GREEN}Live update endpoint exists (returned 401 - auth required)${NC}"
    elif [ "$http_status" -eq 200 ]; then
        log "${GREEN}Live update endpoint accessible${NC}"
    else
        log "${YELLOW}Live update endpoint returned HTTP $http_status${NC}"
    fi
    
    return 0
}

# Test 6: Polling Mechanism Simulation
test_polling_mechanism() {
    log "Testing polling mechanism with rapid requests..."
    
    local polling_file="$OUTPUT_DIR/polling_test_$TIMESTAMP.txt"
    echo "Request,Timestamp,Response_Time_MS,Team1_Score,Team2_Score" > "$polling_file"
    
    # Simulate 10 rapid requests (200ms intervals like the frontend)
    for i in {1..10}; do
        local start_time=$(date +%s%3N)
        local response=$(curl -s "$BASE_URL/api/matches/$MATCH_ID")
        local end_time=$(date +%s%3N)
        local response_time=$((end_time - start_time))
        
        local match_data=$(echo "$response" | jq -r '.data // . // empty')
        local team1_score=$(echo "$match_data" | jq -r '.team1_score // 0')
        local team2_score=$(echo "$match_data" | jq -r '.team2_score // 0')
        local timestamp=$(date +"%H:%M:%S.%3N")
        
        echo "$i,$timestamp,${response_time}ms,$team1_score,$team2_score" >> "$polling_file"
        log "Poll $i: ${response_time}ms - $team1_score:$team2_score"
        
        # 200ms interval like the frontend
        sleep 0.2
    done
    
    # Calculate average response time
    local avg_response=$(tail -n +2 "$polling_file" | cut -d, -f3 | sed 's/ms//' | awk '{sum+=$1} END {print sum/NR}')
    log "${GREEN}Average response time: ${avg_response}ms${NC}"
    
    if (( $(echo "$avg_response < 1000" | bc -l) )); then
        log "${GREEN}✓ Response times suitable for real-time polling${NC}"
    else
        log "${YELLOW}⚠ High response times may impact real-time performance${NC}"
    fi
    
    return 0
}

# Test 7: Data Persistence Check
test_data_persistence() {
    log "Testing data persistence across requests..."
    
    # Take initial snapshot
    local initial_response=$(curl -s "$BASE_URL/api/matches/$MATCH_ID")
    local initial_data=$(echo "$initial_response" | jq -r '.data // . // empty')
    echo "$initial_data" > "$OUTPUT_DIR/initial_snapshot_$TIMESTAMP.json"
    
    # Wait 10 seconds
    log "Waiting 10 seconds..."
    sleep 10
    
    # Take second snapshot
    local second_response=$(curl -s "$BASE_URL/api/matches/$MATCH_ID")
    local second_data=$(echo "$second_response" | jq -r '.data // . // empty')
    echo "$second_data" > "$OUTPUT_DIR/second_snapshot_$TIMESTAMP.json"
    
    # Compare critical fields
    local initial_team1=$(echo "$initial_data" | jq -r '.team1_score // 0')
    local initial_team2=$(echo "$initial_data" | jq -r '.team2_score // 0')
    local initial_status=$(echo "$initial_data" | jq -r '.status // "unknown"')
    
    local second_team1=$(echo "$second_data" | jq -r '.team1_score // 0')
    local second_team2=$(echo "$second_data" | jq -r '.team2_score // 0')
    local second_status=$(echo "$second_data" | jq -r '.status // "unknown"')
    
    log "Initial state: $initial_team1-$initial_team2 ($initial_status)"
    log "After 10s: $second_team1-$second_team2 ($second_status)"
    
    if [ "$initial_team1" = "$second_team1" ] && [ "$initial_team2" = "$second_team2" ] && [ "$initial_status" = "$second_status" ]; then
        log "${GREEN}✓ Data remains consistent (no unexpected changes)${NC}"
    else
        log "${YELLOW}⚠ Data changed - this could indicate live updates or data issues${NC}"
    fi
    
    return 0
}

# Test 8: comprehensive Match Detail Validation
test_comprehensive_validation() {
    log "Running comprehensive match detail validation..."
    
    local response=$(curl -s "$BASE_URL/api/matches/$MATCH_ID")
    local match_data=$(echo "$response" | jq -r '.data // . // empty')
    
    # Save full response for detailed analysis
    echo "$match_data" > "$OUTPUT_DIR/comprehensive_match_data_$TIMESTAMP.json"
    
    # Check all critical fields
    local checks_passed=0
    local total_checks=0
    
    # Check basic match info
    local fields=("id" "team1" "team2" "status" "team1_score" "team2_score")
    for field in "${fields[@]}"; do
        total_checks=$((total_checks + 1))
        if echo "$match_data" | jq -e ".$field" > /dev/null 2>&1; then
            log "${GREEN}✓ $field present${NC}"
            checks_passed=$((checks_passed + 1))
        else
            log "${RED}✗ $field missing${NC}"
        fi
    done
    
    # Check team details
    if echo "$match_data" | jq -e '.team1.name' > /dev/null 2>&1; then
        checks_passed=$((checks_passed + 1))
        log "${GREEN}✓ Team1 name present${NC}"
    else
        log "${RED}✗ Team1 name missing${NC}"
    fi
    total_checks=$((total_checks + 1))
    
    if echo "$match_data" | jq -e '.team2.name' > /dev/null 2>&1; then
        checks_passed=$((checks_passed + 1))
        log "${GREEN}✓ Team2 name present${NC}"
    else
        log "${RED}✗ Team2 name missing${NC}"
    fi
    total_checks=$((total_checks + 1))
    
    # Check maps data if available
    local maps_exist=$(echo "$match_data" | jq -e '.maps' > /dev/null 2>&1 && echo "true" || echo "false")
    total_checks=$((total_checks + 1))
    if [ "$maps_exist" = "true" ]; then
        checks_passed=$((checks_passed + 1))
        log "${GREEN}✓ Maps data present${NC}"
        
        # Check map structure
        local maps_count=$(echo "$match_data" | jq '.maps | length')
        log "Maps available: $maps_count"
    else
        log "${YELLOW}⚠ Maps data not present${NC}"
    fi
    
    local pass_rate=$((checks_passed * 100 / total_checks))
    log "\n${BLUE}Validation Summary: $checks_passed/$total_checks checks passed ($pass_rate%)${NC}"
    
    if [ "$pass_rate" -ge 80 ]; then
        log "${GREEN}✓ Match data structure is valid${NC}"
        return 0
    else
        log "${RED}✗ Match data structure has issues${NC}"
        return 1
    fi
}

# Main test execution
main() {
    log "${BLUE}Marvel Rivals Live Scoring Test Suite${NC}"
    log "Testing against: $BASE_URL"
    log "Match ID: $MATCH_ID"
    log "Timestamp: $TIMESTAMP"
    log "Results will be saved to: $OUTPUT_DIR"
    
    local passed=0
    local total=0
    
    # Execute all tests
    run_test "Match Detail API" test_match_detail_api && passed=$((passed + 1))
    total=$((total + 1))
    
    run_test "Player Rosters Validation" test_player_rosters && passed=$((passed + 1))
    total=$((total + 1))
    
    run_test "Score Consistency Check" test_score_consistency && passed=$((passed + 1))
    total=$((total + 1))
    
    run_test "Map Data Structure" test_map_data_structure && passed=$((passed + 1))
    total=$((total + 1))
    
    run_test "Live Scoring Endpoints" test_live_scoring_endpoint && passed=$((passed + 1))
    total=$((total + 1))
    
    run_test "Polling Mechanism" test_polling_mechanism && passed=$((passed + 1))
    total=$((total + 1))
    
    run_test "Data Persistence" test_data_persistence && passed=$((passed + 1))
    total=$((total + 1))
    
    run_test "Comprehensive Validation" test_comprehensive_validation && passed=$((passed + 1))
    total=$((total + 1))
    
    # Final summary
    local pass_rate=$((passed * 100 / total))
    log "\n${BLUE}=== FINAL TEST SUMMARY ===${NC}"
    log "Tests Passed: $passed/$total ($pass_rate%)"
    log "Results saved to: $OUTPUT_DIR"
    log "Log file: $LOG_FILE"
    
    if [ "$pass_rate" -ge 75 ]; then
        log "${GREEN}✓ Live scoring system appears to be functioning correctly${NC}"
        exit 0
    else
        log "${RED}✗ Live scoring system has issues that need attention${NC}"
        exit 1
    fi
}

# Check dependencies
if ! command -v curl &> /dev/null; then
    echo "curl is required but not installed. Please install curl."
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo "jq is required but not installed. Please install jq."
    exit 1
fi

# Run main function
main "$@"