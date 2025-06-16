
import requests
import sys
import json
from datetime import datetime

class MarvelRivalsAPITester:
    def __init__(self, base_url="https://staging.mrvl.net"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"  # API URL with /api prefix
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.issues = []
        self.debug = True

    def log(self, message):
        """Print debug messages if debug is enabled"""
        if self.debug:
            print(f"DEBUG: {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, auth=False, with_api_prefix=True):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if with_api_prefix else f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json', 'Accept': 'application/json'}
        
        if auth and self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
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

    def test_get_players(self):
        """Test getting players list"""
        return self.run_test(
            "Get Players",
            "GET",
            "players",
            200
        )
    
    def test_get_player_detail(self, player_id):
        """Test getting player detail"""
        return self.run_test(
            f"Get Player Detail for ID {player_id}",
            "GET",
            f"players/{player_id}",
            200
        )
    
    def test_get_players_by_team(self, team_id):
        """Test getting players by team ID"""
        return self.run_test(
            f"Get Players for Team ID {team_id}",
            "GET",
            f"players?team_id={team_id}",
            200
        )
    
    def test_player_team_consistency(self):
        """Test if players are correctly associated with their teams"""
        print("\n🔍 Testing Player-Team Consistency...")
        
        # Get all players
        success, all_players = self.test_get_players()
        if not success:
            print("❌ Failed to get all players")
            return False
        
        players_list = all_players if isinstance(all_players, list) else all_players.get('data', [])
        if not players_list:
            print("❌ No players found in the response")
            return False
        
        # Check a sample of players to verify team consistency
        inconsistencies = []
        for player in players_list[:5]:  # Check first 5 players
            player_id = player.get('id')
            team_id = player.get('team_id')
            
            if not player_id or not team_id:
                continue
                
            # Get player detail
            success, player_detail = self.test_get_player_detail(player_id)
            if not success:
                continue
                
            # Check if team ID matches
            detail_team_id = player_detail.get('team_id') or (player_detail.get('team', {}) or {}).get('id')
            
            if detail_team_id != team_id:
                inconsistencies.append({
                    'player_id': player_id,
                    'player_name': player.get('name'),
                    'list_team_id': team_id,
                    'detail_team_id': detail_team_id
                })
        
        if inconsistencies:
            print("❌ Found player-team inconsistencies:")
            for issue in inconsistencies:
                print(f"   - Player {issue['player_name']} (ID: {issue['player_id']}): List team ID {issue['list_team_id']} vs Detail team ID {issue['detail_team_id']}")
            
            self.issues.append({
                "test": "Player-Team Consistency",
                "error": "Players have inconsistent team associations",
                "details": inconsistencies
            })
            return False
        
        print("✅ All checked players have consistent team associations")
        return True
    
    def test_specific_player_ids(self):
        """Test specific player IDs from the realPlayersMapping.js file"""
        print("\n🔍 Testing Specific Player IDs from realPlayersMapping.js...")
        
        # Test specific players mentioned in the review request
        test_players = [
            {"id": 101, "name": "TenZ", "team_id": 11},
            {"id": 106, "name": "Sacy", "team_id": 11},
            {"id": 201, "name": "Derke", "team_id": 13},
            {"id": 203, "name": "Chronicle", "team_id": 13}
        ]
        
        for player in test_players:
            print(f"\n🔍 Testing specific player: {player['name']} (ID: {player['id']}, Expected Team ID: {player['team_id']})")
            success, player_detail = self.test_get_player_detail(player['id'])
            
            if not success:
                print(f"❌ Failed to get player detail for {player['name']} (ID: {player['id']})")
                continue
            
            # Check if player data matches expected values
            actual_name = player_detail.get('name')
            actual_team_id = player_detail.get('team_id')
            
            if actual_name != player['name'] or actual_team_id != player['team_id']:
                print(f"❌ Player data mismatch:")
                print(f"   - Expected: Name={player['name']}, Team ID={player['team_id']}")
                print(f"   - Actual: Name={actual_name}, Team ID={actual_team_id}")
                
                self.issues.append({
                    "test": f"Specific Player Test - {player['name']} (ID: {player['id']})",
                    "error": "Player data mismatch",
                    "details": {
                        "expected": {"name": player['name'], "team_id": player['team_id']},
                        "actual": {"name": actual_name, "team_id": actual_team_id}
                    }
                })
            else:
                print(f"✅ Player data matches: Name={actual_name}, Team ID={actual_team_id}")
    
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
                    if 'details' in issue:
                        if isinstance(issue['details'], list):
                            for detail in issue['details']:
                                print(f"   - {detail}")
                        else:
                            print(f"   - Expected: {issue['details']['expected']}")
                            print(f"   - Actual: {issue['details']['actual']}")
                else:
                    print(f"   Expected: {issue['expected_status']}, Got: {issue['actual_status']}")
                    if issue['is_json'] and isinstance(issue['response'], dict):
                        print(f"   Response: {json.dumps(issue['response'], indent=2)[:200]}...")
                    else:
                        print(f"   Response: {issue['response']}")
        else:
            print("\n✅ No issues found! All tests passed.")

def main():
    # Setup
    tester = MarvelRivalsAPITester()
    
    print("\n🚀 Starting Marvel Rivals API Tests - Player Navigation Fix\n")
    print(f"🌐 Base URL: {tester.base_url}")
    print(f"🌐 API URL: {tester.api_url}")
    
    # Test player endpoints
    print("\n===== TESTING PLAYER ENDPOINTS =====")
    success, players_data = tester.test_get_players()
    
    if success:
        players_list = players_data if isinstance(players_data, list) else players_data.get('data', [])
        print(f"\n✅ Found {len(players_list)} players in the API")
        
        # Test a few player details
        if players_list:
            for player in players_list[:3]:  # Test first 3 players
                player_id = player.get('id')
                player_name = player.get('name')
                team_id = player.get('team_id')
                
                print(f"\n🔍 Testing player: {player_name} (ID: {player_id}, Team ID: {team_id})")
                tester.test_get_player_detail(player_id)
            
            # Test players by team
            if team_id:
                print(f"\n🔍 Testing players for team ID: {team_id}")
                success, team_players = tester.test_get_players_by_team(team_id)
                
                if success:
                    team_players_list = team_players if isinstance(team_players, list) else team_players.get('data', [])
                    print(f"✅ Found {len(team_players_list)} players for team ID {team_id}")
                    
                    # Check if all players in this response have the correct team_id
                    incorrect_team_ids = []
                    for p in team_players_list:
                        if p.get('team_id') != team_id:
                            incorrect_team_ids.append({
                                'player_id': p.get('id'),
                                'player_name': p.get('name'),
                                'expected_team_id': team_id,
                                'actual_team_id': p.get('team_id')
                            })
                    
                    if incorrect_team_ids:
                        print("❌ Found players with incorrect team IDs:")
                        for issue in incorrect_team_ids:
                            print(f"   - Player {issue['player_name']} (ID: {issue['player_id']}): Expected team ID {issue['expected_team_id']}, got {issue['actual_team_id']}")
                    else:
                        print("✅ All players have correct team ID")
    
    # Test player-team consistency
    print("\n===== TESTING PLAYER-TEAM CONSISTENCY =====")
    tester.test_player_team_consistency()
    
    # Test specific player IDs from realPlayersMapping.js
    print("\n===== TESTING SPECIFIC PLAYER IDS FROM REAL PLAYERS MAPPING =====")
    tester.test_specific_player_ids()
    
    # Print summary
    tester.print_summary()
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
