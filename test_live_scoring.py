import requests
import sys
import json
from datetime import datetime, timedelta

class MarvelRivalsAPITester:
    def __init__(self, base_url="https://staging.mrvl.net"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"  # API URL with /api prefix
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.issues = []
        self.debug = True
        self.admin_token = None

    def log(self, message):
        """Print debug messages if debug is enabled"""
        if self.debug:
            print(f"DEBUG: {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, auth=False, admin_auth=False, with_api_prefix=True):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if with_api_prefix else f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json', 'Accept': 'application/json'}
        
        if auth and self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        elif admin_auth and self.admin_token:
            headers['Authorization'] = f'Bearer {self.admin_token}'
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        self.log(f"URL: {url}")
        self.log(f"Method: {method}")
        if data:
            self.log(f"Data: {json.dumps(data)}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            
            self.log(f"Status Code: {response.status_code}")
            
            # Check if response is JSON
            is_json = False
            response_data = {}
            try:
                response_data = response.json()
                is_json = True
                self.log(f"Response: {json.dumps(response_data, indent=2)}")
            except:
                self.log(f"Response (text): {response.text}")
                is_json = False
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                if is_json:
                    print(f"Response: {json.dumps(response_data, indent=2)[:200]}...")
                else:
                    print(f"Response: {response.text[:200]}...")
                
                self.issues.append({
                    "test": name,
                    "url": url,
                    "expected_status": expected_status,
                    "actual_status": response.status_code,
                    "is_json": is_json,
                    "response": response_data if is_json else response.text[:200]
                })
            
            return success, response_data if is_json else {}
        
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.issues.append({
                "test": name,
                "url": url,
                "error": str(e)
            })
            return False, {}

    def login(self, email="jhonny@ar-mediia.com", password="password123"):
        """Login to get authentication token"""
        print("\n🔑 Attempting to login...")
        success, data = self.run_test(
            "User Login",
            "POST",
            "auth/login",  # Updated to use the correct endpoint path
            200,
            {"email": email, "password": password}
        )
        
        if success and 'token' in data:
            self.token = data['token']
            print(f"✅ Login successful! Token: {self.token[:10]}...")
            
            # Check if user is admin
            if data.get('user', {}).get('roles') and 'admin' in data.get('user', {}).get('roles'):
                self.admin_token = self.token
                print("✅ Admin login confirmed!")
            
            return True
        else:
            print("❌ Login failed!")
            return False

    def test_get_match_scoreboard(self, match_id):
        """Test getting match scoreboard with team and player information"""
        return self.run_test(
            f"Get Match Scoreboard for ID {match_id}",
            "GET",
            f"matches/{match_id}/scoreboard",
            200
        )
    
    def test_update_player_stats(self, match_id, player_id, stats_data):
        """Test updating player stats for a match"""
        return self.run_test(
            f"Update Player Stats for Match ID {match_id}, Player ID {player_id}",
            "POST",
            f"matches/{match_id}/players/{player_id}/stats",
            200,
            data=stats_data,
            auth=True  # Try with authentication
        )
    
    def print_summary(self):
        """Print a summary of the test results"""
        print("\n" + "="*50)
        print(f"📊 TEST SUMMARY: {self.tests_passed}/{self.tests_run} tests passed ({self.tests_passed/self.tests_run*100:.1f}%)")
        print("="*50)
        
        if self.issues:
            print("\n❌ ISSUES FOUND:")
            for i, issue in enumerate(self.issues, 1):
                print(f"\n{i}. {issue['test']}")
                if 'error' in issue:
                    print(f"   Error: {issue['error']}")
                else:
                    print(f"   Expected: {issue['expected_status']}, Got: {issue['actual_status']}")
                    if issue['is_json'] and isinstance(issue['response'], dict):
                        print(f"   Response: {json.dumps(issue['response'], indent=2)[:200]}...")
                    else:
                        print(f"   Response: {issue['response']}")
        else:
            print("\n✅ No issues found! All tests passed.")

def check_player_ids(scoreboard_data):
    """Check if player objects in scoreboard data have proper ID fields"""
    print("\n----- CHECKING PLAYER IDs IN SCOREBOARD DATA -----")
    
    all_players_have_ids = True
    player_ids = []
    
    # Check if we have the correct structure in the response
    if 'data' in scoreboard_data and 'teams' in scoreboard_data['data']:
        teams_data = scoreboard_data['data']['teams']
        
        # Check team1 players
        if 'team1' in teams_data and 'players' in teams_data['team1']:
            for i, player in enumerate(teams_data['team1']['players']):
                if 'id' in player and player['id']:
                    print(f"✅ Team 1 Player {i+1} has ID: {player['id']}")
                    player_ids.append(player['id'])
                else:
                    print(f"❌ Team 1 Player {i+1} is missing ID field")
                    all_players_have_ids = False
        else:
            print("❌ Team 1 players missing in scoreboard")
            all_players_have_ids = False
        
        # Check team2 players
        if 'team2' in teams_data and 'players' in teams_data['team2']:
            for i, player in enumerate(teams_data['team2']['players']):
                if 'id' in player and player['id']:
                    print(f"✅ Team 2 Player {i+1} has ID: {player['id']}")
                    player_ids.append(player['id'])
                else:
                    print(f"❌ Team 2 Player {i+1} is missing ID field")
                    all_players_have_ids = False
        else:
            print("❌ Team 2 players missing in scoreboard")
            all_players_have_ids = False
    else:
        # Check if we have the team1_players and team2_players directly in the response
        if 'team1_players' in scoreboard_data and scoreboard_data['team1_players']:
            for i, player in enumerate(scoreboard_data['team1_players']):
                if 'id' in player and player['id']:
                    print(f"✅ Team 1 Player {i+1} has ID: {player['id']}")
                    player_ids.append(player['id'])
                else:
                    print(f"❌ Team 1 Player {i+1} is missing ID field")
                    all_players_have_ids = False
        else:
            print("❌ Team 1 players missing in scoreboard")
            all_players_have_ids = False
        
        if 'team2_players' in scoreboard_data and scoreboard_data['team2_players']:
            for i, player in enumerate(scoreboard_data['team2_players']):
                if 'id' in player and player['id']:
                    print(f"✅ Team 2 Player {i+1} has ID: {player['id']}")
                    player_ids.append(player['id'])
                else:
                    print(f"❌ Team 2 Player {i+1} is missing ID field")
                    all_players_have_ids = False
        else:
            print("❌ Team 2 players missing in scoreboard")
            all_players_have_ids = False
    
    # Check if we have player IDs in the map compositions
    if 'data' in scoreboard_data and 'maps' in scoreboard_data['data'] and scoreboard_data['data']['maps']:
        for map_idx, map_data in enumerate(scoreboard_data['data']['maps']):
            print(f"\n----- Map {map_idx+1} Player IDs -----")
            
            if 'team1_composition' in map_data:
                for i, player in enumerate(map_data['team1_composition']):
                    if 'player_id' in player and player['player_id']:
                        print(f"✅ Team 1 Player {i+1} has ID in map composition: {player['player_id']}")
                        if player['player_id'] not in player_ids:
                            player_ids.append(player['player_id'])
                    else:
                        print(f"❌ Team 1 Player {i+1} is missing player_id field in map composition")
            
            if 'team2_composition' in map_data:
                for i, player in enumerate(map_data['team2_composition']):
                    if 'player_id' in player and player['player_id']:
                        print(f"✅ Team 2 Player {i+1} has ID in map composition: {player['player_id']}")
                        if player['player_id'] not in player_ids:
                            player_ids.append(player['player_id'])
                    else:
                        print(f"❌ Team 2 Player {i+1} is missing player_id field in map composition")
    
    return all_players_have_ids, player_ids

def main():
    # Setup
    tester = MarvelRivalsAPITester()
    
    print("\n🚀 Starting Marvel Rivals API Tests - Focused on Live Scoring Functionality\n")
    print(f"🌐 Base URL: {tester.base_url}")
    print(f"🌐 API URL: {tester.api_url}")
    
    # 1. TEST MATCH SCOREBOARD FOR MATCH ID 114
    print("\n===== TESTING MATCH SCOREBOARD FOR MATCH ID 114 =====")
    success_scoreboard, scoreboard_data = tester.test_get_match_scoreboard(114)
    
    if not success_scoreboard:
        print("❌ Failed to get scoreboard data for match ID 114")
        tester.print_summary()
        return 1
    
    # 2. CHECK PLAYER IDs IN SCOREBOARD DATA
    all_players_have_ids, player_ids = check_player_ids(scoreboard_data)
    
    if not all_players_have_ids:
        print("❌ Not all players have proper ID fields")
    else:
        print("✅ All players have proper ID fields")
    
    # 3. TEST PLAYER STATS UPDATE
    if player_ids:
        print("\n===== TESTING PLAYER STATS UPDATE =====")
        
        # Try to login first to get authentication token
        login_success = tester.login()
        
        # Use the first player ID from the list
        test_player_id = player_ids[0]
        
        # Sample stats data
        stats_data = {
            "kills": 15,
            "deaths": 8,
            "assists": 10,
            "damage": 12500,
            "healing": 0,
            "ultimate_count": 3,
            "hero": "Captain America"
        }
        
        success_update, update_response = tester.test_update_player_stats(114, test_player_id, stats_data)
        
        if success_update:
            print(f"✅ Successfully updated stats for player ID {test_player_id}")
            
            # Verify the update by getting the scoreboard again
            print("\n----- VERIFYING STATS UPDATE -----")
            success_verify, updated_scoreboard = tester.test_get_match_scoreboard(114)
            
            if success_verify:
                print("✅ Successfully retrieved updated scoreboard")
                # We would check for updated stats here, but that depends on the response structure
            else:
                print("❌ Failed to verify stats update")
        else:
            print(f"❌ Failed to update stats for player ID {test_player_id}")
            
            # Try without authentication as a fallback
            print("\n----- TRYING WITHOUT AUTHENTICATION -----")
            success_no_auth, update_response_no_auth = tester.run_test(
                f"Update Player Stats for Match ID 114, Player ID {test_player_id} (No Auth)",
                "POST",
                f"matches/114/players/{test_player_id}/stats",
                200,
                data=stats_data
            )
            
            if success_no_auth:
                print(f"✅ Successfully updated stats for player ID {test_player_id} without authentication")
            else:
                print(f"❌ Failed to update stats for player ID {test_player_id} without authentication")
    else:
        print("❌ No player IDs found to test stats update")
    
    # 4. TEST WITH INVALID PLAYER ID
    print("\n===== TESTING WITH INVALID PLAYER ID =====")
    invalid_player_id = "invalid_id_12345"
    
    stats_data = {
        "kills": 10,
        "deaths": 5,
        "assists": 7,
        "damage": 8000,
        "healing": 0,
        "ultimate_count": 2,
        "hero": "Iron Man"
    }
    
    # Try both with and without authentication
    if tester.token:
        success_invalid, invalid_response = tester.test_update_player_stats(114, invalid_player_id, stats_data)
    else:
        success_invalid, invalid_response = tester.run_test(
            f"Update Player Stats for Match ID 114, Player ID {invalid_player_id} (No Auth)",
            "POST",
            f"matches/114/players/{invalid_player_id}/stats",
            404,  # Expecting 404 for invalid player ID
            data=stats_data
        )
    
    if not success_invalid:
        print("✅ Correctly rejected update with invalid player ID")
    else:
        print("❌ Unexpectedly accepted update with invalid player ID")
    
    # 5. SUMMARY OF FINDINGS
    print("\n===== SUMMARY OF FINDINGS =====")
    print(f"✅ Match scoreboard endpoint: {'Working' if success_scoreboard else 'Not working'}")
    print(f"✅ Player IDs in scoreboard: {'All present' if all_players_have_ids else 'Some missing'}")
    
    if player_ids:
        if tester.token:
            print(f"✅ Player stats update endpoint (with auth): {'Working' if success_update else 'Not working'}")
        else:
            print(f"✅ Player stats update endpoint (no auth): {'Working' if success_no_auth else 'Not working'}")
    else:
        print("❌ Could not test player stats update due to missing player IDs")
    
    # Print summary
    tester.print_summary()
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())