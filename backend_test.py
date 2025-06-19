
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

    def login(self, email="admin@mrvl.net", password="password"):
        """Login to get authentication token"""
        print("\n🔑 Attempting to login...")
        success, data = self.run_test(
            "User Login",
            "POST",
            "login",
            200,
            {"email": email, "password": password}
        )
        
        if success and 'token' in data:
            self.token = data['token']
            print(f"✅ Login successful! Token: {self.token[:10]}...")
            
            # Check if user is admin
            if data.get('user', {}).get('role') == 'admin':
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
    
    def test_update_match_score(self, match_id, score_data):
        """Test updating match score"""
        return self.run_test(
            f"Update Match Score for ID {match_id}",
            "PUT",
            f"matches/{match_id}/score",
            200,
            data=score_data
        )
    
    def test_update_match(self, match_id, match_data):
        """Test updating match details"""
        return self.run_test(
            f"Update Match for ID {match_id}",
            "PUT",
            f"matches/{match_id}",
            200,
            data=match_data
        )
    
    def test_get_news(self):
        """Test getting news articles"""
        return self.run_test(
            "Get News Articles",
            "GET",
            "news",
            200
        )
    
    def test_get_news_detail(self, news_id):
        """Test getting news article detail"""
        return self.run_test(
            f"Get News Article Detail for ID {news_id}",
            "GET",
            f"news/{news_id}",
            200
        )
    
    def test_get_news_detail_not_found(self, news_id):
        """Test getting non-existent news article (should return 404)"""
        return self.run_test(
            f"Get Non-existent News Article (ID {news_id})",
            "GET",
            f"news/{news_id}",
            404
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
    
    print("\n🚀 Starting Marvel Rivals API Tests - Comprehensive Backend Audit\n")
    print(f"🌐 Base URL: {tester.base_url}")
    print(f"🌐 API URL: {tester.api_url}")
    
    # Try to login to get authentication token for admin operations
    tester.login()
    
    # 1. Test newly added endpoints
    print("\n===== TESTING NEWLY ADDED ENDPOINTS =====")
    
    # Test team players endpoints
    print("\n----- Testing Team Players Endpoints -----")
    success, teams_data = tester.test_get_teams()
    if success:
        teams = teams_data if isinstance(teams_data, list) else teams_data.get('data', [])
        # Test specific team IDs as mentioned in the review request
        test_team_ids = [83, 84]
        for team_id in test_team_ids:
            tester.test_get_team_players(team_id)
    
    # Test event-related endpoints
    print("\n----- Testing Event-Related Endpoints -----")
    success, events_data = tester.test_get_events()
    if success:
        events = events_data if isinstance(events_data, list) else events_data.get('data', [])
        # Test specific event ID as mentioned in the review request
        event_id = 12
        tester.test_get_event_matches(event_id)
        tester.test_get_event_teams(event_id)
    
    # Test admin analytics endpoint
    print("\n----- Testing Admin Analytics Endpoint -----")
    tester.test_get_admin_analytics()
    
    # Test forum thread admin operations
    print("\n----- Testing Forum Thread Admin Operations -----")
    thread_id = 16  # As mentioned in the review request
    tester.test_admin_thread_pin(thread_id)
    tester.test_admin_thread_unpin(thread_id)
    tester.test_admin_thread_lock(thread_id)
    tester.test_admin_thread_unlock(thread_id)
    
    # 2. Test SQL fix verification
    print("\n===== TESTING SQL FIX VERIFICATION =====")
    # Test updating thread with pinned status
    tester.test_update_thread(thread_id, {"pinned": True})
    tester.test_update_thread(thread_id, {"pinned": False})
    
    # 3. Test core platform endpoints
    print("\n===== TESTING CORE PLATFORM ENDPOINTS =====")
    tester.test_get_teams()
    tester.test_get_players()
    tester.test_get_matches()
    tester.test_get_events()
    tester.test_get_forum_threads()
    
    # Test forum thread creation if logged in
    if tester.token:
        tester.test_create_forum_thread("Test Thread from API Audit", "This is a test thread created during the API audit.")
    
    # 4. Test authentication endpoints
    print("\n===== TESTING AUTHENTICATION ENDPOINTS =====")
    # Login was already tested at the beginning
    if tester.token:
        tester.test_get_user()
        tester.test_logout()
    
    # Print summary
    tester.print_summary()
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
