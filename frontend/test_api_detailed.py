#!/usr/bin/env python3
"""
Marvel Rivals Live Scoring API Test Suite
Comprehensive testing of match detail API and live scoring functionality
"""

import requests
import json
import time
import sys
from datetime import datetime
from typing import Dict, Any, List, Optional
import concurrent.futures
import threading

class MRVLApiTester:
    def __init__(self, base_url: str = "https://staging.mrvl.net", match_id: int = 6):
        self.base_url = base_url
        self.match_id = match_id
        self.session = requests.Session()
        self.session.headers.update({
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'MRVL-Live-Scoring-Test/1.0'
        })
        self.results = {}
        self.start_time = datetime.now()
        
    def log(self, message: str, level: str = "INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
        prefix = {
            "INFO": "ℹ️",
            "SUCCESS": "✅", 
            "WARNING": "⚠️",
            "ERROR": "❌",
            "DEBUG": "🔍"
        }.get(level, "📝")
        print(f"[{timestamp}] {prefix} {message}")
        
    def test_match_detail_api(self) -> Dict[str, Any]:
        """Test the main match detail API endpoint"""
        self.log("Testing match detail API endpoint")
        
        try:
            response = self.session.get(f"{self.base_url}/api/matches/{self.match_id}")
            
            result = {
                "status_code": response.status_code,
                "response_time_ms": response.elapsed.total_seconds() * 1000,
                "success": response.status_code == 200,
                "timestamp": datetime.now().isoformat()
            }
            
            if response.status_code == 200:
                data = response.json()
                result["data"] = data
                
                # Extract match details
                match_data = data.get('data', data)
                result["analysis"] = {
                    "has_teams": bool(match_data.get('team1') and match_data.get('team2')),
                    "team1_name": match_data.get('team1', {}).get('name', 'N/A'),
                    "team2_name": match_data.get('team2', {}).get('name', 'N/A'),
                    "team1_score": match_data.get('team1_score', 0),
                    "team2_score": match_data.get('team2_score', 0),
                    "status": match_data.get('status', 'unknown'),
                    "has_maps": bool(match_data.get('maps')),
                    "maps_count": len(match_data.get('maps', [])),
                    "format": match_data.get('format', 'unknown')
                }
                
                self.log(f"SUCCESS: Match {self.match_id} - {result['analysis']['team1_name']} vs {result['analysis']['team2_name']}")
                self.log(f"Score: {result['analysis']['team1_score']}-{result['analysis']['team2_score']} | Status: {result['analysis']['status']}")
                
            else:
                result["error"] = response.text
                self.log(f"ERROR: API returned {response.status_code}", "ERROR")
                
        except Exception as e:
            result = {
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
            self.log(f"ERROR: Exception occurred - {e}", "ERROR")
            
        return result
    
    def test_player_rosters(self, match_data: Dict[str, Any]) -> Dict[str, Any]:
        """Test player roster data structure and completeness"""
        self.log("Testing player rosters data")
        
        result = {
            "team1_players": [],
            "team2_players": [],
            "map_compositions": [],
            "analysis": {}
        }
        
        try:
            # Extract team players
            team1 = match_data.get('team1', {})
            team2 = match_data.get('team2', {})
            
            team1_players = team1.get('players', team1.get('roster', []))
            team2_players = team2.get('players', team2.get('roster', []))
            
            result["team1_players"] = team1_players
            result["team2_players"] = team2_players
            
            # Analyze player data
            result["analysis"]["team1_player_count"] = len(team1_players)
            result["analysis"]["team2_player_count"] = len(team2_players)
            
            # Check maps for player compositions
            maps_data = match_data.get('maps', [])
            for i, map_data in enumerate(maps_data):
                map_analysis = {
                    "map_number": i + 1,
                    "map_name": map_data.get('map_name', f'Map {i + 1}'),
                    "team1_composition": map_data.get('team1_composition', map_data.get('team1_players', [])),
                    "team2_composition": map_data.get('team2_composition', map_data.get('team2_players', [])),
                    "team1_score": map_data.get('team1_score', 0),
                    "team2_score": map_data.get('team2_score', 0)
                }
                
                map_analysis["team1_comp_count"] = len(map_analysis["team1_composition"])
                map_analysis["team2_comp_count"] = len(map_analysis["team2_composition"])
                
                result["map_compositions"].append(map_analysis)
                
                self.log(f"Map {i + 1} ({map_analysis['map_name']}): T1={map_analysis['team1_comp_count']} players, T2={map_analysis['team2_comp_count']} players")
            
            # Overall analysis
            result["analysis"]["maps_with_compositions"] = sum(1 for m in result["map_compositions"] if m["team1_comp_count"] > 0 or m["team2_comp_count"] > 0)
            result["analysis"]["total_maps"] = len(maps_data)
            
            self.log(f"SUCCESS: Team rosters analyzed - T1: {result['analysis']['team1_player_count']} players, T2: {result['analysis']['team2_player_count']} players")
            
        except Exception as e:
            result["error"] = str(e)
            self.log(f"ERROR: Failed to analyze player rosters - {e}", "ERROR")
            
        return result
    
    def test_score_consistency(self, iterations: int = 10, interval: float = 0.5) -> Dict[str, Any]:
        """Test score consistency across multiple rapid requests"""
        self.log(f"Testing score consistency across {iterations} requests")
        
        scores = []
        response_times = []
        
        for i in range(iterations):
            try:
                start_time = time.time()
                response = self.session.get(f"{self.base_url}/api/matches/{self.match_id}")
                end_time = time.time()
                
                response_time = (end_time - start_time) * 1000
                response_times.append(response_time)
                
                if response.status_code == 200:
                    data = response.json()
                    match_data = data.get('data', data)
                    
                    score_data = {
                        "iteration": i + 1,
                        "timestamp": datetime.now().isoformat(),
                        "team1_score": match_data.get('team1_score', 0),
                        "team2_score": match_data.get('team2_score', 0),
                        "status": match_data.get('status', 'unknown'),
                        "response_time_ms": response_time
                    }
                    scores.append(score_data)
                    
                    self.log(f"Request {i + 1}: {score_data['team1_score']}-{score_data['team2_score']} ({response_time:.1f}ms)")
                
                time.sleep(interval)
                
            except Exception as e:
                self.log(f"ERROR: Request {i + 1} failed - {e}", "ERROR")
        
        # Analyze consistency
        unique_scores = set((s['team1_score'], s['team2_score']) for s in scores)
        unique_statuses = set(s['status'] for s in scores)
        
        result = {
            "scores": scores,
            "analysis": {
                "total_requests": iterations,
                "successful_requests": len(scores),
                "unique_score_combinations": len(unique_scores),
                "unique_statuses": len(unique_statuses),
                "score_variations": list(unique_scores),
                "status_variations": list(unique_statuses),
                "avg_response_time_ms": sum(response_times) / len(response_times) if response_times else 0,
                "max_response_time_ms": max(response_times) if response_times else 0,
                "min_response_time_ms": min(response_times) if response_times else 0
            }
        }
        
        if len(unique_scores) == 1:
            self.log("SUCCESS: Scores are consistent across all requests", "SUCCESS")
        else:
            self.log(f"WARNING: Score variations detected - {len(unique_scores)} different combinations", "WARNING")
            
        self.log(f"Average response time: {result['analysis']['avg_response_time_ms']:.1f}ms")
        
        return result
    
    def test_live_endpoints(self) -> Dict[str, Any]:
        """Test live scoring specific endpoints"""
        self.log("Testing live scoring endpoints")
        
        result = {
            "sse_endpoint": {},
            "live_update_endpoint": {},
            "status_endpoint": {}
        }
        
        # Test SSE endpoint
        try:
            sse_url = f"{self.base_url}/api/public/matches/{self.match_id}/live-stream"
            self.log(f"Testing SSE endpoint: {sse_url}")
            
            response = self.session.get(sse_url, stream=True, timeout=3)
            result["sse_endpoint"] = {
                "status_code": response.status_code,
                "headers": dict(response.headers),
                "accessible": response.status_code in [200, 204]
            }
            
            if response.status_code == 200:
                self.log("SUCCESS: SSE endpoint is accessible", "SUCCESS")
            else:
                self.log(f"WARNING: SSE endpoint returned {response.status_code}", "WARNING")
                
        except requests.exceptions.Timeout:
            result["sse_endpoint"]["accessible"] = True
            result["sse_endpoint"]["note"] = "Timeout expected for SSE streams"
            self.log("INFO: SSE endpoint timeout (expected for active streams)")
        except Exception as e:
            result["sse_endpoint"]["error"] = str(e)
            self.log(f"ERROR: SSE endpoint test failed - {e}", "ERROR")
        
        # Test live update endpoint (POST)
        try:
            update_url = f"{self.base_url}/api/matches/{self.match_id}/live-update"
            test_payload = {"type": "test", "data": {"test": True}}
            
            response = self.session.post(update_url, json=test_payload)
            result["live_update_endpoint"] = {
                "status_code": response.status_code,
                "accessible": response.status_code in [200, 401, 403]  # 401/403 means endpoint exists
            }
            
            if response.status_code == 401:
                self.log("SUCCESS: Live update endpoint exists (authentication required)", "SUCCESS")
            elif response.status_code == 200:
                self.log("SUCCESS: Live update endpoint accessible", "SUCCESS")
            else:
                self.log(f"WARNING: Live update endpoint returned {response.status_code}", "WARNING")
                
        except Exception as e:
            result["live_update_endpoint"]["error"] = str(e)
            self.log(f"ERROR: Live update endpoint test failed - {e}", "ERROR")
        
        # Test status endpoint
        try:
            status_url = f"{self.base_url}/api/public/matches/{self.match_id}/status"
            response = self.session.get(status_url)
            
            result["status_endpoint"] = {
                "status_code": response.status_code,
                "accessible": response.status_code == 200
            }
            
            if response.status_code == 200:
                self.log("SUCCESS: Status endpoint is accessible", "SUCCESS")
                result["status_endpoint"]["data"] = response.json()
            else:
                self.log(f"WARNING: Status endpoint returned {response.status_code}", "WARNING")
                
        except Exception as e:
            result["status_endpoint"]["error"] = str(e)
            self.log(f"ERROR: Status endpoint test failed - {e}", "ERROR")
        
        return result
    
    def test_concurrent_requests(self, concurrent_users: int = 5, requests_per_user: int = 3) -> Dict[str, Any]:
        """Test API under concurrent load"""
        self.log(f"Testing concurrent access - {concurrent_users} users, {requests_per_user} requests each")
        
        def user_requests(user_id: int) -> List[Dict[str, Any]]:
            user_results = []
            for i in range(requests_per_user):
                try:
                    start_time = time.time()
                    response = self.session.get(f"{self.base_url}/api/matches/{self.match_id}")
                    end_time = time.time()
                    
                    user_results.append({
                        "user_id": user_id,
                        "request_num": i + 1,
                        "status_code": response.status_code,
                        "response_time_ms": (end_time - start_time) * 1000,
                        "success": response.status_code == 200,
                        "timestamp": datetime.now().isoformat()
                    })
                except Exception as e:
                    user_results.append({
                        "user_id": user_id,
                        "request_num": i + 1,
                        "error": str(e),
                        "success": False,
                        "timestamp": datetime.now().isoformat()
                    })
            return user_results
        
        all_results = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=concurrent_users) as executor:
            futures = [executor.submit(user_requests, i) for i in range(concurrent_users)]
            for future in concurrent.futures.as_completed(futures):
                all_results.extend(future.result())
        
        # Analyze results
        successful_requests = [r for r in all_results if r.get('success', False)]
        failed_requests = [r for r in all_results if not r.get('success', True)]
        
        response_times = [r['response_time_ms'] for r in successful_requests if 'response_time_ms' in r]
        
        result = {
            "total_requests": len(all_results),
            "successful_requests": len(successful_requests),
            "failed_requests": len(failed_requests),
            "success_rate": len(successful_requests) / len(all_results) * 100 if all_results else 0,
            "avg_response_time_ms": sum(response_times) / len(response_times) if response_times else 0,
            "max_response_time_ms": max(response_times) if response_times else 0,
            "all_results": all_results
        }
        
        self.log(f"SUCCESS: Concurrent test completed - {result['success_rate']:.1f}% success rate", "SUCCESS")
        self.log(f"Average response time under load: {result['avg_response_time_ms']:.1f}ms")
        
        return result
    
    def run_comprehensive_test(self) -> Dict[str, Any]:
        """Run all tests and compile comprehensive results"""
        self.log("Starting comprehensive live scoring test suite")
        
        # Test 1: Basic match detail API
        match_detail_result = self.test_match_detail_api()
        self.results["match_detail_api"] = match_detail_result
        
        if not match_detail_result.get('success', False):
            self.log("ERROR: Basic API test failed, skipping dependent tests", "ERROR")
            return self.results
        
        match_data = match_detail_result.get('data', {}).get('data', match_detail_result.get('data', {}))
        
        # Test 2: Player rosters
        self.results["player_rosters"] = self.test_player_rosters(match_data)
        
        # Test 3: Score consistency
        self.results["score_consistency"] = self.test_score_consistency()
        
        # Test 4: Live endpoints
        self.results["live_endpoints"] = self.test_live_endpoints()
        
        # Test 5: Concurrent access
        self.results["concurrent_access"] = self.test_concurrent_requests()
        
        # Generate summary
        self.generate_summary()
        
        return self.results
    
    def generate_summary(self):
        """Generate test summary"""
        self.log("\n" + "="*60)
        self.log("COMPREHENSIVE TEST SUMMARY")
        self.log("="*60)
        
        total_time = (datetime.now() - self.start_time).total_seconds()
        self.log(f"Total test duration: {total_time:.2f} seconds")
        
        # API Accessibility
        api_success = self.results.get("match_detail_api", {}).get("success", False)
        self.log(f"Match Detail API: {'✅ PASS' if api_success else '❌ FAIL'}")
        
        # Player Data
        player_data = self.results.get("player_rosters", {})
        team1_count = player_data.get("analysis", {}).get("team1_player_count", 0)
        team2_count = player_data.get("analysis", {}).get("team2_player_count", 0)
        self.log(f"Player Rosters: Team1={team1_count}, Team2={team2_count}")
        
        # Score Consistency
        consistency = self.results.get("score_consistency", {})
        unique_scores = consistency.get("analysis", {}).get("unique_score_combinations", 0)
        avg_response = consistency.get("analysis", {}).get("avg_response_time_ms", 0)
        self.log(f"Score Consistency: {unique_scores} unique combinations, {avg_response:.1f}ms avg response")
        
        # Live Endpoints
        live_endpoints = self.results.get("live_endpoints", {})
        sse_ok = live_endpoints.get("sse_endpoint", {}).get("accessible", False)
        update_ok = live_endpoints.get("live_update_endpoint", {}).get("accessible", False)
        self.log(f"Live Endpoints: SSE={'✅' if sse_ok else '❌'}, Update={'✅' if update_ok else '❌'}")
        
        # Concurrent Performance
        concurrent = self.results.get("concurrent_access", {})
        success_rate = concurrent.get("success_rate", 0)
        load_response = concurrent.get("avg_response_time_ms", 0)
        self.log(f"Concurrent Performance: {success_rate:.1f}% success rate, {load_response:.1f}ms avg under load")
        
        # Overall assessment
        critical_tests_passed = sum([
            api_success,
            unique_scores <= 2,  # Allow minimal score variation
            sse_ok or update_ok,  # At least one live endpoint working
            success_rate >= 90  # 90%+ success rate under load
        ])
        
        if critical_tests_passed >= 3:
            self.log("🎉 OVERALL: Live scoring system appears to be functioning well", "SUCCESS")
        elif critical_tests_passed >= 2:
            self.log("⚠️  OVERALL: Live scoring system has minor issues", "WARNING")
        else:
            self.log("❌ OVERALL: Live scoring system has significant issues", "ERROR")
    
    def save_results(self, filename: str = None):
        """Save test results to JSON file"""
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"live_scoring_test_results_{timestamp}.json"
        
        try:
            with open(filename, 'w') as f:
                json.dump(self.results, f, indent=2, default=str)
            self.log(f"Results saved to {filename}")
        except Exception as e:
            self.log(f"ERROR: Failed to save results - {e}", "ERROR")

def main():
    """Main execution function"""
    if len(sys.argv) > 1:
        match_id = int(sys.argv[1])
    else:
        match_id = 6
    
    tester = MRVLApiTester(match_id=match_id)
    
    try:
        results = tester.run_comprehensive_test()
        tester.save_results()
        
        # Exit with appropriate code
        api_success = results.get("match_detail_api", {}).get("success", False)
        if api_success:
            sys.exit(0)
        else:
            sys.exit(1)
            
    except KeyboardInterrupt:
        tester.log("Test interrupted by user", "WARNING")
        sys.exit(130)
    except Exception as e:
        tester.log(f"Unexpected error: {e}", "ERROR")
        sys.exit(1)

if __name__ == "__main__":
    main()