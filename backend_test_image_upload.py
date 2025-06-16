
import requests
import sys
import json
import os
from datetime import datetime

class MarvelRivalsImageUploadTester:
    def __init__(self, base_url="https://staging.mrvl.net/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.debug = True

    def log(self, message):
        """Print debug messages if debug is enabled"""
        if self.debug:
            print(f"DEBUG: {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, auth=False, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Accept': 'application/json'}
        
        if auth and self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        # Don't set Content-Type for multipart/form-data (file uploads)
        if not files and data:
            headers['Content-Type'] = 'application/json'
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        self.log(f"URL: {url}")
        self.log(f"Method: {method}")
        
        if data and not files:
            self.log(f"Data: {json.dumps(data)}")
        elif files:
            self.log(f"Files: {files.keys() if files else None}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    # For multipart/form-data (file uploads)
                    response = requests.post(url, headers=headers, data=data, files=files)
                else:
                    # For JSON data
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            
            self.log(f"Status Code: {response.status_code}")
            
            try:
                response_data = response.json()
                self.log(f"Response: {json.dumps(response_data, indent=2)}")
            except:
                self.log(f"Response (text): {response.text}")
                response_data = {}
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                if response.text:
                    print(f"Response: {response.text[:200]}...")
            
            return success, response_data
        
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_login(self, email, password):
        """Test login and get token"""
        success, response = self.run_test(
            "Login",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        
        if success and 'token' in response:
            self.token = response['token']
            print(f"✅ Successfully logged in and got token")
            return True
        else:
            print(f"❌ Login failed or token not received")
            return False

    def test_upload_team_logo(self, team_id, image_path):
        """Test uploading a team logo"""
        if not os.path.exists(image_path):
            print(f"❌ Image file not found: {image_path}")
            return False, {}
        
        try:
            with open(image_path, 'rb') as img_file:
                files = {'logo': (os.path.basename(image_path), img_file, 'image/jpeg')}
                return self.run_test(
                    f"Upload Team Logo (Team ID: {team_id})",
                    "POST",
                    f"upload/team/{team_id}/logo",
                    200,
                    data={},
                    files=files,
                    auth=True
                )
        except Exception as e:
            print(f"❌ Error preparing image upload: {str(e)}")
            return False, {}

    def test_upload_player_avatar(self, player_id, image_path):
        """Test uploading a player avatar"""
        if not os.path.exists(image_path):
            print(f"❌ Image file not found: {image_path}")
            return False, {}
        
        try:
            with open(image_path, 'rb') as img_file:
                files = {'avatar': (os.path.basename(image_path), img_file, 'image/jpeg')}
                return self.run_test(
                    f"Upload Player Avatar (Player ID: {player_id})",
                    "POST",
                    f"upload/player/{player_id}/avatar",
                    200,
                    data={},
                    files=files,
                    auth=True
                )
        except Exception as e:
            print(f"❌ Error preparing image upload: {str(e)}")
            return False, {}

    def test_get_team(self, team_id):
        """Test getting a team by ID"""
        return self.run_test(
            f"Get Team (ID: {team_id})",
            "GET",
            f"teams/{team_id}",
            200
        )

    def test_get_player(self, player_id):
        """Test getting a player by ID"""
        return self.run_test(
            f"Get Player (ID: {player_id})",
            "GET",
            f"players/{player_id}",
            200
        )

    def test_create_match(self, team1_id, team2_id, event_id=None):
        """Test creating a match"""
        data = {
            "team1_id": team1_id,
            "team2_id": team2_id,
            "team1_score": 2,
            "team2_score": 1,
            "status": "completed",
            "scheduled_at": datetime.now().isoformat()
        }
        
        if event_id:
            data["event_id"] = event_id
            
        return self.run_test(
            "Create Match",
            "POST",
            "admin/matches",
            201,
            data=data,
            auth=True
        )

def main():
    # Setup
    tester = MarvelRivalsImageUploadTester()
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    
    # Create test image files
    test_logo_path = "/tmp/test_logo.jpg"
    test_avatar_path = "/tmp/test_avatar.jpg"
    
    # Create simple test images if they don't exist
    if not os.path.exists(test_logo_path):
        try:
            # Download a test image for logo
            print("Downloading test logo image...")
            logo_response = requests.get("https://picsum.photos/200/200")
            with open(test_logo_path, 'wb') as f:
                f.write(logo_response.content)
            print(f"✅ Test logo saved to {test_logo_path}")
        except Exception as e:
            print(f"❌ Error creating test logo: {str(e)}")
            return 1
    
    if not os.path.exists(test_avatar_path):
        try:
            # Download a test image for avatar
            print("Downloading test avatar image...")
            avatar_response = requests.get("https://picsum.photos/200/200")
            with open(test_avatar_path, 'wb') as f:
                f.write(avatar_response.content)
            print(f"✅ Test avatar saved to {test_avatar_path}")
        except Exception as e:
            print(f"❌ Error creating test avatar: {str(e)}")
            return 1
    
    print("\n🚀 Starting Marvel Rivals Image Upload Tests\n")
    
    # Test authentication
    if not tester.test_login("jhonny@ar-mediia.com", "password123"):
        print("❌ Login failed, stopping authenticated tests")
        return 1
    
    # Test team logo upload for team ID 30
    team_id = 30
    success, team_logo_response = tester.test_upload_team_logo(team_id, test_logo_path)
    
    if success:
        print(f"✅ Team logo uploaded successfully")
        # Verify the logo URL format
        logo_url = team_logo_response.get('logo_url') or team_logo_response.get('url')
        if logo_url and logo_url.startswith('https://staging.mrvl.net/storage/'):
            print(f"✅ Logo URL format is correct: {logo_url}")
        else:
            print(f"❌ Logo URL format is incorrect: {logo_url}")
    
    # Test player avatar upload for player ID 28
    player_id = 28
    success, player_avatar_response = tester.test_upload_player_avatar(player_id, test_avatar_path)
    
    if success:
        print(f"✅ Player avatar uploaded successfully")
        # Verify the avatar URL format
        avatar_url = player_avatar_response.get('avatar_url') or player_avatar_response.get('url')
        if avatar_url and avatar_url.startswith('https://staging.mrvl.net/storage/'):
            print(f"✅ Avatar URL format is correct: {avatar_url}")
        else:
            print(f"❌ Avatar URL format is incorrect: {avatar_url}")
    
    # Test creating a match
    success, match_response = tester.test_create_match(30, 31)
    if success:
        print(f"✅ Match created successfully")
        match_id = match_response.get('id')
        if match_id:
            print(f"✅ Match ID: {match_id}")
    
    # Verify team data after upload
    success, team_data = tester.test_get_team(team_id)
    if success:
        logo_url = team_data.get('logo_url') or team_data.get('logo')
        if logo_url and logo_url.startswith('https://staging.mrvl.net/storage/'):
            print(f"✅ Team logo URL verified in team data: {logo_url}")
        else:
            print(f"❌ Team logo URL not found or incorrect in team data: {logo_url}")
    
    # Verify player data after upload
    success, player_data = tester.test_get_player(player_id)
    if success:
        avatar_url = player_data.get('avatar_url') or player_data.get('avatar')
        if avatar_url and avatar_url.startswith('https://staging.mrvl.net/storage/'):
            print(f"✅ Player avatar URL verified in player data: {avatar_url}")
        else:
            print(f"❌ Player avatar URL not found or incorrect in player data: {avatar_url}")
    
    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run} ({tester.tests_passed/tester.tests_run*100:.1f}%)")
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
