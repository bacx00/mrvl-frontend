
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

    def test_get_teams(self):
        """Test getting teams list"""
        return self.run_test(
            "Get Teams",
            "GET",
            "teams",
            200
        )
    
    def test_get_team_players(self, team_id):
        """Test getting players for a specific team"""
        return self.run_test(
            f"Get Players for Team ID {team_id}",
            "GET",
            f"teams/{team_id}/players",
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
    
    def test_create_match(self, match_data):
        """Test creating a new match"""
        return self.run_test(
            "Create New Match",
            "POST",
            "admin/matches",
            201,
            data=match_data,
            admin_auth=True
        )
    
    def test_update_match_status(self, match_id, status):
        """Test updating match status"""
        return self.run_test(
            f"Update Match Status for ID {match_id}",
            "PUT",
            f"admin/matches/{match_id}",
            200,
            data={"status": status},
            admin_auth=True
        )
    
    def test_delete_match(self, match_id):
        """Test deleting a match"""
        return self.run_test(
            f"Delete Match ID {match_id}",
            "DELETE",
            f"admin/matches/{match_id}",
            204,
            admin_auth=True
        )
    
    def test_get_heroes(self):
        """Test getting heroes list"""
        return self.run_test(
            "Get Heroes",
            "GET",
            "heroes",
            200
        )
    
    def test_update_player_stats(self, match_id, player_id, stats_data):
        """Test updating player stats for a match"""
        return self.run_test(
            f"Update Player Stats for Match ID {match_id}, Player ID {player_id}",
            "PUT",
            f"admin/matches/{match_id}/players/{player_id}/stats",
            200,
            data=stats_data,
            admin_auth=True
        )
    
    def test_get_events(self):
        """Test getting events list"""
        return self.run_test(
            "Get Events",
            "GET",
            "events",
            200
        )
    
    def test_get_event_matches(self, event_id):
        """Test getting matches for a specific event"""
        return self.run_test(
            f"Get Matches for Event ID {event_id}",
            "GET",
            f"events/{event_id}/matches",
            200
        )
    
    def test_get_event_teams(self, event_id):
        """Test getting teams for a specific event"""
        return self.run_test(
            f"Get Teams for Event ID {event_id}",
            "GET",
            f"events/{event_id}/teams",
            200
        )
    
    def test_get_admin_analytics(self):
        """Test getting admin analytics"""
        return self.run_test(
            "Get Admin Analytics",
            "GET",
            "admin/analytics",
            200,
            admin_auth=True
        )
    
    def test_admin_thread_pin(self, thread_id):
        """Test pinning a thread"""
        return self.run_test(
            f"Pin Thread ID {thread_id}",
            "POST",
            f"admin/forums/threads/{thread_id}/pin",
            200,
            admin_auth=True
        )
    
    def test_admin_thread_unpin(self, thread_id):
        """Test unpinning a thread"""
        return self.run_test(
            f"Unpin Thread ID {thread_id}",
            "POST",
            f"admin/forums/threads/{thread_id}/unpin",
            200,
            admin_auth=True
        )
    
    def test_admin_thread_lock(self, thread_id):
        """Test locking a thread"""
        return self.run_test(
            f"Lock Thread ID {thread_id}",
            "POST",
            f"admin/forums/threads/{thread_id}/lock",
            200,
            admin_auth=True
        )
    
    def test_admin_thread_unlock(self, thread_id):
        """Test unlocking a thread"""
        return self.run_test(
            f"Unlock Thread ID {thread_id}",
            "POST",
            f"admin/forums/threads/{thread_id}/unlock",
            200,
            admin_auth=True
        )
    
    def test_update_thread(self, thread_id, data):
        """Test updating a thread"""
        return self.run_test(
            f"Update Thread ID {thread_id}",
            "PUT",
            f"admin/forums/threads/{thread_id}",
            200,
            data=data,
            admin_auth=True
        )
    
    def test_get_players(self):
        """Test getting players list"""
        return self.run_test(
            "Get Players",
            "GET",
            "players",
            200
        )
    
    def test_get_matches(self):
        """Test getting matches list"""
        return self.run_test(
            "Get Matches",
            "GET",
            "matches",
            200
        )
    
    def test_get_forum_threads(self):
        """Test getting forum threads"""
        return self.run_test(
            "Get Forum Threads",
            "GET",
            "forums/threads",
            200
        )
    
    def test_create_forum_thread(self, title, content):
        """Test creating a forum thread"""
        return self.run_test(
            "Create Forum Thread",
            "POST",
            "forums/threads",
            201,
            data={"title": title, "content": content},
            auth=True
        )
    
    def test_get_user(self):
        """Test getting user profile"""
        return self.run_test(
            "Get User Profile",
            "GET",
            "user",
            200,
            auth=True
        )
    
    def test_logout(self):
        """Test logout"""
        return self.run_test(
            "User Logout",
            "POST",
            "logout",
            200,
            auth=True
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
                    if 'details' in issue:
                        if isinstance(issue['details'], list):
                            for detail in issue['details']:
                                print(f"   - {detail}")
                        else:
                            print(f"   - Expected: {issue['details'].get('expected')}")
                            print(f"   - Actual: {issue['details'].get('actual')}")
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
    
    # 2. MATCH MANAGEMENT API TESTING
    print("\n===== TESTING MATCH MANAGEMENT ENDPOINTS =====")
    
    # 2.1 Test GET /api/matches - List all matches
    success, matches_data = tester.test_get_matches()
    
    # 2.2 Test GET /api/matches/{id} - Get specific match details
    if success and matches_data:
        matches = matches_data if isinstance(matches_data, list) else matches_data.get('data', [])
        if matches and len(matches) > 0:
            match_id = matches[0]['id']
            tester.test_get_match_detail(match_id)
    
    # 2.3 Test Team and Player APIs
    print("\n===== TESTING TEAMS & PLAYERS API =====")
    tester.test_get_teams()
    tester.test_get_players()
    
    # Test specific team IDs as mentioned in the review request
    test_team_ids = [83, 84]
    for team_id in test_team_ids:
        tester.test_get_team_players(team_id)
    
    # 2.4 Test Events API
    print("\n===== TESTING EVENTS API =====")
    tester.test_get_events()
    
    # Test specific event ID as mentioned in the review request
    event_id = 12
    tester.test_get_event_matches(event_id)
    tester.test_get_event_teams(event_id)
    
    # 3. SPECIFIC MATCH WORKFLOW TESTS
    if login_success:
        print("\n===== TESTING MATCH WORKFLOWS =====")
        
        # 3.1 Test BO1 Match Complete Workflow
        print("\n----- TEST 1: BO1 MATCH COMPLETE WORKFLOW -----")
        bo1_match_data = {
            "team1_id": test_team_ids[0],
            "team2_id": test_team_ids[1],
            "event_id": 18,  # Using a valid event ID from the events list
            "format": "BO1",
            "scheduled_at": datetime.now().isoformat(),
            "status": "upcoming"
        }
        
        success, created_match = tester.test_create_match(bo1_match_data)
        
        if success and created_match and 'id' in created_match:
            bo1_match_id = created_match['id']
            
            # Verify response includes exactly 1 map
            if 'maps' in created_match and len(created_match['maps']) == 1:
                print("✅ BO1 match has exactly 1 map")
            else:
                print("❌ BO1 match does not have exactly 1 map")
            
            # Update status to "live"
            tester.test_update_match_status(bo1_match_id, "live")
            
            # Update team scores
            score_data = {
                "score1": 13,
                "score2": 7
            }
            tester.run_test(
                f"Update Match Score for ID {bo1_match_id}",
                "PUT",
                f"admin/matches/{bo1_match_id}/score",
                200,
                data=score_data,
                admin_auth=True
            )
            
            # Complete match
            tester.test_update_match_status(bo1_match_id, "completed")
            
            # Verify all data persists correctly
            success, match_detail = tester.test_get_match_detail(bo1_match_id)
            if success:
                if match_detail['status'] == 'completed' and match_detail['score1'] == 13 and match_detail['score2'] == 7:
                    print("✅ BO1 match data persists correctly")
                else:
                    print("❌ BO1 match data does not persist correctly")
        
        # 3.2 Test BO3 Match Complete Workflow
        print("\n----- TEST 2: BO3 MATCH COMPLETE WORKFLOW -----")
        bo3_match_data = {
            "team1_id": test_team_ids[0],
            "team2_id": test_team_ids[1],
            "event_id": 18,  # Using a valid event ID from the events list
            "format": "BO3",
            "scheduled_at": datetime.now().isoformat(),
            "status": "upcoming"
        }
        
        success, created_match = tester.test_create_match(bo3_match_data)
        
        if success and created_match and 'id' in created_match:
            bo3_match_id = created_match['id']
            
            # Verify response includes exactly 3 maps
            if 'maps' in created_match and len(created_match['maps']) == 3:
                print("✅ BO3 match has exactly 3 maps")
            else:
                print("❌ BO3 match does not have exactly 3 maps")
            
            # Test map-by-map progression
            tester.test_update_match_status(bo3_match_id, "live")
            
            # Update map 1 scores
            map1_data = {
                "map_index": 0,
                "score1": 13,
                "score2": 7
            }
            tester.run_test(
                f"Update Map 1 Score for Match ID {bo3_match_id}",
                "PUT",
                f"admin/matches/{bo3_match_id}/maps/0",
                200,
                data=map1_data,
                admin_auth=True
            )
            
            # Update map 2 scores
            map2_data = {
                "map_index": 1,
                "score1": 7,
                "score2": 13
            }
            tester.run_test(
                f"Update Map 2 Score for Match ID {bo3_match_id}",
                "PUT",
                f"admin/matches/{bo3_match_id}/maps/1",
                200,
                data=map2_data,
                admin_auth=True
            )
            
            # Update map 3 scores
            map3_data = {
                "map_index": 2,
                "score1": 13,
                "score2": 11
            }
            tester.run_test(
                f"Update Map 3 Score for Match ID {bo3_match_id}",
                "PUT",
                f"admin/matches/{bo3_match_id}/maps/2",
                200,
                data=map3_data,
                admin_auth=True
            )
            
            # Complete match
            tester.test_update_match_status(bo3_match_id, "completed")
            
            # Verify all data persists correctly
            success, match_detail = tester.test_get_match_detail(bo3_match_id)
            if success and 'maps' in match_detail and len(match_detail['maps']) == 3:
                map_scores_correct = (
                    match_detail['maps'][0]['score1'] == 13 and match_detail['maps'][0]['score2'] == 7 and
                    match_detail['maps'][1]['score1'] == 7 and match_detail['maps'][1]['score2'] == 13 and
                    match_detail['maps'][2]['score1'] == 13 and match_detail['maps'][2]['score2'] == 11
                )
                if map_scores_correct:
                    print("✅ BO3 match map scores persist correctly")
                else:
                    print("❌ BO3 match map scores do not persist correctly")
        
        # 3.3 Test BO5 Match Creation
        print("\n----- TEST 3: BO5 MATCH CREATION -----")
        bo5_match_data = {
            "team1_id": test_team_ids[0],
            "team2_id": test_team_ids[1],
            "event_id": event_id,
            "format": "BO5",
            "date": datetime.now().isoformat(),
            "status": "upcoming"
        }
        
        success, created_match = tester.test_create_match(bo5_match_data)
        
        if success and created_match and 'id' in created_match:
            # Verify response includes exactly 5 maps
            if 'maps' in created_match and len(created_match['maps']) == 5:
                print("✅ BO5 match has exactly 5 maps")
            else:
                print("❌ BO5 match does not have exactly 5 maps")
            
            # Clean up by deleting the match
            tester.test_delete_match(created_match['id'])
    else:
        print("\n⚠️ Skipping match workflow tests due to authentication failure")
    
    # 4. ERROR HANDLING TESTS
    print("\n===== TESTING ERROR HANDLING =====")
    
    # 4.1 Test invalid match ID
    tester.run_test(
        "Get Non-existent Match",
        "GET",
        "matches/99999",
        404
    )
    
    # 4.2 Test unauthorized access to admin endpoints
    tester.run_test(
        "Unauthorized Access to Admin Analytics",
        "GET",
        "admin/analytics",
        401
    )
    
    # Print summary
    tester.print_summary()
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
