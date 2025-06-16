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

    def run_test(self, name, method, endpoint, expected_status, data=None, with_api_prefix=True):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if with_api_prefix else f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json', 'Accept': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name} - {url}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            
            # Check if response is JSON
            is_json = False
            response_data = {}
            try:
                response_data = response.json()
                is_json = True
            except:
                is_json = False
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if is_json:
                    print(f"📄 Response: {json.dumps(response_data, indent=2)[:200]}...")
                else:
                    print(f"📄 Response: {response.text[:200]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                if is_json:
                    print(f"📄 Response: {json.dumps(response_data, indent=2)[:200]}...")
                else:
                    print(f"📄 Response: {response.text[:200]}...")
                
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

    def test_login(self, email, password):
        """Test login with and without /api prefix"""
        # First try with /api prefix
        success, response = self.run_test(
            "Login (with /api prefix)",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password},
            with_api_prefix=True
        )
        
        if success and 'token' in response:
            self.token = response['token']
            return True
        
        # If that fails, try without /api prefix
        success, response = self.run_test(
            "Login (without /api prefix)",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password},
            with_api_prefix=False
        )
        
        if success and 'token' in response:
            self.token = response['token']
            return True
            
        return False

    def test_public_endpoints(self):
        """Test all public endpoints with and without /api prefix"""
        endpoints = ["teams", "players", "events", "matches", "news", "rankings"]
        
        for endpoint in endpoints:
            # Test with /api prefix
            self.run_test(
                f"Get {endpoint} (with /api prefix)",
                "GET",
                endpoint,
                200,
                with_api_prefix=True
            )
            
            # Test without /api prefix
            self.run_test(
                f"Get {endpoint} (without /api prefix)",
                "GET",
                endpoint,
                200,
                with_api_prefix=False
            )

    def test_admin_endpoints(self):
        """Test admin endpoints with and without /api prefix"""
        if not self.token:
            print("❌ Cannot test admin endpoints without authentication")
            return
            
        endpoints = ["admin/stats", "admin/users", "admin/teams", "admin/players", "admin/events", "admin/matches", "admin/news"]
        
        for endpoint in endpoints:
            # Test with /api prefix
            self.run_test(
                f"Get {endpoint} (with /api prefix)",
                "GET",
                endpoint,
                200,
                with_api_prefix=True
            )
            
            # Test without /api prefix
            self.run_test(
                f"Get {endpoint} (without /api prefix)",
                "GET",
                endpoint,
                200,
                with_api_prefix=False
            )

    def test_crud_operations(self):
        """Test CRUD operations for teams, players, events, matches, and news"""
        if not self.token:
            print("❌ Cannot test CRUD operations without authentication")
            return
            
        # Test team CRUD
        team_id = self.test_create_team()
        if team_id:
            self.test_get_team(team_id)
            self.test_update_team(team_id)
            self.test_delete_team(team_id)
            
        # Test player CRUD
        player_id = self.test_create_player()
        if player_id:
            self.test_get_player(player_id)
            self.test_update_player(player_id)
            self.test_delete_player(player_id)
            
        # Test event CRUD
        event_id = self.test_create_event()
        if event_id:
            self.test_get_event(event_id)
            self.test_update_event(event_id)
            self.test_delete_event(event_id)
            
        # Test match CRUD
        match_id = self.test_create_match()
        if match_id:
            self.test_get_match(match_id)
            self.test_update_match(match_id)
            self.test_delete_match(match_id)
            
        # Test news CRUD
        news_id = self.test_create_news()
        if news_id:
            self.test_get_news(news_id)
            self.test_update_news(news_id)
            self.test_delete_news(news_id)

    def test_create_team(self):
        """Create a team"""
        success, response = self.run_test(
            "Create Team",
            "POST",
            "admin/teams",
            201,
            data={"name": "Test Team", "region": "NA", "short_name": "TT"},
            with_api_prefix=True
        )
        return response.get('id') if success else None

    def test_get_team(self, team_id):
        """Get a team by ID"""
        self.run_test(
            "Get Team",
            "GET",
            f"admin/teams/{team_id}",
            200,
            with_api_prefix=True
        )

    def test_update_team(self, team_id):
        """Update a team"""
        self.run_test(
            "Update Team",
            "PUT",
            f"admin/teams/{team_id}",
            200,
            data={"name": "Updated Test Team", "region": "EU", "short_name": "UTT"},
            with_api_prefix=True
        )

    def test_delete_team(self, team_id):
        """Delete a team"""
        self.run_test(
            "Delete Team",
            "DELETE",
            f"admin/teams/{team_id}",
            200,
            with_api_prefix=True
        )

    def test_create_player(self):
        """Create a player"""
        success, response = self.run_test(
            "Create Player",
            "POST",
            "admin/players",
            201,
            data={"name": "Test Player", "username": "testplayer", "role": "DPS"},
            with_api_prefix=True
        )
        return response.get('id') if success else None

    def test_get_player(self, player_id):
        """Get a player by ID"""
        self.run_test(
            "Get Player",
            "GET",
            f"admin/players/{player_id}",
            200,
            with_api_prefix=True
        )

    def test_update_player(self, player_id):
        """Update a player"""
        self.run_test(
            "Update Player",
            "PUT",
            f"admin/players/{player_id}",
            200,
            data={"name": "Updated Test Player", "username": "updatedtestplayer", "role": "Support"},
            with_api_prefix=True
        )

    def test_delete_player(self, player_id):
        """Delete a player"""
        self.run_test(
            "Delete Player",
            "DELETE",
            f"admin/players/{player_id}",
            200,
            with_api_prefix=True
        )

    def test_create_event(self):
        """Create an event"""
        success, response = self.run_test(
            "Create Event",
            "POST",
            "admin/events",
            201,
            data={"name": "Test Event", "type": "tournament", "status": "upcoming"},
            with_api_prefix=True
        )
        return response.get('id') if success else None

    def test_get_event(self, event_id):
        """Get an event by ID"""
        self.run_test(
            "Get Event",
            "GET",
            f"admin/events/{event_id}",
            200,
            with_api_prefix=True
        )

    def test_update_event(self, event_id):
        """Update an event"""
        self.run_test(
            "Update Event",
            "PUT",
            f"admin/events/{event_id}",
            200,
            data={"name": "Updated Test Event", "type": "league", "status": "ongoing"},
            with_api_prefix=True
        )

    def test_delete_event(self, event_id):
        """Delete an event"""
        self.run_test(
            "Delete Event",
            "DELETE",
            f"admin/events/{event_id}",
            200,
            with_api_prefix=True
        )

    def test_create_match(self):
        """Create a match"""
        success, response = self.run_test(
            "Create Match",
            "POST",
            "admin/matches",
            201,
            data={"team1_id": 1, "team2_id": 2, "event_id": 1, "status": "scheduled"},
            with_api_prefix=True
        )
        return response.get('id') if success else None

    def test_get_match(self, match_id):
        """Get a match by ID"""
        self.run_test(
            "Get Match",
            "GET",
            f"admin/matches/{match_id}",
            200,
            with_api_prefix=True
        )

    def test_update_match(self, match_id):
        """Update a match"""
        self.run_test(
            "Update Match",
            "PUT",
            f"admin/matches/{match_id}",
            200,
            data={"team1_id": 1, "team2_id": 2, "event_id": 1, "status": "completed"},
            with_api_prefix=True
        )

    def test_delete_match(self, match_id):
        """Delete a match"""
        self.run_test(
            "Delete Match",
            "DELETE",
            f"admin/matches/{match_id}",
            200,
            with_api_prefix=True
        )

    def test_create_news(self):
        """Create a news article"""
        success, response = self.run_test(
            "Create News",
            "POST",
            "admin/news",
            201,
            data={"title": "Test News", "content": "This is a test news article", "category": "updates"},
            with_api_prefix=True
        )
        return response.get('id') if success else None

    def test_get_news(self, news_id):
        """Get a news article by ID"""
        self.run_test(
            "Get News",
            "GET",
            f"admin/news/{news_id}",
            200,
            with_api_prefix=True
        )

    def test_update_news(self, news_id):
        """Update a news article"""
        self.run_test(
            "Update News",
            "PUT",
            f"admin/news/{news_id}",
            200,
            data={"title": "Updated Test News", "content": "This is an updated test news article", "category": "announcements"},
            with_api_prefix=True
        )

    def test_delete_news(self, news_id):
        """Delete a news article"""
        self.run_test(
            "Delete News",
            "DELETE",
            f"admin/news/{news_id}",
            200,
            with_api_prefix=True
        )

    def summarize_results(self):
        """Summarize test results"""
        print("\n" + "="*50)
        print(f"📊 Tests passed: {self.tests_passed}/{self.tests_run} ({self.tests_passed/self.tests_run*100:.1f}%)")
        
        if self.issues:
            print("\n❌ Issues found:")
            for i, issue in enumerate(self.issues):
                print(f"{i+1}. {issue['test']} - {issue.get('url', 'N/A')}")
                print(f"   Expected: {issue.get('expected_status', 'N/A')}, Got: {issue.get('actual_status', 'N/A')}")
                if 'error' in issue:
                    print(f"   Error: {issue['error']}")
                elif 'response' in issue:
                    print(f"   Response: {str(issue['response'])[:100]}...")
                print()
        else:
            print("\n✅ No issues found!")
            
        return self.tests_passed == self.tests_run

def main():
    # Setup
    tester = MarvelRivalsAPITester("https://staging.mrvl.net")
    
    # Run tests
    print("🔐 Attempting login with jhonny@ar-mediia.com...")
    if tester.test_login("jhonny@ar-mediia.com", "password123"):
        print("✅ Login successful")
    else:
        print("❌ Login failed")
    
    print("\n🌐 Testing public endpoints...")
    tester.test_public_endpoints()
    
    print("\n🔒 Testing admin endpoints...")
    tester.test_admin_endpoints()
    
    print("\n📝 Testing CRUD operations...")
    tester.test_crud_operations()
    
    # Print results
    success = tester.summarize_results()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())