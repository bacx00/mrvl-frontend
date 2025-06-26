import requests
import sys
import json
from datetime import datetime, timedelta
import time

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

    def test_get_matches(self):
        """Test getting matches list"""
        return self.run_test(
            "Get Matches",
            "GET",
            "matches",
            200
        )

    def test_get_match_detail(self, match_id):
        """Test getting match detail with team and player information"""
        return self.run_test(
            f"Get Match Detail for ID {match_id}",
            "GET",
            f"matches/{match_id}",
            200
        )
    
    def test_get_match_scoreboard(self, match_id):
        """Test getting match scoreboard with detailed information"""
        return self.run_test(
            f"Get Match Scoreboard for ID {match_id}",
            "GET",
            f"matches/{match_id}/scoreboard",
            200
        )
    
    def test_create_match_with_maps_data(self, match_data):
        """Test creating a new match with maps_data payload"""
        return self.run_test(
            "Create New Match with maps_data",
            "POST",
            "admin/matches",
            201,
            data=match_data,
            admin_auth=True
        )
    
    def compare_match_endpoints(self, match_id):
        """Compare the data returned by match detail and scoreboard endpoints"""
        print(f"\n🔍 Comparing Match Detail vs Scoreboard for Match ID {match_id}...")
        
        # Get match detail
        success_detail, detail_data = self.test_get_match_detail(match_id)
        
        # Get match scoreboard
        success_scoreboard, scoreboard_data = self.test_get_match_scoreboard(match_id)
        
        if success_detail and success_scoreboard:
            print("\n📊 Comparing data between endpoints:")
            
            # Check if scoreboard has more complete data
            scoreboard_has_more_data = False
            
            # Check for hero compositions
            if 'team1_heroes' in scoreboard_data and 'team1_heroes' not in detail_data:
                print("✅ Scoreboard includes team1_heroes data that detail endpoint doesn't have")
                scoreboard_has_more_data = True
            
            if 'team2_heroes' in scoreboard_data and 'team2_heroes' not in detail_data:
                print("✅ Scoreboard includes team2_heroes data that detail endpoint doesn't have")
                scoreboard_has_more_data = True
            
            # Check for maps data
            if 'maps_data' in scoreboard_data and 'maps_data' not in detail_data:
                print("✅ Scoreboard includes maps_data that detail endpoint doesn't have")
                scoreboard_has_more_data = True
            elif 'maps_data' in scoreboard_data and 'maps_data' in detail_data:
                if len(scoreboard_data['maps_data']) > len(detail_data.get('maps_data', [])):
                    print("✅ Scoreboard includes more complete maps_data than detail endpoint")
                    scoreboard_has_more_data = True
            
            # Check for team logos
            if ('team1_logo' in scoreboard_data and 'team1_logo' not in detail_data) or \
               ('team2_logo' in scoreboard_data and 'team2_logo' not in detail_data):
                print("✅ Scoreboard includes team logo data that detail endpoint doesn't have")
                scoreboard_has_more_data = True
            
            # Check for player information
            if 'players' in scoreboard_data and 'players' not in detail_data:
                print("✅ Scoreboard includes player data that detail endpoint doesn't have")
                scoreboard_has_more_data = True
            elif 'players' in scoreboard_data and 'players' in detail_data:
                if len(scoreboard_data['players']) > len(detail_data.get('players', [])):
                    print("✅ Scoreboard includes more complete player data than detail endpoint")
                    scoreboard_has_more_data = True
            
            if scoreboard_has_more_data:
                print("\n✅ CONFIRMED: The /scoreboard endpoint returns more complete match data")
                return True
            else:
                print("\n❌ The /scoreboard endpoint does not return more complete data than the detail endpoint")
                return False
        else:
            print("\n❌ Could not compare endpoints due to API errors")
            return False
    
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

def main():
    # Setup
    tester = MarvelRivalsAPITester()
    
    print("\n🚀 Starting Marvel Rivals API Tests - Focused on Review Requirements\n")
    print(f"🌐 Base URL: {tester.base_url}")
    print(f"🌐 API URL: {tester.api_url}")
    
    # 1. AUTHENTICATION TESTING
    print("\n===== TESTING AUTHENTICATION =====")
    login_success = tester.login("jhonny@ar-mediia.com", "password123")
    
    if not login_success:
        print("⚠️ Login failed. Some tests requiring authentication will be skipped.")
    
    # 2. GET MATCHES TO FIND VALID MATCH IDs
    print("\n===== GETTING MATCHES FOR TESTING =====")
    success, matches_data = tester.test_get_matches()
    
    if success and matches_data:
        matches = matches_data if isinstance(matches_data, list) else matches_data.get('data', [])
        if matches and len(matches) > 0:
            # Get a valid match ID for testing
            match_id = matches[0]['id']
            print(f"\n✅ Found valid match ID for testing: {match_id}")
            
            # 3. TEST MATCH DETAIL ENDPOINT
            print("\n===== TESTING MATCH DETAIL ENDPOINT =====")
            tester.test_get_match_detail(match_id)
            
            # 4. TEST MATCH SCOREBOARD ENDPOINT
            print("\n===== TESTING MATCH SCOREBOARD ENDPOINT =====")
            tester.test_get_match_scoreboard(match_id)
            
            # 5. COMPARE MATCH DETAIL VS SCOREBOARD ENDPOINTS
            print("\n===== COMPARING MATCH DETAIL VS SCOREBOARD ENDPOINTS =====")
            tester.compare_match_endpoints(match_id)
        else:
            print("❌ No matches found for testing")
    else:
        print("❌ Failed to get matches for testing")
    
    # 6. TEST MATCH CREATION WITH MAPS_DATA (if authenticated as admin)
    if login_success and tester.admin_token:
        print("\n===== TESTING MATCH CREATION WITH MAPS_DATA =====")
        
        # Set scheduled_at to a future date (tomorrow)
        tomorrow = (datetime.now() + timedelta(days=1)).isoformat()
        
        # Create match data with maps_data payload
        match_data = {
            "team1_id": 83,
            "team2_id": 84,
            "event_id": 12,
            "format": "BO3",
            "scheduled_at": tomorrow,
            "status": "upcoming",
            "maps_data": [
                {
                    "map_name": "Tokyo 2099",
                    "map_type": "Control",
                    "team1_heroes": ["Captain America", "Iron Man", "Black Widow"],
                    "team2_heroes": ["Hulk", "Thor", "Storm"]
                },
                {
                    "map_name": "Asgard",
                    "map_type": "Escort",
                    "team1_heroes": ["Spider-Man", "Rocket Raccoon", "Venom"],
                    "team2_heroes": ["Magneto", "Doctor Strange", "Loki"]
                },
                {
                    "map_name": "Klyntar",
                    "map_type": "Hybrid",
                    "team1_heroes": ["Black Panther", "Scarlet Witch", "Wolverine"],
                    "team2_heroes": ["Deadpool", "Gambit", "Mystique"]
                }
            ]
        }
        
        success, created_match = tester.test_create_match_with_maps_data(match_data)
        
        if success and created_match and 'id' in created_match:
            new_match_id = created_match['id']
            print(f"\n✅ Successfully created match with ID: {new_match_id}")
            
            # Wait a moment for the data to be saved
            print("Waiting for data to be saved...")
            time.sleep(2)
            
            # Verify the match was created with maps_data
            print("\n===== VERIFYING CREATED MATCH DATA =====")
            success, match_detail = tester.test_get_match_detail(new_match_id)
            
            if success:
                # Check if maps_data was saved correctly
                if 'maps_data' in match_detail and len(match_detail['maps_data']) == 3:
                    print("✅ maps_data was saved correctly with 3 maps")
                    
                    # Check if hero compositions were saved
                    heroes_saved = True
                    for i, map_data in enumerate(match_detail['maps_data']):
                        if 'team1_heroes' not in map_data or 'team2_heroes' not in map_data:
                            heroes_saved = False
                            print(f"❌ Hero compositions not saved for map {i+1}")
                    
                    if heroes_saved:
                        print("✅ Hero compositions were saved correctly for all maps")
                else:
                    print("❌ maps_data was not saved correctly")
            
            # Also check the scoreboard endpoint for the new match
            print("\n===== CHECKING SCOREBOARD FOR CREATED MATCH =====")
            success, scoreboard_data = tester.test_get_match_scoreboard(new_match_id)
            
            if success:
                # Check if maps_data is in the scoreboard
                if 'maps_data' in scoreboard_data and len(scoreboard_data['maps_data']) == 3:
                    print("✅ maps_data is present in the scoreboard endpoint")
                    
                    # Check if hero compositions are in the scoreboard
                    heroes_in_scoreboard = True
                    for i, map_data in enumerate(scoreboard_data['maps_data']):
                        if 'team1_heroes' not in map_data or 'team2_heroes' not in map_data:
                            heroes_in_scoreboard = False
                            print(f"❌ Hero compositions not in scoreboard for map {i+1}")
                    
                    if heroes_in_scoreboard:
                        print("✅ Hero compositions are present in the scoreboard endpoint")
                else:
                    print("❌ maps_data is not present in the scoreboard endpoint")
    else:
        print("\n⚠️ Skipping match creation test due to authentication failure")
    
    # Print summary
    tester.print_summary()
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())