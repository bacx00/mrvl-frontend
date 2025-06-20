
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
    
    print("\n🚀 Starting Marvel Rivals API Tests - Focused on Review Requirements\n")
    print(f"🌐 Base URL: {tester.base_url}")
    print(f"🌐 API URL: {tester.api_url}")
    
    # Try to login to get authentication token for admin operations
    tester.login()
    
    # 1. Test Match Detail Endpoints
    print("\n===== TESTING MATCH DETAIL ENDPOINTS =====")
    success, matches_data = tester.test_get_matches()
    if success:
        matches = matches_data if isinstance(matches_data, list) else matches_data.get('data', [])
        if matches and len(matches) > 0:
            # Test the first match in the list
            match_id = matches[0]['id']
            success, match_detail = tester.test_get_match_detail(match_id)
            if success:
                print(f"✅ Match detail endpoint returns team and player information")
                # Verify team information
                if 'team1' in match_detail and 'team2' in match_detail:
                    print(f"✅ Team data is present in match details")
                else:
                    print(f"❌ Team data is missing in match details")
                
                # Verify player information
                if 'players' in match_detail:
                    print(f"✅ Player data is present in match details")
                else:
                    print(f"❌ Player data is missing in match details")
        else:
            print("❌ No matches found to test match detail endpoint")
    
    # 2. Test Live Scoring Endpoints
    print("\n===== TESTING LIVE SCORING ENDPOINTS =====")
    if matches and len(matches) > 0:
        match_id = matches[0]['id']
        # Test updating match score
        score_data = {
            "score1": 3,
            "score2": 2
        }
        tester.test_update_match_score(match_id, score_data)
        
        # Test updating match details
        match_data = {
            "score1": 3,
            "score2": 2,
            "date": datetime.now().isoformat()
        }
        tester.test_update_match(match_id, match_data)
    else:
        print("❌ No matches found to test live scoring endpoints")
    
    # 3. Test News System
    print("\n===== TESTING NEWS SYSTEM =====")
    success, news_data = tester.test_get_news()
    if success:
        news_articles = news_data if isinstance(news_data, list) else news_data.get('data', [])
        if news_articles and len(news_articles) > 0:
            # Test the first news article in the list
            news_id = news_articles[0]['id']
            tester.test_get_news_detail(news_id)
            
            # Test non-existent news article (should return 404)
            non_existent_id = 9999
            tester.test_get_news_detail_not_found(non_existent_id)
        else:
            print("❌ No news articles found to test news detail endpoint")
    
    # 4. Test Teams and Players
    print("\n===== TESTING TEAMS AND PLAYERS ENDPOINTS =====")
    success, teams_data = tester.test_get_teams()
    if success:
        teams = teams_data if isinstance(teams_data, list) else teams_data.get('data', [])
        if teams and len(teams) > 0:
            # Test specific team IDs as mentioned in the review request
            test_team_ids = [83, 84]
            for team_id in test_team_ids:
                success, players_data = tester.test_get_team_players(team_id)
                if success:
                    players = players_data if isinstance(players_data, list) else players_data.get('data', [])
                    print(f"✅ Team {team_id} has {len(players)} players")
        else:
            print("❌ No teams found to test team players endpoint")
    
    # 5. Test Events Integration
    print("\n===== TESTING EVENTS INTEGRATION =====")
    success, events_data = tester.test_get_events()
    if success:
        events = events_data if isinstance(events_data, list) else events_data.get('data', [])
        if events and len(events) > 0:
            # Test specific event ID as mentioned in the review request
            event_id = 12
            tester.test_get_event_matches(event_id)
            tester.test_get_event_teams(event_id)
        else:
            print("❌ No events found to test event integration endpoints")
    
    # Print summary
    tester.print_summary()
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
