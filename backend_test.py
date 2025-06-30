
import requests
import sys
import json
from datetime import datetime, timedelta

class MarvelRivalsAPITester:
    def __init__(self, base_url=None):
        # Use the REACT_APP_BACKEND_URL from frontend/.env if available
        if base_url is None:
            try:
                with open('/app/frontend/.env', 'r') as f:
                    for line in f:
                        if line.startswith('REACT_APP_BACKEND_URL='):
                            base_url = line.strip().split('=')[1].strip('"\'')
                            break
            except Exception as e:
                print(f"Warning: Could not read REACT_APP_BACKEND_URL from frontend/.env: {e}")
                base_url = "https://6ebd964e-6cb1-4708-ab9d-1f65d35a0909.preview.emergentagent.com"
        
        self.base_url = base_url
        self.api_url = f"{base_url}/api"  # API URL with /api prefix
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.issues = []
        self.debug = True
        # Use the admin token from MatchAPI.js
        self.admin_token = "415|ySK4yrjyULCTlprffD0KeT5zxd6J2mMMHOHkX6pv1d5fc012"

    def log(self, message):
        """Print debug messages if debug is enabled"""
        if self.debug:
            print(f"DEBUG: {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, auth=False, admin_auth=False, with_api_prefix=True, check_headers=False):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if with_api_prefix else f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json', 'Accept': 'application/json'}
        
        if auth and self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        elif admin_auth and self.admin_token:
            headers['Authorization'] = f'Bearer {self.admin_token}'
        
        # Add cache-busting headers for GET requests
        if method == 'GET' and check_headers:
            headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            headers['Pragma'] = 'no-cache'
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        self.log(f"URL: {url}")
        self.log(f"Method: {method}")
        self.log(f"Headers: {headers}")
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
            self.log(f"Response Headers: {response.headers}")
            
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
            
            return success, response_data if is_json else {}, response.headers
        
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.issues.append({
                "test": name,
                "url": url,
                "error": str(e)
            })
            return False, {}, {}

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
    
    def test_get_match_scoreboard(self, match_id, check_cache_headers=False):
        """Test getting match scoreboard with team and player information"""
        return self.run_test(
            f"Get Match Scoreboard for ID {match_id}",
            "GET",
            f"matches/{match_id}/scoreboard",
            200,
            check_headers=check_cache_headers
        )
    
    # New Marvel Rivals MatchAPI.js endpoints
    
    def test_update_match_status_new(self, match_id, status):
        """Test updating match status with the new endpoint"""
        return self.run_test(
            f"Update Match Status for ID {match_id}",
            "PUT",
            f"admin/matches/{match_id}/status",
            200,
            data={"status": status},
            admin_auth=True
        )
    
    def test_update_team_composition(self, match_id, map_index, compositions):
        """Test updating team composition (hero changes)"""
        return self.run_test(
            f"Update Team Composition for Match ID {match_id}, Map Index {map_index}",
            "PUT",
            f"admin/matches/{match_id}/team-composition",
            200,
            data={
                "map_index": map_index,
                "team1_composition": compositions["team1_composition"],
                "team2_composition": compositions["team2_composition"]
            },
            admin_auth=True
        )
    
    def test_update_current_map(self, match_id, map_data):
        """Test updating current map and mode"""
        return self.run_test(
            f"Update Current Map for Match ID {match_id}",
            "PUT",
            f"admin/matches/{match_id}/current-map",
            200,
            data={
                "current_map": map_data["mapName"],
                "current_mode": map_data["mode"],
                "map_index": map_data["mapIndex"]
            },
            admin_auth=True
        )
    
    def test_control_timer(self, match_id, action, elapsed=0):
        """Test controlling timer (start, pause, resume, stop, sync)"""
        return self.run_test(
            f"Control Timer for Match ID {match_id}, Action: {action}",
            "PUT",
            f"admin/matches/{match_id}/timer",
            200,
            data={
                "action": action,
                "elapsed_time": elapsed,
                "round_time": 0,
                "phase": "round"
            },
            admin_auth=True
        )
    
    def test_update_scores(self, match_id, score_data):
        """Test updating match and map scores"""
        return self.run_test(
            f"Update Scores for Match ID {match_id}",
            "PUT",
            f"admin/matches/{match_id}/scores",
            200,
            data=score_data,
            admin_auth=True
        )
    
    def test_update_player_stats_new(self, match_id, player_id, stats):
        """Test updating player statistics with the new endpoint"""
        stats_payload = {
            "eliminations": stats.get("eliminations", 0),
            "deaths": stats.get("deaths", 0),
            "assists": stats.get("assists", 0),
            "damage": stats.get("damage", 0),
            "healing": stats.get("healing", 0),
            "damage_blocked": stats.get("damageBlocked", 0),
            "ultimate_usage": stats.get("ultimateUsage", 0),
            "objective_time": stats.get("objectiveTime", 0),
            "hero_played": stats.get("hero", "Captain America")
        }
        
        return self.run_test(
            f"Update Player Stats for Match ID {match_id}, Player ID {player_id}",
            "PUT",
            f"admin/matches/{match_id}/player-stats/{player_id}",
            200,
            data=stats_payload,
            admin_auth=True
        )
    
    def test_get_live_state(self, match_id):
        """Test getting complete live state for admin dashboard"""
        return self.run_test(
            f"Get Live State for Match ID {match_id}",
            "GET",
            f"admin/matches/{match_id}/live-state",
            200,
            admin_auth=True
        )
    
    def test_get_all_heroes(self):
        """Test getting all Marvel Rivals heroes"""
        return self.run_test(
            "Get All Marvel Rivals Heroes",
            "GET",
            "game-data/all-heroes",
            200
        )
    
    def test_get_all_maps(self):
        """Test getting all Marvel Rivals maps"""
        return self.run_test(
            "Get All Marvel Rivals Maps",
            "GET",
            "game-data/maps",
            200
        )
    
    def test_get_all_modes(self):
        """Test getting all game modes"""
        return self.run_test(
            "Get All Game Modes",
            "GET",
            "game-data/modes",
            200
        )
    
    def test_save_player_stats(self, match_id, player_id, stats):
        """Test saving player statistics using the public endpoint"""
        stats_payload = {
            "kills": stats.get("eliminations", 0),
            "deaths": stats.get("deaths", 0),
            "assists": stats.get("assists", 0),
            "damage": stats.get("damage", 0),
            "healing": stats.get("healing", 0),
            "damage_blocked": stats.get("damageBlocked", 0),
            "hero_played": stats.get("hero", "Captain America"),
            "ultimate_usage": stats.get("ultimateUsage", 0),
            "objective_time": stats.get("objectiveTime", 0)
        }
        
        return self.run_test(
            f"Save Player Stats for Match ID {match_id}, Player ID {player_id}",
            "POST",
            f"matches/{match_id}/players/{player_id}/stats",
            200,
            data=stats_payload
        )
    
    def test_update_viewer_count(self, match_id, viewers):
        """Test updating viewer count"""
        return self.run_test(
            f"Update Viewer Count for Match ID {match_id}",
            "POST",
            f"matches/{match_id}/viewers",
            200,
            data={
                "viewers": viewers,
                "platform": "Twitch",
                "stream_url": "https://twitch.tv/marvelrivals"
            }
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

def test_match_scoreboard(tester, match_id, check_cache_headers=False):
    """Test the match scoreboard endpoint to verify it returns complete data"""
    print(f"\n----- TESTING MATCH SCOREBOARD FOR ID {match_id} -----")
    success, scoreboard_data, headers = tester.run_test(
        f"Get Match Scoreboard for ID {match_id}",
        "GET",
        f"matches/{match_id}/scoreboard",
        200,
        check_headers=check_cache_headers
    )
    
    if success and scoreboard_data:
        # Check for team logos
        team_logos_present = False
        if 'team1' in scoreboard_data and 'logo' in scoreboard_data['team1'] and scoreboard_data['team1']['logo']:
            team_logos_present = True
            print(f"✅ Team 1 logo present: {scoreboard_data['team1']['logo']}")
        else:
            print("❌ Team 1 logo missing")
        
        if 'team2' in scoreboard_data and 'logo' in scoreboard_data['team2'] and scoreboard_data['team2']['logo']:
            team_logos_present = team_logos_present and True
            print(f"✅ Team 2 logo present: {scoreboard_data['team2']['logo']}")
        else:
            print("❌ Team 2 logo missing")
            team_logos_present = False
        
        # Check for player data with heroes
        player_heroes_present = True
        if 'team1_players' in scoreboard_data and scoreboard_data['team1_players']:
            for i, player in enumerate(scoreboard_data['team1_players']):
                if 'main_hero' in player and player['main_hero']:
                    print(f"✅ Team 1 Player {i+1} hero present: {player['main_hero']}")
                else:
                    print(f"❌ Team 1 Player {i+1} hero missing")
                    player_heroes_present = False
        else:
            print("❌ Team 1 players missing")
            player_heroes_present = False
        
        if 'team2_players' in scoreboard_data and scoreboard_data['team2_players']:
            for i, player in enumerate(scoreboard_data['team2_players']):
                if 'main_hero' in player and player['main_hero']:
                    print(f"✅ Team 2 Player {i+1} hero present: {player['main_hero']}")
                else:
                    print(f"❌ Team 2 Player {i+1} hero missing")
                    player_heroes_present = False
        else:
            print("❌ Team 2 players missing")
            player_heroes_present = False
        
        # Check cache-busting headers if requested
        cache_headers_present = False
        if check_cache_headers:
            print("\n----- CHECKING CACHE-BUSTING HEADERS -----")
            if 'Cache-Control' in headers and 'no-cache' in headers['Cache-Control']:
                print(f"✅ Cache-Control header present: {headers['Cache-Control']}")
                cache_headers_present = True
            else:
                print("❌ Cache-Control header missing or incorrect")
                cache_headers_present = False
            
            if 'Pragma' in headers and headers['Pragma'] == 'no-cache':
                print(f"✅ Pragma header present: {headers['Pragma']}")
                cache_headers_present = cache_headers_present and True
            else:
                print("❌ Pragma header missing or incorrect")
                cache_headers_present = False
        
        return success, team_logos_present, player_heroes_present, cache_headers_present, scoreboard_data
    
    return False, False, False, False, {}

def test_match_detail_vs_scoreboard(tester, match_id):
    """Compare match detail and scoreboard endpoints to verify data consistency"""
    print(f"\n----- COMPARING MATCH DETAIL AND SCOREBOARD FOR ID {match_id} -----")
    
    # Get match detail
    success_detail, match_detail, _ = tester.test_get_match_detail(match_id)
    
    # Get match scoreboard
    success_scoreboard, team_logos_present, player_heroes_present, cache_headers_present, scoreboard_data = test_match_scoreboard(tester, match_id, check_cache_headers=True)
    
    if success_detail and success_scoreboard:
        # Compare key data points
        print("\n----- DATA COMPARISON -----")
        
        # Check team data
        team_data_consistent = True
        if 'team1' in match_detail and 'team1' in scoreboard_data:
            if match_detail['team1']['id'] == scoreboard_data['team1']['id']:
                print(f"✅ Team 1 ID consistent: {match_detail['team1']['id']}")
            else:
                print(f"❌ Team 1 ID inconsistent: {match_detail['team1']['id']} vs {scoreboard_data['team1']['id']}")
                team_data_consistent = False
        else:
            print("❌ Team 1 data missing in one or both endpoints")
            team_data_consistent = False
        
        if 'team2' in match_detail and 'team2' in scoreboard_data:
            if match_detail['team2']['id'] == scoreboard_data['team2']['id']:
                print(f"✅ Team 2 ID consistent: {match_detail['team2']['id']}")
            else:
                print(f"❌ Team 2 ID inconsistent: {match_detail['team2']['id']} vs {scoreboard_data['team2']['id']}")
                team_data_consistent = False
        else:
            print("❌ Team 2 data missing in one or both endpoints")
            team_data_consistent = False
        
        # Check if scoreboard has additional player data that detail doesn't
        scoreboard_has_extra_data = False
        if 'team1_players' in scoreboard_data and scoreboard_data['team1_players']:
            for player in scoreboard_data['team1_players']:
                if 'main_hero' in player and player['main_hero']:
                    scoreboard_has_extra_data = True
                    print(f"✅ Scoreboard has extra player data (main_hero): {player['main_hero']}")
                    break
        
        return success_detail and success_scoreboard, team_data_consistent, scoreboard_has_extra_data, cache_headers_present
    
    return False, False, False, False

def test_create_match_with_hero_compositions(tester, team_ids):
    """Test creating a match with hero compositions in maps_data"""
    print("\n----- TESTING MATCH CREATION WITH HERO COMPOSITIONS -----")
    
    # Set scheduled_at to a future date (tomorrow)
    tomorrow = (datetime.now() + timedelta(days=1)).isoformat()
    
    # Create a match with maps_data including hero compositions
    match_data = {
        "team1_id": team_ids[0],
        "team2_id": team_ids[1],
        "event_id": 22,  # Using event ID 22 from the matches response
        "format": "BO3",
        "scheduled_at": tomorrow,
        "status": "upcoming",
        "maps_data": [
            {
                "name": "Tokyo 2099",
                "team1_heroes": ["Captain America", "Black Widow", "Hulk", "Storm", "Iron Man"],
                "team2_heroes": ["Spider-Man", "Venom", "Thor", "Rocket Raccoon", "Magneto"]
            },
            {
                "name": "Asgard",
                "team1_heroes": ["Hulk", "Iron Man", "Captain America", "Black Widow", "Storm"],
                "team2_heroes": ["Thor", "Rocket Raccoon", "Spider-Man", "Venom", "Magneto"]
            },
            {
                "name": "Klyntar",
                "team1_heroes": ["Storm", "Black Widow", "Captain America", "Hulk", "Iron Man"],
                "team2_heroes": ["Magneto", "Thor", "Rocket Raccoon", "Spider-Man", "Venom"]
            }
        ]
    }
    
    success, created_match = tester.test_create_match(match_data)
    
    if success and created_match and 'id' in created_match:
        match_id = created_match['id']
        print(f"✅ Match created successfully with ID: {match_id}")
        
        # Check if maps_data was saved
        maps_data_saved = False
        if 'maps' in created_match and len(created_match['maps']) == 3:
            print(f"✅ Match has correct number of maps: {len(created_match['maps'])}")
            
            # Check if maps have the correct names
            map_names_correct = all(
                created_match['maps'][i]['name'] == match_data['maps_data'][i]['name'] 
                for i in range(min(len(created_match['maps']), len(match_data['maps_data'])))
            )
            
            if map_names_correct:
                print("✅ Map names are correct")
                maps_data_saved = True
            else:
                print("❌ Map names are incorrect")
                maps_data_saved = False
        else:
            print(f"❌ Match has incorrect number of maps: {len(created_match.get('maps', []))}")
            maps_data_saved = False
        
        # Now check if we can retrieve the match and see the hero compositions
        print("\n----- CHECKING IF HERO COMPOSITIONS WERE SAVED -----")
        
        # Get match detail
        success_detail, match_detail = tester.test_get_match_detail(match_id)
        
        hero_compositions_visible = False
        if success_detail and 'maps' in match_detail:
            for i, map_data in enumerate(match_detail['maps']):
                if 'team1_heroes' in map_data or 'team2_heroes' in map_data:
                    print(f"✅ Map {i+1} has hero compositions")
                    hero_compositions_visible = True
                    break
            
            if not hero_compositions_visible:
                print("❌ Hero compositions not visible in match detail response")
        
        # Get match scoreboard
        success_scoreboard, _, _, scoreboard_data = test_match_scoreboard(tester, match_id)
        
        scoreboard_hero_compositions_visible = False
        if success_scoreboard and 'maps' in scoreboard_data:
            for i, map_data in enumerate(scoreboard_data.get('maps', [])):
                if 'team1_heroes' in map_data or 'team2_heroes' in map_data:
                    print(f"✅ Scoreboard Map {i+1} has hero compositions")
                    scoreboard_hero_compositions_visible = True
                    break
            
            if not scoreboard_hero_compositions_visible:
                print("❌ Hero compositions not visible in scoreboard response")
        
        # Check if player data includes main_hero
        player_hero_data_present = False
        if success_scoreboard and 'team1_players' in scoreboard_data:
            for player in scoreboard_data['team1_players']:
                if 'main_hero' in player and player['main_hero']:
                    print(f"✅ Player has main_hero data: {player.get('name', 'Unknown')} - {player['main_hero']}")
                    player_hero_data_present = True
                    break
        
        return success, match_id, maps_data_saved, hero_compositions_visible, scoreboard_hero_compositions_visible, player_hero_data_present
    
    return False, None, False, False, False, False

def test_player_stats_update(tester, match_id, player_id, stats_data):
    """Test updating player stats for a match"""
    print(f"\n----- TESTING PLAYER STATS UPDATE FOR MATCH ID {match_id}, PLAYER ID {player_id} -----")
    
    success, response = tester.run_test(
        f"Update Player Stats for Match ID {match_id}, Player ID {player_id}",
        "POST",  # Using POST as specified in the review request
        f"matches/{match_id}/players/{player_id}/stats",
        200,
        data=stats_data
    )
    
    if success:
        print(f"✅ Successfully updated stats for player ID {player_id}")
    else:
        print(f"❌ Failed to update stats for player ID {player_id}")
    
    return success, response

def check_player_ids(scoreboard_data):
    """Check if player objects in scoreboard data have proper ID fields"""
    print("\n----- CHECKING PLAYER IDs IN SCOREBOARD DATA -----")
    
    all_players_have_ids = True
    player_ids = []
    
    # Check team1 players
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
    
    # Check team2 players
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
    
    return all_players_have_ids, player_ids

def test_marvel_rivals_api_endpoints(tester, match_id=126):
    """Test all Marvel Rivals MatchAPI.js endpoints"""
    print("\n===== TESTING MARVEL RIVALS MATCHAPI.JS ENDPOINTS =====")
    
    results = {}
    
    # 1. Test GET /api/admin/matches/{id}/live-state
    print("\n----- TESTING LIVE STATE ENDPOINT -----")
    success_live_state, live_state_data, _ = tester.test_get_live_state(match_id)
    results["live_state"] = success_live_state
    
    if success_live_state:
        print("✅ Live state endpoint working correctly")
        print(f"Match status: {live_state_data.get('match', {}).get('status', 'unknown')}")
        
        # Extract player IDs for later tests
        player_ids = []
        if 'teams' in live_state_data:
            if 'team1' in live_state_data['teams'] and 'players' in live_state_data['teams']['team1']:
                for player in live_state_data['teams']['team1']['players']:
                    if 'id' in player:
                        player_ids.append(player['id'])
            
            if 'team2' in live_state_data['teams'] and 'players' in live_state_data['teams']['team2']:
                for player in live_state_data['teams']['team2']['players']:
                    if 'id' in player:
                        player_ids.append(player['id'])
    else:
        print("❌ Live state endpoint not working")
        # Try to get player IDs from scoreboard instead
        _, scoreboard_data, _ = tester.test_get_match_scoreboard(match_id)
        _, player_ids = check_player_ids(scoreboard_data)
    
    # 2. Test PUT /api/admin/matches/{id}/status
    print("\n----- TESTING MATCH STATUS UPDATE ENDPOINT -----")
    current_status = live_state_data.get('match', {}).get('status', 'upcoming') if success_live_state else 'upcoming'
    new_status = 'live' if current_status != 'live' else 'paused'
    success_status_update, status_update_data, _ = tester.test_update_match_status_new(match_id, new_status)
    results["status_update"] = success_status_update
    
    if success_status_update:
        print(f"✅ Match status update endpoint working correctly")
        print(f"Updated status: {status_update_data.get('status', 'unknown')}")
    else:
        print("❌ Match status update endpoint not working")
    
    # 3. Test PUT /api/admin/matches/{id}/team-composition
    print("\n----- TESTING TEAM COMPOSITION UPDATE ENDPOINT -----")
    compositions = {
        "team1_composition": [
            {"player_id": player_ids[0] if len(player_ids) > 0 else "1", "hero": "Captain America"},
            {"player_id": player_ids[1] if len(player_ids) > 1 else "2", "hero": "Black Widow"},
            {"player_id": player_ids[2] if len(player_ids) > 2 else "3", "hero": "Hulk"},
            {"player_id": player_ids[3] if len(player_ids) > 3 else "4", "hero": "Iron Man"},
            {"player_id": player_ids[4] if len(player_ids) > 4 else "5", "hero": "Storm"}
        ],
        "team2_composition": [
            {"player_id": player_ids[5] if len(player_ids) > 5 else "6", "hero": "Spider-Man"},
            {"player_id": player_ids[6] if len(player_ids) > 6 else "7", "hero": "Venom"},
            {"player_id": player_ids[7] if len(player_ids) > 7 else "8", "hero": "Thor"},
            {"player_id": player_ids[8] if len(player_ids) > 8 else "9", "hero": "Rocket Raccoon"},
            {"player_id": player_ids[9] if len(player_ids) > 9 else "10", "hero": "Magneto"}
        ]
    }
    success_composition_update, composition_update_data, _ = tester.test_update_team_composition(match_id, 0, compositions)
    results["composition_update"] = success_composition_update
    
    if success_composition_update:
        print(f"✅ Team composition update endpoint working correctly")
    else:
        print("❌ Team composition update endpoint not working")
    
    # 4. Test PUT /api/admin/matches/{id}/current-map
    print("\n----- TESTING CURRENT MAP UPDATE ENDPOINT -----")
    map_data = {
        "mapName": "Tokyo 2099",
        "mode": "Conquest",
        "mapIndex": 0
    }
    success_map_update, map_update_data, _ = tester.test_update_current_map(match_id, map_data)
    results["map_update"] = success_map_update
    
    if success_map_update:
        print(f"✅ Current map update endpoint working correctly")
    else:
        print("❌ Current map update endpoint not working")
    
    # 5. Test PUT /api/admin/matches/{id}/timer
    print("\n----- TESTING TIMER CONTROL ENDPOINT -----")
    success_timer_control, timer_control_data, _ = tester.test_control_timer(match_id, "start", 0)
    results["timer_control"] = success_timer_control
    
    if success_timer_control:
        print(f"✅ Timer control endpoint working correctly")
    else:
        print("❌ Timer control endpoint not working")
    
    # 6. Test PUT /api/admin/matches/{id}/scores
    print("\n----- TESTING SCORES UPDATE ENDPOINT -----")
    score_data = {
        "team1_score": 1,
        "team2_score": 0,
        "maps": [
            {
                "map_index": 0,
                "team1_score": 100,
                "team2_score": 85
            }
        ]
    }
    success_scores_update, scores_update_data, _ = tester.test_update_scores(match_id, score_data)
    results["scores_update"] = success_scores_update
    
    if success_scores_update:
        print(f"✅ Scores update endpoint working correctly")
    else:
        print("❌ Scores update endpoint not working")
    
    # 7. Test PUT /api/admin/matches/{id}/player-stats/{playerId}
    print("\n----- TESTING PLAYER STATS UPDATE ENDPOINT -----")
    if player_ids:
        test_player_id = player_ids[0]
        stats = {
            "eliminations": 15,
            "deaths": 8,
            "assists": 10,
            "damage": 12500,
            "healing": 0,
            "damageBlocked": 2000,
            "ultimateUsage": 3,
            "objectiveTime": 120,
            "hero": "Captain America"
        }
        success_player_stats_update, player_stats_update_data, _ = tester.test_update_player_stats_new(match_id, test_player_id, stats)
        results["player_stats_update"] = success_player_stats_update
        
        if success_player_stats_update:
            print(f"✅ Player stats update endpoint working correctly for player ID {test_player_id}")
        else:
            print(f"❌ Player stats update endpoint not working for player ID {test_player_id}")
    else:
        print("❌ No player IDs found to test player stats update endpoint")
        results["player_stats_update"] = False
    
    # 8. Test GET /api/game-data/all-heroes
    print("\n----- TESTING ALL HEROES ENDPOINT -----")
    success_heroes, heroes_data, _ = tester.test_get_all_heroes()
    results["all_heroes"] = success_heroes
    
    if success_heroes:
        print(f"✅ All heroes endpoint working correctly")
        if isinstance(heroes_data, list):
            print(f"Found {len(heroes_data)} heroes")
        else:
            print(f"Heroes data structure: {type(heroes_data)}")
    else:
        print("❌ All heroes endpoint not working")
    
    # 9. Test GET /api/game-data/maps
    print("\n----- TESTING ALL MAPS ENDPOINT -----")
    success_maps, maps_data, _ = tester.test_get_all_maps()
    results["all_maps"] = success_maps
    
    if success_maps:
        print(f"✅ All maps endpoint working correctly")
        if isinstance(maps_data, list):
            print(f"Found {len(maps_data)} maps")
        else:
            print(f"Maps data structure: {type(maps_data)}")
    else:
        print("❌ All maps endpoint not working")
    
    # 10. Test GET /api/game-data/modes
    print("\n----- TESTING ALL MODES ENDPOINT -----")
    success_modes, modes_data, _ = tester.test_get_all_modes()
    results["all_modes"] = success_modes
    
    if success_modes:
        print(f"✅ All modes endpoint working correctly")
        if isinstance(modes_data, list):
            print(f"Found {len(modes_data)} modes")
        else:
            print(f"Modes data structure: {type(modes_data)}")
    else:
        print("❌ All modes endpoint not working")
    
    # 11. Test GET /api/matches/{id}/scoreboard with cache-busting headers
    print("\n----- TESTING PUBLIC SCOREBOARD ENDPOINT WITH CACHE-BUSTING HEADERS -----")
    success_scoreboard, team_logos_present, player_heroes_present, cache_headers_present, scoreboard_data = test_match_scoreboard(tester, match_id, check_cache_headers=True)
    results["public_scoreboard"] = success_scoreboard
    results["cache_headers"] = cache_headers_present
    
    if success_scoreboard:
        print(f"✅ Public scoreboard endpoint working correctly")
        if cache_headers_present:
            print(f"✅ Cache-busting headers present")
        else:
            print(f"❌ Cache-busting headers missing")
    else:
        print("❌ Public scoreboard endpoint not working")
    
    # 12. Test data consistency between endpoints
    print("\n----- TESTING DATA CONSISTENCY BETWEEN ENDPOINTS -----")
    if success_live_state and success_scoreboard:
        # Compare team IDs
        live_team1_id = live_state_data.get('teams', {}).get('team1', {}).get('id')
        live_team2_id = live_state_data.get('teams', {}).get('team2', {}).get('id')
        scoreboard_team1_id = scoreboard_data.get('team1', {}).get('id')
        scoreboard_team2_id = scoreboard_data.get('team2', {}).get('id')
        
        team_ids_consistent = (live_team1_id == scoreboard_team1_id and live_team2_id == scoreboard_team2_id)
        
        if team_ids_consistent:
            print(f"✅ Team IDs consistent between live state and scoreboard endpoints")
        else:
            print(f"❌ Team IDs inconsistent between live state and scoreboard endpoints")
            print(f"Live state: Team 1 ID = {live_team1_id}, Team 2 ID = {live_team2_id}")
            print(f"Scoreboard: Team 1 ID = {scoreboard_team1_id}, Team 2 ID = {scoreboard_team2_id}")
        
        results["data_consistency"] = team_ids_consistent
    else:
        print("❌ Cannot test data consistency because one or both endpoints failed")
        results["data_consistency"] = False
    
    return results

def test_marvel_rivals_live_scoring_integration(tester, match_id=135):
    """
    Test the Marvel Rivals live scoring backend integration with focus on:
    1. Match Scoreboard API
    2. Live Score Updates with auto-aggregation
    3. Player Statistics
    4. Complete Live State
    """
    print("\n===== TESTING MARVEL RIVALS LIVE SCORING INTEGRATION =====")
    print(f"🔍 Testing Match ID: {match_id}")
    
    results = {}
    
    # 1. First, get the current state of the match scoreboard
    print("\n----- STEP 1: CHECKING INITIAL MATCH SCOREBOARD -----")
    success_initial_scoreboard, initial_scoreboard_data, _ = tester.run_test(
        f"Get Initial Match Scoreboard for ID {match_id}",
        "GET",
        f"matches/{match_id}/scoreboard",
        200
    )
    results["initial_scoreboard"] = success_initial_scoreboard
    
    if success_initial_scoreboard:
        print("✅ Initial match scoreboard retrieved successfully")
        
        # Check initial overall scores
        team1_score = initial_scoreboard_data.get('team1_score', 0)
        team2_score = initial_scoreboard_data.get('team2_score', 0)
        print(f"Initial Overall Scores: Team 1 = {team1_score}, Team 2 = {team2_score}")
        
        # Check map scores
        maps = initial_scoreboard_data.get('maps', [])
        print(f"Match has {len(maps)} maps")
        for i, map_data in enumerate(maps):
            print(f"Map {i+1}: {map_data.get('name', 'Unknown')}")
            print(f"  Team 1 Score: {map_data.get('team1_score', 0)}")
            print(f"  Team 2 Score: {map_data.get('team2_score', 0)}")
            print(f"  Completed: {map_data.get('completed', False)}")
    else:
        print("❌ Failed to retrieve initial match scoreboard")
    
    # 2. Update map scores with completion status to trigger auto-aggregation
    print("\n----- STEP 2: UPDATING MAP SCORES WITH COMPLETION STATUS -----")
    
    # Prepare map scores data with completion status
    map_scores_data = {
        "maps": []
    }
    
    # If we have initial scoreboard data, use it to construct our update
    if success_initial_scoreboard and 'maps' in initial_scoreboard_data:
        maps = initial_scoreboard_data.get('maps', [])
        for i, map_data in enumerate(maps):
            # For the first map, set team1 as winner
            if i == 0:
                map_scores_data["maps"].append({
                    "map_index": i,
                    "team1_score": 100,
                    "team2_score": 85,
                    "completed": True,
                    "winner": "team1"
                })
            # For the second map, set team2 as winner
            elif i == 1:
                map_scores_data["maps"].append({
                    "map_index": i,
                    "team1_score": 75,
                    "team2_score": 100,
                    "completed": True,
                    "winner": "team2"
                })
            # For remaining maps, keep as is
            else:
                map_scores_data["maps"].append({
                    "map_index": i,
                    "team1_score": map_data.get('team1_score', 0),
                    "team2_score": map_data.get('team2_score', 0),
                    "completed": False
                })
    else:
        # If we don't have initial data, create some test data
        map_scores_data["maps"] = [
            {
                "map_index": 0,
                "team1_score": 100,
                "team2_score": 85,
                "completed": True,
                "winner": "team1"
            },
            {
                "map_index": 1,
                "team1_score": 75,
                "team2_score": 100,
                "completed": True,
                "winner": "team2"
            },
            {
                "map_index": 2,
                "team1_score": 0,
                "team2_score": 0,
                "completed": False
            }
        ]
    
    # Send the update
    success_scores_update, scores_update_data, _ = tester.run_test(
        f"Update Map Scores with Completion Status for Match ID {match_id}",
        "PUT",
        f"admin/matches/{match_id}/scores",
        200,
        data=map_scores_data,
        admin_auth=True
    )
    results["scores_update"] = success_scores_update
    
    if success_scores_update:
        print("✅ Map scores updated successfully with completion status")
        
        # Check if the response includes updated overall scores
        if 'team1_score' in scores_update_data and 'team2_score' in scores_update_data:
            print(f"Updated Overall Scores: Team 1 = {scores_update_data['team1_score']}, Team 2 = {scores_update_data['team2_score']}")
            
            # Verify auto-aggregation
            expected_team1_score = sum(1 for map_data in map_scores_data["maps"] if map_data.get('winner') == 'team1' and map_data.get('completed'))
            expected_team2_score = sum(1 for map_data in map_scores_data["maps"] if map_data.get('winner') == 'team2' and map_data.get('completed'))
            
            auto_aggregation_correct = (scores_update_data['team1_score'] == expected_team1_score and 
                                        scores_update_data['team2_score'] == expected_team2_score)
            
            if auto_aggregation_correct:
                print("✅ Auto-aggregation working correctly! Overall scores match completed map wins.")
            else:
                print("❌ Auto-aggregation not working correctly!")
                print(f"Expected: Team 1 = {expected_team1_score}, Team 2 = {expected_team2_score}")
                print(f"Actual: Team 1 = {scores_update_data['team1_score']}, Team 2 = {scores_update_data['team2_score']}")
            
            results["auto_aggregation"] = auto_aggregation_correct
        else:
            print("❌ Response does not include updated overall scores")
            results["auto_aggregation"] = False
        
        # Check if match status is updated to "completed" when all maps are completed
        if 'status' in scores_update_data:
            print(f"Match Status: {scores_update_data['status']}")
            
            # Check if all maps are completed
            all_maps_completed = all(map_data.get('completed', False) for map_data in map_scores_data["maps"])
            
            if all_maps_completed and scores_update_data['status'] == 'completed':
                print("✅ Match status correctly updated to 'completed' when all maps are completed")
                results["status_update"] = True
            elif not all_maps_completed:
                print("ℹ️ Not all maps are completed, so match status should not be 'completed'")
                results["status_update"] = True
            else:
                print(f"❌ Match status not updated correctly. Expected 'completed', got '{scores_update_data['status']}'")
                results["status_update"] = False
        else:
            print("ℹ️ Response does not include match status")
            results["status_update"] = None
    else:
        print("❌ Failed to update map scores")
        results["auto_aggregation"] = False
        results["status_update"] = False
    
    # 3. Get the updated scoreboard to verify changes
    print("\n----- STEP 3: CHECKING UPDATED MATCH SCOREBOARD -----")
    success_updated_scoreboard, updated_scoreboard_data, _ = tester.run_test(
        f"Get Updated Match Scoreboard for ID {match_id}",
        "GET",
        f"matches/{match_id}/scoreboard",
        200
    )
    results["updated_scoreboard"] = success_updated_scoreboard
    
    if success_updated_scoreboard:
        print("✅ Updated match scoreboard retrieved successfully")
        
        # Check updated overall scores
        team1_score = updated_scoreboard_data.get('team1_score', 0)
        team2_score = updated_scoreboard_data.get('team2_score', 0)
        print(f"Updated Overall Scores: Team 1 = {team1_score}, Team 2 = {team2_score}")
        
        # Verify auto-aggregation in the scoreboard
        expected_team1_score = sum(1 for map_data in map_scores_data["maps"] if map_data.get('winner') == 'team1' and map_data.get('completed'))
        expected_team2_score = sum(1 for map_data in map_scores_data["maps"] if map_data.get('winner') == 'team2' and map_data.get('completed'))
        
        scoreboard_aggregation_correct = (team1_score == expected_team1_score and team2_score == expected_team2_score)
        
        if scoreboard_aggregation_correct:
            print("✅ Scoreboard shows correct auto-aggregated overall scores!")
        else:
            print("❌ Scoreboard does not show correct auto-aggregated overall scores!")
            print(f"Expected: Team 1 = {expected_team1_score}, Team 2 = {expected_team2_score}")
            print(f"Actual: Team 1 = {team1_score}, Team 2 = {team2_score}")
        
        results["scoreboard_aggregation"] = scoreboard_aggregation_correct
        
        # Check map scores
        maps = updated_scoreboard_data.get('maps', [])
        print(f"Match has {len(maps)} maps")
        for i, map_data in enumerate(maps):
            print(f"Map {i+1}: {map_data.get('name', 'Unknown')}")
            print(f"  Team 1 Score: {map_data.get('team1_score', 0)}")
            print(f"  Team 2 Score: {map_data.get('team2_score', 0)}")
            print(f"  Completed: {map_data.get('completed', False)}")
            if map_data.get('completed'):
                print(f"  Winner: {map_data.get('winner', 'None')}")
    else:
        print("❌ Failed to retrieve updated match scoreboard")
        results["scoreboard_aggregation"] = False
    
    # 4. Get player IDs from the scoreboard
    player_ids = []
    if success_updated_scoreboard:
        # Extract player IDs from team1_players and team2_players
        if 'team1_players' in updated_scoreboard_data:
            for player in updated_scoreboard_data['team1_players']:
                if 'id' in player:
                    player_ids.append(player['id'])
        
        if 'team2_players' in updated_scoreboard_data:
            for player in updated_scoreboard_data['team2_players']:
                if 'id' in player:
                    player_ids.append(player['id'])
        
        print(f"Found {len(player_ids)} player IDs: {player_ids}")
    
    # 5. Update player statistics
    print("\n----- STEP 4: UPDATING PLAYER STATISTICS -----")
    if player_ids:
        test_player_id = player_ids[0]
        player_stats = {
            "eliminations": 25,
            "deaths": 10,
            "assists": 15,
            "damage": 18500,
            "healing": 0,
            "damage_blocked": 5000,
            "ultimate_usage": 4,
            "objective_time": 180,
            "hero_played": "Captain America"
        }
        
        success_player_stats, player_stats_data, _ = tester.run_test(
            f"Update Player Statistics for Match ID {match_id}, Player ID {test_player_id}",
            "PUT",
            f"admin/matches/{match_id}/player-stats/{test_player_id}",
            200,
            data=player_stats,
            admin_auth=True
        )
        results["player_stats"] = success_player_stats
        
        if success_player_stats:
            print(f"✅ Player statistics updated successfully for player ID {test_player_id}")
        else:
            print(f"❌ Failed to update player statistics for player ID {test_player_id}")
    else:
        print("❌ No player IDs found to test player statistics update")
        results["player_stats"] = False
    
    # 6. Get the complete live state
    print("\n----- STEP 5: CHECKING COMPLETE LIVE STATE -----")
    success_live_state, live_state_data, _ = tester.run_test(
        f"Get Complete Live State for Match ID {match_id}",
        "GET",
        f"admin/matches/{match_id}/live-state",
        200,
        admin_auth=True
    )
    results["live_state"] = success_live_state
    
    if success_live_state:
        print("✅ Complete live state retrieved successfully")
        
        # Check if live state includes overall scores
        if 'match' in live_state_data and 'team1_score' in live_state_data['match'] and 'team2_score' in live_state_data['match']:
            team1_score = live_state_data['match']['team1_score']
            team2_score = live_state_data['match']['team2_score']
            print(f"Live State Overall Scores: Team 1 = {team1_score}, Team 2 = {team2_score}")
            
            # Verify consistency with scoreboard
            if success_updated_scoreboard:
                scoreboard_team1_score = updated_scoreboard_data.get('team1_score', 0)
                scoreboard_team2_score = updated_scoreboard_data.get('team2_score', 0)
                
                scores_consistent = (team1_score == scoreboard_team1_score and team2_score == scoreboard_team2_score)
                
                if scores_consistent:
                    print("✅ Overall scores are consistent between live state and scoreboard!")
                else:
                    print("❌ Overall scores are not consistent between live state and scoreboard!")
                    print(f"Live State: Team 1 = {team1_score}, Team 2 = {team2_score}")
                    print(f"Scoreboard: Team 1 = {scoreboard_team1_score}, Team 2 = {scoreboard_team2_score}")
                
                results["scores_consistent"] = scores_consistent
            else:
                results["scores_consistent"] = False
        else:
            print("❌ Live state does not include overall scores")
            results["scores_consistent"] = False
        
        # Check if live state includes player statistics
        if player_ids and 'teams' in live_state_data:
            player_stats_present = False
            test_player_id = player_ids[0]
            
            # Check team1 players
            if 'team1' in live_state_data['teams'] and 'players' in live_state_data['teams']['team1']:
                for player in live_state_data['teams']['team1']['players']:
                    if 'id' in player and player['id'] == test_player_id and 'stats' in player:
                        player_stats_present = True
                        print(f"✅ Player statistics present in live state for player ID {test_player_id}")
                        print(f"Stats: {player['stats']}")
                        break
            
            # Check team2 players if not found in team1
            if not player_stats_present and 'team2' in live_state_data['teams'] and 'players' in live_state_data['teams']['team2']:
                for player in live_state_data['teams']['team2']['players']:
                    if 'id' in player and player['id'] == test_player_id and 'stats' in player:
                        player_stats_present = True
                        print(f"✅ Player statistics present in live state for player ID {test_player_id}")
                        print(f"Stats: {player['stats']}")
                        break
            
            if not player_stats_present:
                print(f"❌ Player statistics not found in live state for player ID {test_player_id}")
            
            results["player_stats_in_live_state"] = player_stats_present
        else:
            print("❌ Cannot check player statistics in live state (no player IDs or teams data)")
            results["player_stats_in_live_state"] = False
    else:
        print("❌ Failed to retrieve complete live state")
        results["scores_consistent"] = False
        results["player_stats_in_live_state"] = False
    
    # Print summary of results
    print("\n===== SUMMARY OF MARVEL RIVALS LIVE SCORING INTEGRATION TESTS =====")
    for test, success in results.items():
        if success is None:
            continue
        print(f"{'✅' if success else '❌'} {test.replace('_', ' ').title()}: {'Working' if success else 'Not working'}")
    
    # Check if all critical tests passed
    critical_tests = ['auto_aggregation', 'scoreboard_aggregation', 'scores_consistent', 'player_stats', 'player_stats_in_live_state']
    critical_tests_passed = all(results.get(test, False) for test in critical_tests if test in results)
    
    if critical_tests_passed:
        print("\n✅ MARVEL RIVALS LIVE SCORING INTEGRATION IS WORKING CORRECTLY!")
        print("✅ Overall scores auto-calculate from completed maps")
        print("✅ Map completion triggers overall score updates")
        print("✅ Player stats persist and appear in scoreboard")
        print("✅ All data is instantly consistent")
    else:
        print("\n❌ MARVEL RIVALS LIVE SCORING INTEGRATION HAS ISSUES:")
        if not results.get('auto_aggregation', False):
            print("❌ Overall scores do not auto-calculate from completed maps")
        if not results.get('scoreboard_aggregation', False):
            print("❌ Map completion does not trigger overall score updates in scoreboard")
        if not results.get('player_stats', False):
            print("❌ Player stats do not persist")
        if not results.get('player_stats_in_live_state', False):
            print("❌ Player stats do not appear in live state")
        if not results.get('scores_consistent', False):
            print("❌ Data is not instantly consistent between endpoints")
    
    return results, critical_tests_passed

def test_match_290_scoreboard(tester):
    """Test the match 290 scoreboard endpoint to verify response structure"""
    print("\n===== TESTING MATCH 290 SCOREBOARD ENDPOINT =====")
    
    match_id = 290
    success, scoreboard_data, _ = tester.run_test(
        f"Get Match Scoreboard for ID {match_id}",
        "GET",
        f"matches/{match_id}/scoreboard",
        200
    )
    
    if success and scoreboard_data:
        print("✅ Match 290 scoreboard endpoint is working")
        
        # Check response structure (data.match vs data.match_info)
        if 'match' in scoreboard_data:
            print("✅ Response contains data.match structure")
            match_data = scoreboard_data['match']
            print(f"Match ID: {match_data.get('id')}")
        elif 'match_info' in scoreboard_data:
            print("✅ Response contains data.match_info structure")
            match_data = scoreboard_data['match_info']
            print(f"Match ID: {match_data.get('id')}")
        else:
            print("❌ Response does not contain either data.match or data.match_info")
            
        # Check team data structure
        if 'teams' in scoreboard_data:
            teams = scoreboard_data['teams']
            if 'team1' in teams and 'name' in teams['team1']:
                print(f"✅ Team 1 name: {teams['team1']['name']}")
            else:
                print("❌ Missing teams.team1.name in response")
                
            if 'team2' in teams and 'name' in teams['team2']:
                print(f"✅ Team 2 name: {teams['team2']['name']}")
            else:
                print("❌ Missing teams.team2.name in response")
        else:
            print("❌ Missing teams data in response")
            
        # Check player data structure
        if 'teams' in scoreboard_data:
            teams = scoreboard_data['teams']
            if 'team1' in teams and 'players' in teams['team1']:
                print(f"✅ Team 1 has {len(teams['team1']['players'])} players")
                for i, player in enumerate(teams['team1']['players']):
                    print(f"  Player {i+1}: {player.get('name', 'Unknown')} (ID: {player.get('id', 'Unknown')})")
            else:
                print("❌ Missing team1.players in response")
                
            if 'team2' in teams and 'players' in teams['team2']:
                print(f"✅ Team 2 has {len(teams['team2']['players'])} players")
                for i, player in enumerate(teams['team2']['players']):
                    print(f"  Player {i+1}: {player.get('name', 'Unknown')} (ID: {player.get('id', 'Unknown')})")
            else:
                print("❌ Missing team2.players in response")
        else:
            print("❌ Missing teams data in response")
            
        return success, scoreboard_data
    else:
        print("❌ Failed to retrieve match 290 scoreboard")
        return False, {}

def test_player_stats_update_for_match_290(tester):
    """Test updating player stats for match 290"""
    print("\n===== TESTING PLAYER STATS UPDATE FOR MATCH 290 =====")
    
    match_id = 290
    
    # First, get the scoreboard to find player IDs
    success, scoreboard_data, _ = tester.run_test(
        f"Get Match Scoreboard for ID {match_id}",
        "GET",
        f"matches/{match_id}/scoreboard",
        200
    )
    
    if success and scoreboard_data:
        # Extract player IDs
        player_ids = []
        if 'teams' in scoreboard_data:
            teams = scoreboard_data['teams']
            if 'team1' in teams and 'players' in teams['team1']:
                for player in teams['team1']['players']:
                    if 'id' in player:
                        player_ids.append(player['id'])
                        
            if 'team2' in teams and 'players' in teams['team2']:
                for player in teams['team2']['players']:
                    if 'id' in player:
                        player_ids.append(player['id'])
        
        if player_ids:
            print(f"Found {len(player_ids)} player IDs: {player_ids}")
            
            # Test updating stats for the first player
            test_player_id = player_ids[0]
            stats_data = {
                "eliminations": 25,
                "deaths": 10,
                "assists": 15,
                "damage": 18500,
                "healing": 0,
                "damage_blocked": 5000,
                "ultimate_usage": 4,
                "objective_time": 180,
                "hero_played": "Captain America"
            }
            
            # Test with admin token
            success_admin, response_admin, _ = tester.run_test(
                f"Update Player Stats for Match ID {match_id}, Player ID {test_player_id} (Admin)",
                "POST",
                f"matches/{match_id}/players/{test_player_id}/stats",
                200,
                data=stats_data,
                admin_auth=True
            )
            
            # Test without token (should fail with 401)
            success_no_auth, response_no_auth, _ = tester.run_test(
                f"Update Player Stats for Match ID {match_id}, Player ID {test_player_id} (No Auth)",
                "POST",
                f"matches/{match_id}/players/{test_player_id}/stats",
                401,
                data=stats_data
            )
            
            # Test with invalid player ID (should fail with 404)
            success_invalid_id, response_invalid_id, _ = tester.run_test(
                f"Update Player Stats for Match ID {match_id}, Invalid Player ID",
                "POST",
                f"matches/{match_id}/players/99999/stats",
                404,
                data=stats_data,
                admin_auth=True
            )
            
            return success_admin, player_ids
        else:
            print("❌ No player IDs found in scoreboard response")
            return False, []
    else:
        print("❌ Failed to retrieve match 290 scoreboard")
        return False, []

def test_score_update_endpoints(tester):
    """Test score update endpoints for match 290"""
    print("\n===== TESTING SCORE UPDATE ENDPOINTS FOR MATCH 290 =====")
    
    match_id = 290
    
    # Test updating match scores
    score_data = {
        "team1_score": 1,
        "team2_score": 0,
        "maps": [
            {
                "map_index": 0,
                "team1_score": 100,
                "team2_score": 85,
                "completed": True,
                "winner": "team1"
            }
        ]
    }
    
    success_scores, response_scores, _ = tester.run_test(
        f"Update Match Scores for ID {match_id}",
        "PUT",
        f"admin/matches/{match_id}/scores",
        200,
        data=score_data,
        admin_auth=True
    )
    
    if success_scores:
        print("✅ Score update endpoint is working")
        
        # Check if the response includes updated overall scores
        if 'team1_score' in response_scores and 'team2_score' in response_scores:
            print(f"Updated Overall Scores: Team 1 = {response_scores['team1_score']}, Team 2 = {response_scores['team2_score']}")
        else:
            print("❌ Response does not include updated overall scores")
    else:
        print("❌ Score update endpoint is not working")
    
    # Test updating match status
    status_data = {"status": "live"}
    success_status, response_status, _ = tester.run_test(
        f"Update Match Status for ID {match_id}",
        "PUT",
        f"admin/matches/{match_id}/status",
        200,
        data=status_data,
        admin_auth=True
    )
    
    if success_status:
        print("✅ Status update endpoint is working")
        print(f"Updated Status: {response_status.get('status', 'unknown')}")
    else:
        print("❌ Status update endpoint is not working")
    
    return success_scores and success_status

def test_game_data_endpoints(tester):
    """Test game data endpoints for heroes, maps, and modes"""
    print("\n===== TESTING GAME DATA ENDPOINTS =====")
    
    # Test heroes endpoint
    success_heroes, heroes_data, _ = tester.run_test(
        "Get All Marvel Rivals Heroes",
        "GET",
        "game-data/all-heroes",
        200
    )
    
    if success_heroes:
        print("✅ Heroes endpoint is working")
        if isinstance(heroes_data, list):
            print(f"Found {len(heroes_data)} heroes")
            if len(heroes_data) > 0:
                print("Sample heroes:")
                for i, hero in enumerate(heroes_data[:5]):
                    print(f"  {i+1}. {hero.get('name', 'Unknown')}")
        else:
            print(f"Heroes data structure: {type(heroes_data)}")
    else:
        print("❌ Heroes endpoint is not working")
    
    # Test maps endpoint
    success_maps, maps_data, _ = tester.run_test(
        "Get All Marvel Rivals Maps",
        "GET",
        "game-data/maps",
        200
    )
    
    if success_maps:
        print("✅ Maps endpoint is working")
        if isinstance(maps_data, list):
            print(f"Found {len(maps_data)} maps")
            if len(maps_data) > 0:
                print("Sample maps:")
                for i, map_data in enumerate(maps_data[:5]):
                    print(f"  {i+1}. {map_data.get('name', 'Unknown')}")
        else:
            print(f"Maps data structure: {type(maps_data)}")
    else:
        print("❌ Maps endpoint is not working")
    
    # Test modes endpoint
    success_modes, modes_data, _ = tester.run_test(
        "Get All Game Modes",
        "GET",
        "game-data/modes",
        200
    )
    
    if success_modes:
        print("✅ Modes endpoint is working")
        if isinstance(modes_data, list):
            print(f"Found {len(modes_data)} modes")
            if len(modes_data) > 0:
                print("Sample modes:")
                for i, mode in enumerate(modes_data[:5]):
                    print(f"  {i+1}. {mode.get('name', 'Unknown')}")
        else:
            print(f"Modes data structure: {type(modes_data)}")
    else:
        print("❌ Modes endpoint is not working")
    
    return success_heroes and success_maps and success_modes

def verify_backend_url(tester):
    """Verify that the backend URL is correct and accessible"""
    print("\n===== VERIFYING BACKEND URL =====")
    
    # Test a simple endpoint to verify the backend is accessible
    success, _, _ = tester.run_test(
        "Verify Backend URL",
        "GET",
        "game-data/all-heroes",
        200
    )
    
    if success:
        print(f"✅ Backend URL {tester.api_url} is correct and accessible")
        return True
    else:
        print(f"❌ Backend URL {tester.api_url} is not accessible")
        return False

def main():
    # Setup
    tester = MarvelRivalsAPITester(base_url="https://staging.mrvl.net")
    
    print("\n🚀 Starting Marvel Rivals API Tests - Focused on Live Scoring Integration\n")
    print(f"🌐 Base URL: {tester.base_url}")
    print(f"🌐 API URL: {tester.api_url}")
    print(f"🔑 Admin Token: {tester.admin_token[:10]}...")
    
    # Test 1: Verify backend URL
    backend_url_verified = verify_backend_url(tester)
    
    if backend_url_verified:
        # Test 2: Match 290 scoreboard endpoint
        match_290_success, match_290_data = test_match_290_scoreboard(tester)
        
        # Test 3: Player stats update for match 290
        player_stats_success, player_ids = test_player_stats_update_for_match_290(tester)
        
        # Test 4: Score update endpoints
        score_update_success = test_score_update_endpoints(tester)
        
        # Test 5: Game data endpoints
        game_data_success = test_game_data_endpoints(tester)
        
        # Check response structure for frontend integration
        print("\n===== CHECKING RESPONSE STRUCTURE FOR FRONTEND INTEGRATION =====")
        if match_290_success and match_290_data:
            if 'match' in match_290_data and 'id' in match_290_data['match']:
                print("✅ Backend returns data.match.id structure")
                print(f"Match ID: {match_290_data['match']['id']}")
            elif 'match_info' in match_290_data and 'id' in match_290_data['match_info']:
                print("✅ Backend returns data.match_info.id structure")
                print(f"Match ID: {match_290_data['match_info']['id']}")
                print("⚠️ Frontend expects data.match.id but backend returns data.match_info.id")
                print("⚠️ Frontend should be updated to use data.match_info.id")
            else:
                print("❌ Backend response does not contain either data.match.id or data.match_info.id")
    else:
        print("❌ Cannot proceed with tests because the backend URL is not accessible")
    
    # Print summary
    tester.print_summary()
    
    return 0 if backend_url_verified else 1

if __name__ == "__main__":
    sys.exit(main())
