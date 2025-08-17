#!/usr/bin/env python3
"""
Marvel Rivals Live Scoring Performance Validation
Tests edge cases, performance under load, and real-time responsiveness
"""

import requests
import time
import json
import statistics
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta
import sys

class LiveScoringValidator:
    def __init__(self, base_url="https://staging.mrvl.net", match_id=6):
        self.base_url = base_url
        self.match_id = match_id
        self.session = requests.Session()
        self.session.headers.update({
            'Accept': 'application/json',
            'User-Agent': 'MRVL-Performance-Validator/1.0'
        })
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
        print(f"[{timestamp}] {level}: {message}")
        
    def performance_test_burst_requests(self, burst_size=20, delay=0.05):
        """Test system response to burst of requests (simulating live tournament traffic)"""
        self.log(f"Testing burst performance: {burst_size} requests with {delay}s delay")
        
        results = []
        start_time = time.time()
        
        for i in range(burst_size):
            request_start = time.time()
            try:
                response = self.session.get(f"{self.base_url}/api/matches/{self.match_id}")
                request_end = time.time()
                
                results.append({
                    'request_num': i + 1,
                    'status_code': response.status_code,
                    'response_time': (request_end - request_start) * 1000,
                    'success': response.status_code == 200,
                    'data_size': len(response.content)
                })
                
                if response.status_code == 200:
                    data = response.json()
                    match_data = data.get('data', data)
                    results[-1]['team1_score'] = match_data.get('team1_score', 0)
                    results[-1]['team2_score'] = match_data.get('team2_score', 0)
                    
            except Exception as e:
                results.append({
                    'request_num': i + 1,
                    'error': str(e),
                    'success': False
                })
                
            time.sleep(delay)
            
        total_time = time.time() - start_time
        
        # Analyze results
        successful_results = [r for r in results if r.get('success', False)]
        response_times = [r['response_time'] for r in successful_results]
        
        analysis = {
            'total_requests': burst_size,
            'successful_requests': len(successful_results),
            'success_rate': len(successful_results) / burst_size * 100,
            'total_time': total_time,
            'requests_per_second': burst_size / total_time,
            'avg_response_time': statistics.mean(response_times) if response_times else 0,
            'median_response_time': statistics.median(response_times) if response_times else 0,
            'min_response_time': min(response_times) if response_times else 0,
            'max_response_time': max(response_times) if response_times else 0,
            'std_dev_response_time': statistics.stdev(response_times) if len(response_times) > 1 else 0
        }
        
        self.log(f"Burst test completed: {analysis['success_rate']:.1f}% success rate")
        self.log(f"Performance: {analysis['requests_per_second']:.1f} req/s, {analysis['avg_response_time']:.1f}ms avg")
        
        return analysis, results
        
    def test_concurrent_heavy_load(self, concurrent_users=10, requests_per_user=5):
        """Test system under heavy concurrent load"""
        self.log(f"Testing heavy concurrent load: {concurrent_users} users × {requests_per_user} requests")
        
        def user_session(user_id):
            user_results = []
            session = requests.Session()
            session.headers.update(self.session.headers)
            
            for req_num in range(requests_per_user):
                try:
                    start_time = time.time()
                    response = session.get(f"{self.base_url}/api/matches/{self.match_id}")
                    end_time = time.time()
                    
                    user_results.append({
                        'user_id': user_id,
                        'request_num': req_num + 1,
                        'status_code': response.status_code,
                        'response_time': (end_time - start_time) * 1000,
                        'success': response.status_code == 200,
                        'timestamp': datetime.now().isoformat()
                    })
                    
                    # Small delay to simulate realistic user behavior
                    time.sleep(0.1)
                    
                except Exception as e:
                    user_results.append({
                        'user_id': user_id,
                        'request_num': req_num + 1,
                        'error': str(e),
                        'success': False,
                        'timestamp': datetime.now().isoformat()
                    })
                    
            return user_results
            
        # Execute concurrent sessions
        all_results = []
        start_time = time.time()
        
        with ThreadPoolExecutor(max_workers=concurrent_users) as executor:
            future_to_user = {executor.submit(user_session, user_id): user_id 
                             for user_id in range(concurrent_users)}
            
            for future in as_completed(future_to_user):
                user_results = future.result()
                all_results.extend(user_results)
                
        total_time = time.time() - start_time
        
        # Analyze concurrent performance
        successful_requests = [r for r in all_results if r.get('success', False)]
        response_times = [r['response_time'] for r in successful_requests]
        
        analysis = {
            'concurrent_users': concurrent_users,
            'total_requests': len(all_results),
            'successful_requests': len(successful_requests),
            'success_rate': len(successful_requests) / len(all_results) * 100,
            'total_time': total_time,
            'avg_response_time': statistics.mean(response_times) if response_times else 0,
            'max_response_time': max(response_times) if response_times else 0,
            'performance_degradation': None
        }
        
        # Compare to baseline single-user performance
        baseline_response = self.single_request_baseline()
        if baseline_response and response_times:
            analysis['performance_degradation'] = (
                analysis['avg_response_time'] / baseline_response['response_time'] - 1
            ) * 100
            
        self.log(f"Concurrent test: {analysis['success_rate']:.1f}% success, {analysis['avg_response_time']:.1f}ms avg")
        if analysis['performance_degradation'] is not None:
            self.log(f"Performance degradation: {analysis['performance_degradation']:.1f}%")
            
        return analysis, all_results
        
    def single_request_baseline(self):
        """Get baseline single request performance"""
        try:
            start_time = time.time()
            response = self.session.get(f"{self.base_url}/api/matches/{self.match_id}")
            end_time = time.time()
            
            return {
                'response_time': (end_time - start_time) * 1000,
                'status_code': response.status_code,
                'success': response.status_code == 200
            }
        except Exception:
            return None
            
    def test_data_consistency_over_time(self, duration_minutes=2, check_interval=5):
        """Test data consistency over extended period"""
        self.log(f"Testing data consistency over {duration_minutes} minutes (checks every {check_interval}s)")
        
        end_time = datetime.now() + timedelta(minutes=duration_minutes)
        snapshots = []
        
        while datetime.now() < end_time:
            try:
                response = self.session.get(f"{self.base_url}/api/matches/{self.match_id}")
                if response.status_code == 200:
                    data = response.json()
                    match_data = data.get('data', data)
                    
                    snapshot = {
                        'timestamp': datetime.now().isoformat(),
                        'team1_score': match_data.get('team1_score', 0),
                        'team2_score': match_data.get('team2_score', 0),
                        'status': match_data.get('status', 'unknown'),
                        'maps_count': len(match_data.get('maps', []))
                    }
                    snapshots.append(snapshot)
                    
                    self.log(f"Snapshot: {snapshot['team1_score']}-{snapshot['team2_score']} ({snapshot['status']})")
                    
            except Exception as e:
                self.log(f"Error taking snapshot: {e}", "ERROR")
                
            time.sleep(check_interval)
            
        # Analyze consistency
        if snapshots:
            unique_scores = set((s['team1_score'], s['team2_score']) for s in snapshots)
            unique_statuses = set(s['status'] for s in snapshots)
            
            analysis = {
                'total_snapshots': len(snapshots),
                'unique_score_combinations': len(unique_scores),
                'unique_statuses': len(unique_statuses),
                'score_changes': len(unique_scores) - 1,
                'status_changes': len(unique_statuses) - 1,
                'duration_minutes': duration_minutes,
                'consistency_score': 100 - (len(unique_scores) - 1) * 10  # Penalize unexpected changes
            }
            
            self.log(f"Consistency test: {analysis['consistency_score']}% consistency score")
            return analysis, snapshots
        else:
            return None, []
            
    def test_error_handling_and_recovery(self):
        """Test system behavior with invalid requests and error conditions"""
        self.log("Testing error handling and recovery")
        
        test_cases = [
            {
                'name': 'Invalid Match ID',
                'url': f"{self.base_url}/api/matches/99999",
                'expected_status': [404, 500]
            },
            {
                'name': 'Malformed URL',
                'url': f"{self.base_url}/api/matches/invalid",
                'expected_status': [400, 404, 500]
            },
            {
                'name': 'Non-existent endpoint',
                'url': f"{self.base_url}/api/matches/{self.match_id}/nonexistent",
                'expected_status': [404, 405]
            }
        ]
        
        results = []
        for test_case in test_cases:
            try:
                response = self.session.get(test_case['url'])
                result = {
                    'test_name': test_case['name'],
                    'status_code': response.status_code,
                    'expected_status': test_case['expected_status'],
                    'handled_correctly': response.status_code in test_case['expected_status'],
                    'response_size': len(response.content)
                }
                results.append(result)
                
                status_icon = "✅" if result['handled_correctly'] else "❌"
                self.log(f"{status_icon} {test_case['name']}: {response.status_code}")
                
            except Exception as e:
                results.append({
                    'test_name': test_case['name'],
                    'error': str(e),
                    'handled_correctly': False
                })
                self.log(f"❌ {test_case['name']}: Exception - {e}")
                
        # Test recovery with valid request
        try:
            response = self.session.get(f"{self.base_url}/api/matches/{self.match_id}")
            recovery_success = response.status_code == 200
            self.log(f"{'✅' if recovery_success else '❌'} Recovery test: {response.status_code}")
        except Exception:
            recovery_success = False
            self.log("❌ Recovery test: Failed")
            
        correctly_handled = sum(1 for r in results if r.get('handled_correctly', False))
        analysis = {
            'total_error_tests': len(results),
            'correctly_handled': correctly_handled,
            'error_handling_score': correctly_handled / len(results) * 100,
            'recovery_successful': recovery_success
        }
        
        return analysis, results
        
    def run_comprehensive_performance_validation(self):
        """Run all performance and reliability tests"""
        self.log("="*60)
        self.log("Marvel Rivals Live Scoring - Performance Validation")
        self.log("="*60)
        
        report = {
            'test_start': datetime.now().isoformat(),
            'match_id': self.match_id,
            'base_url': self.base_url
        }
        
        # Test 1: Burst Performance
        self.log("\n1. BURST PERFORMANCE TEST")
        burst_analysis, burst_results = self.performance_test_burst_requests()
        report['burst_performance'] = burst_analysis
        
        # Test 2: Heavy Concurrent Load
        self.log("\n2. HEAVY CONCURRENT LOAD TEST")  
        concurrent_analysis, concurrent_results = self.test_concurrent_heavy_load()
        report['concurrent_performance'] = concurrent_analysis
        
        # Test 3: Data Consistency Over Time
        self.log("\n3. DATA CONSISTENCY TEST")
        consistency_analysis, consistency_snapshots = self.test_data_consistency_over_time(duration_minutes=1)
        report['data_consistency'] = consistency_analysis
        
        # Test 4: Error Handling
        self.log("\n4. ERROR HANDLING TEST")
        error_analysis, error_results = self.test_error_handling_and_recovery()
        report['error_handling'] = error_analysis
        
        # Generate overall performance score
        scores = []
        if burst_analysis['success_rate'] >= 95:
            scores.append(25)
        elif burst_analysis['success_rate'] >= 90:
            scores.append(20)
        else:
            scores.append(10)
            
        if concurrent_analysis['success_rate'] >= 95:
            scores.append(25)
        elif concurrent_analysis['success_rate'] >= 90:
            scores.append(20)
        else:
            scores.append(10)
            
        if consistency_analysis and consistency_analysis['consistency_score'] >= 90:
            scores.append(25)
        else:
            scores.append(15)
            
        if error_analysis['error_handling_score'] >= 80:
            scores.append(25)
        else:
            scores.append(15)
            
        overall_score = sum(scores)
        report['overall_performance_score'] = overall_score
        report['test_end'] = datetime.now().isoformat()
        
        # Final assessment
        self.log("\n" + "="*60)
        self.log("PERFORMANCE VALIDATION SUMMARY")
        self.log("="*60)
        self.log(f"Overall Performance Score: {overall_score}/100")
        
        if overall_score >= 90:
            self.log("🎉 EXCELLENT: System ready for production tournament use")
        elif overall_score >= 75:
            self.log("✅ GOOD: System suitable for live tournaments with monitoring")
        elif overall_score >= 60:
            self.log("⚠️  ACCEPTABLE: System functional but may need optimization")
        else:
            self.log("❌ NEEDS IMPROVEMENT: System requires optimization before live use")
            
        # Save detailed report
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"performance_validation_{timestamp}.json"
        with open(filename, 'w') as f:
            json.dump(report, f, indent=2, default=str)
        self.log(f"Detailed report saved to: {filename}")
        
        return report

def main():
    if len(sys.argv) > 1:
        match_id = int(sys.argv[1])
    else:
        match_id = 6
        
    validator = LiveScoringValidator(match_id=match_id)
    
    try:
        report = validator.run_comprehensive_performance_validation()
        
        # Exit with appropriate code based on performance score
        if report['overall_performance_score'] >= 75:
            sys.exit(0)
        else:
            sys.exit(1)
            
    except KeyboardInterrupt:
        validator.log("Performance validation interrupted by user", "WARNING")
        sys.exit(130)
    except Exception as e:
        validator.log(f"Unexpected error during validation: {e}", "ERROR")
        sys.exit(1)

if __name__ == "__main__":
    main()