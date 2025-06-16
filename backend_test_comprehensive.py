import requests
import sys
import json
import time
from datetime import datetime

class MarvelRivalsBackendTester:
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

    # 1. Core API Endpoints Tests
    def test_core_api_endpoints(self):
        """Test all core API endpoints"""
        print("\n===== TESTING CORE API ENDPOINTS =====")
        
        # Test teams endpoint
        self.run_test("Get Teams", "GET", "teams", 200)
        
        # Test matches endpoint
        success, matches_data = self.run_test("Get Matches", "GET", "matches", 200)
        
        # Test events endpoint
        success, events_data = self.run_test("Get Events", "GET", "events", 200)
        
        # Test rankings endpoint
        self.run_test("Get Rankings", "GET", "rankings", 200)
        
        # Test forum threads endpoint
        self.run_test("Get Forum Threads", "GET", "forum/threads", 200)
        
        return success, matches_data

    # 2. Match Detail Data Tests
    def test_match_detail_data(self, matches_data):
        """Test match detail data structure"""
        print("\n===== TESTING MATCH DETAIL DATA =====")
        
        if not matches_data or not isinstance(matches_data, (list, dict)):
            print("❌ No matches data available to test match details")
            return False
        
        # Extract matches from response
        matches = matches_data if isinstance(matches_data, list) else matches_data.get('data', [])
        
        if not matches:
            print("❌ No matches found in the response")
            return False
        
        # Test first 3 matches for detailed data
        success = True
        for i, match in enumerate(matches[:3]):
            match_id = match.get('id')
            if not match_id:
                continue
                
            print(f"\n🔍 Testing Match Detail for ID: {match_id}")
            match_success, match_detail = self.run_test(
                f"Get Match Detail {i+1}",
                "GET",
                f"matches/{match_id}",
                200
            )
            
            if match_success:
                # Verify match detail structure
                required_fields = ['id', 'team1', 'team2', 'status', 'date']
                missing_fields = [field for field in required_fields if field not in match_detail]
                
                if missing_fields:
                    print(f"❌ Match detail missing required fields: {', '.join(missing_fields)}")
                    success = False
                    self.issues.append({
                        "test": f"Match Detail Structure for ID {match_id}",
                        "error": f"Missing required fields: {', '.join(missing_fields)}",
                        "details": match_detail
                    })
                else:
                    print(f"✅ Match detail has all required fields")
                    
                    # Check team data
                    for team_key in ['team1', 'team2']:
                        if team_key in match_detail and isinstance(match_detail[team_key], dict):
                            team = match_detail[team_key]
                            team_required_fields = ['id', 'name']
                            team_missing_fields = [field for field in team_required_fields if field not in team]
                            
                            if team_missing_fields:
                                print(f"❌ {team_key} missing required fields: {', '.join(team_missing_fields)}")
                                success = False
                            else:
                                print(f"✅ {team_key} has all required fields")
                                
                                # Check if players are loaded
                                if 'players' in team and isinstance(team['players'], list):
                                    print(f"✅ {team_key} has players data")
                                else:
                                    print(f"❓ {team_key} doesn't have players data (might be optional)")
            else:
                success = False
        
        return success

    # 3. Authentication System Tests
    def test_authentication_system(self):
        """Test authentication system (login/logout)"""
        print("\n===== TESTING AUTHENTICATION SYSTEM =====")
        
        # Test login
        login_success, login_data = self.run_test(
            "User Login",
            "POST",
            "login",
            200,
            data={"email": "jhonny@ar-mediia.com", "password": "password123"}
        )
        
        if login_success and 'token' in login_data:
            self.token = login_data['token']
            print(f"✅ Login successful, token received")
            
            # Test user profile with token
            self.run_test(
                "Get User Profile",
                "GET",
                "user",
                200,
                auth=True
            )
            
            # Test logout
            logout_success, _ = self.run_test(
                "User Logout",
                "POST",
                "logout",
                200,
                auth=True
            )
            
            if logout_success:
                print("✅ Logout successful")
                # Clear token after logout
                self.token = None
                return True
            else:
                print("❌ Logout failed")
                return False
        else:
            print("❌ Login failed, cannot test authenticated endpoints")
            return False

    # 4. Live Match Data Tests
    def test_live_match_data(self):
        """Test live match data for the scoring system"""
        print("\n===== TESTING LIVE MATCH DATA =====")
        
        # Get all matches
        success, matches_data = self.run_test("Get All Matches", "GET", "matches", 200)
        
        if not success:
            print("❌ Failed to get matches, cannot test live match data")
            return False
            
        # Extract matches from response
        matches = matches_data if isinstance(matches_data, list) else matches_data.get('data', [])
        
        if not matches:
            print("❌ No matches found in the response")
            return False
            
        # Find live matches
        live_matches = [match for match in matches if match.get('status') == 'live']
        
        if not live_matches:
            print("⚠️ No live matches found, testing a completed match instead")
            # Use a completed match as fallback
            test_matches = [match for match in matches if match.get('status') == 'completed']
            if not test_matches:
                print("❌ No completed matches found either, cannot test match data")
                return False
        else:
            test_matches = live_matches
            
        # Test the first available match
        test_match = test_matches[0]
        match_id = test_match.get('id')
        
        print(f"\n🔍 Testing match data for match ID: {match_id}")
        match_success, match_detail = self.run_test(
            f"Get Match Detail for Live Scoring",
            "GET",
            f"matches/{match_id}",
            200
        )
        
        if not match_success:
            print("❌ Failed to get match detail")
            return False
            
        # Check for scoring data
        if 'maps' in match_detail and isinstance(match_detail['maps'], list):
            print(f"✅ Match has maps data for scoring")
            
            for i, map_data in enumerate(match_detail['maps']):
                print(f"  Map {i+1}: {map_data.get('name', 'Unknown')}")
                print(f"    Score: {map_data.get('team1_score', '?')} - {map_data.get('team2_score', '?')}")
                
            return True
        else:
            print("❌ Match doesn't have maps data for scoring")
            self.issues.append({
                "test": f"Live Match Scoring Data for ID {match_id}",
                "error": "Missing maps data for scoring",
                "details": match_detail
            })
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
                    if 'details' in issue:
                        if isinstance(issue['details'], list):
                            for detail in issue['details']:
                                print(f"   - {detail}")
                        elif isinstance(issue['details'], dict):
                            print(f"   - Details: {json.dumps(issue['details'], indent=2)[:200]}...")
                        else:
                            print(f"   - Details: {issue['details']}")
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
    tester = MarvelRivalsBackendTester()
    
    print("\n🚀 Starting Marvel Rivals Backend API Tests\n")
    print(f"🌐 Base URL: {tester.base_url}")
    print(f"🌐 API URL: {tester.api_url}")
    
    # 1. Test core API endpoints
    core_success, matches_data = tester.test_core_api_endpoints()
    
    # 2. Test match detail data
    if core_success:
        tester.test_match_detail_data(matches_data)
    
    # 3. Test authentication system
    tester.test_authentication_system()
    
    # 4. Test live match data
    tester.test_live_match_data()
    
    # Print summary
    tester.print_summary()
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())