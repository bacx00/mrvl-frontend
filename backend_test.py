
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
                base_url = "https://cfcfe94e-c75a-401f-9e7b-4d116d785c2b.preview.emergentagent.com"
        
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

def test_match_scoreboard(tester, match_id):
    """Test the match scoreboard endpoint to verify it returns complete data"""
    print(f"\n----- TESTING MATCH SCOREBOARD FOR ID {match_id} -----")
    success, scoreboard_data = tester.run_test(
        f"Get Match Scoreboard for ID {match_id}",
        "GET",
        f"matches/{match_id}/scoreboard",
        200
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
        
        return success, team_logos_present, player_heroes_present, scoreboard_data
    
    return False, False, False, {}

def test_match_detail_vs_scoreboard(tester, match_id):
    """Compare match detail and scoreboard endpoints to verify data consistency"""
    print(f"\n----- COMPARING MATCH DETAIL AND SCOREBOARD FOR ID {match_id} -----")
    
    # Get match detail
    success_detail, match_detail = tester.test_get_match_detail(match_id)
    
    # Get match scoreboard
    success_scoreboard, team_logos_present, player_heroes_present, scoreboard_data = test_match_scoreboard(tester, match_id)
    
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
        
        return success_detail and success_scoreboard, team_data_consistent, scoreboard_has_extra_data
    
    return False, False, False

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
        
        success_update, update_response = test_player_stats_update(tester, 114, test_player_id, stats_data)
        
        if success_update:
            print(f"✅ Successfully updated stats for player ID {test_player_id}")
            
            # Verify the update by getting the scoreboard again
            print("\n----- VERIFYING STATS UPDATE -----")
            success_verify, updated_scoreboard = tester.test_get_match_scoreboard(114)
            
            if success_verify:
                # Find the player in the updated scoreboard
                player_found = False
                updated_stats = None
                
                # Check team1 players
                if 'team1_players' in updated_scoreboard:
                    for player in updated_scoreboard['team1_players']:
                        if player.get('id') == test_player_id:
                            player_found = True
                            updated_stats = player
                            break
                
                # Check team2 players if not found in team1
                if not player_found and 'team2_players' in updated_scoreboard:
                    for player in updated_scoreboard['team2_players']:
                        if player.get('id') == test_player_id:
                            player_found = True
                            updated_stats = player
                            break
                
                if player_found and updated_stats:
                    print(f"✅ Found player ID {test_player_id} in updated scoreboard")
                    
                    # Check if stats were updated
                    stats_updated = False
                    if 'stats' in updated_stats:
                        stats = updated_stats['stats']
                        if (stats.get('kills') == stats_data['kills'] or 
                            stats.get('deaths') == stats_data['deaths'] or 
                            stats.get('assists') == stats_data['assists']):
                            stats_updated = True
                            print("✅ Player stats were successfully updated")
                        else:
                            print("❌ Player stats were not updated correctly")
                    else:
                        print("❌ Player stats field missing in updated scoreboard")
                else:
                    print(f"❌ Could not find player ID {test_player_id} in updated scoreboard")
            else:
                print("❌ Failed to verify stats update")
        else:
            print(f"❌ Failed to update stats for player ID {test_player_id}")
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
    
    success_invalid, invalid_response = test_player_stats_update(tester, 114, invalid_player_id, stats_data)
    
    if not success_invalid:
        print("✅ Correctly rejected update with invalid player ID")
    else:
        print("❌ Unexpectedly accepted update with invalid player ID")
    
    # 5. SUMMARY OF FINDINGS
    print("\n===== SUMMARY OF FINDINGS =====")
    print(f"✅ Match scoreboard endpoint: {'Working' if success_scoreboard else 'Not working'}")
    print(f"✅ Player IDs in scoreboard: {'All present' if all_players_have_ids else 'Some missing'}")
    
    if player_ids:
        print(f"✅ Player stats update endpoint: {'Working' if success_update else 'Not working'}")
    else:
        print("❌ Could not test player stats update due to missing player IDs")
    
    # Print summary
    tester.print_summary()
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
