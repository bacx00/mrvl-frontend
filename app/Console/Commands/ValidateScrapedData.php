<?php

namespace App\Console\Commands;

use App\Services\DataValidationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class ValidateScrapedData extends Command
{
    protected $signature = 'validate:scraped-data 
                           {--clean : Also clean and fix common data issues}
                           {--report-file=data_validation_report.json : Output validation report file name}';

    protected $description = 'Validate the scraped Marvel Rivals data for accuracy and completeness';

    public function handle(): int
    {
        $this->info('🔍 Starting data validation...');
        
        try {
            $validator = new DataValidationService();
            
            // Run validation
            $this->info('⏳ Validating teams, players, and data consistency...');
            $report = $validator->validateAllData();
            
            // Display results
            $this->displayValidationResults($report);
            
            // Clean data if requested
            if ($this->option('clean')) {
                $this->newLine();
                $this->info('🧹 Cleaning and fixing data issues...');
                $fixResults = $validator->cleanAndFixData();
                $this->displayFixResults($fixResults);
            }
            
            // Save report
            $this->saveValidationReport($report);
            
            // Determine exit code based on validation results
            $summary = $validator->getValidationSummary();
            
            if ($summary['total_issues'] > 0) {
                $this->warn("⚠️  Validation completed with {$summary['total_issues']} issues found.");
                return Command::FAILURE;
            }

            $this->info('✅ Validation completed successfully - no issues found!');
            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error('❌ Validation failed: ' . $e->getMessage());
            return Command::FAILURE;
        }
    }

    private function displayValidationResults(array $report): void
    {
        $this->newLine();
        $this->info('📊 VALIDATION RESULTS');
        $this->info('====================');

        // Teams validation
        if (isset($report['teams'])) {
            $this->info('🏆 TEAMS');
            $this->info('--------');
            $this->table(
                ['Metric', 'Count'],
                [
                    ['Total Teams', $report['teams']['total_teams']],
                    ['Teams with Issues', $report['teams']['teams_with_issues']],
                ]
            );

            if ($report['teams']['teams_with_issues'] > 0) {
                $this->warn('Team Issues Found:');
                foreach (array_slice($report['teams']['issues'], 0, 5) as $teamId => $issue) {
                    $this->line("• {$issue['team_name']}: " . implode(', ', $issue['issues']));
                }
                if (count($report['teams']['issues']) > 5) {
                    $this->line('... and ' . (count($report['teams']['issues']) - 5) . ' more teams');
                }
            }
        }

        $this->newLine();

        // Players validation
        if (isset($report['players'])) {
            $this->info('👥 PLAYERS');
            $this->info('----------');
            $this->table(
                ['Metric', 'Count'],
                [
                    ['Total Players', $report['players']['total_players']],
                    ['Players with Issues', $report['players']['players_with_issues']],
                ]
            );

            if ($report['players']['players_with_issues'] > 0) {
                $this->warn('Player Issues Found:');
                foreach (array_slice($report['players']['issues'], 0, 5) as $playerId => $issue) {
                    $this->line("• {$issue['player_name']} ({$issue['team_name']}): " . implode(', ', $issue['issues']));
                }
                if (count($report['players']['issues']) > 5) {
                    $this->line('... and ' . (count($report['players']['issues']) - 5) . ' more players');
                }
            }
        }

        $this->newLine();

        // Roster structure validation
        if (isset($report['roster_structure'])) {
            $this->info('📋 ROSTER STRUCTURE');
            $this->info('-------------------');
            $this->table(
                ['Metric', 'Count'],
                [
                    ['Teams Checked', $report['roster_structure']['teams_checked']],
                    ['Teams with Roster Issues', $report['roster_structure']['teams_with_roster_issues']],
                ]
            );

            if ($report['roster_structure']['teams_with_roster_issues'] > 0) {
                $this->warn('Roster Issues Found:');
                foreach (array_slice($report['roster_structure']['issues'], 0, 3) as $teamId => $issue) {
                    $this->line("• {$issue['team_name']}: {$issue['main_players']} main, {$issue['coaches']} coach, {$issue['substitutes']} subs");
                    foreach ($issue['issues'] as $rosterIssue) {
                        $this->line("  - {$rosterIssue}");
                    }
                }
                if (count($report['roster_structure']['issues']) > 3) {
                    $this->line('... and ' . (count($report['roster_structure']['issues']) - 3) . ' more teams');
                }
            }
        }

        $this->newLine();

        // Data consistency
        if (isset($report['data_consistency'])) {
            $this->info('🔗 DATA CONSISTENCY');
            $this->info('-------------------');
            
            if ($report['data_consistency']['issues_found']) {
                $this->warn('Consistency Issues Found:');
                $issues = $report['data_consistency']['issues'];
                
                if (isset($issues['duplicate_teams'])) {
                    $this->line("• Duplicate team names: " . implode(', ', $issues['duplicate_teams']));
                }
                
                if (isset($issues['duplicate_players'])) {
                    $this->line("• Duplicate players: " . count($issues['duplicate_players']) . " found");
                }
                
                if (isset($issues['orphaned_players'])) {
                    $this->line("• Orphaned players: " . count($issues['orphaned_players']) . " found");
                }
                
                if (isset($issues['empty_teams'])) {
                    $this->line("• Teams without players: " . implode(', ', $issues['empty_teams']));
                }
                
                if (isset($issues['invalid_social_links'])) {
                    $this->line("• Invalid social links: " . count($issues['invalid_social_links']) . " found");
                }
            } else {
                $this->info('✅ No data consistency issues found');
            }
        }
    }

    private function displayFixResults(array $fixResults): void
    {
        $this->info('🔧 DATA CLEANING RESULTS');
        $this->info('========================');

        $totalFixed = array_sum($fixResults);
        
        if ($totalFixed > 0) {
            $this->table(
                ['Fix Type', 'Items Fixed'],
                [
                    ['Country Codes', $fixResults['country_codes'] ?? 0],
                    ['Social Links', $fixResults['social_links'] ?? 0],
                    ['Role Assignments', $fixResults['role_assignments'] ?? 0],
                    ['Duplicates Removed', $fixResults['duplicates_removed'] ?? 0],
                ]
            );
            
            $this->info("✅ Total items fixed: {$totalFixed}");
        } else {
            $this->info('✅ No data issues needed fixing');
        }
    }

    private function saveValidationReport(array $report): void
    {
        $filename = $this->option('report-file');
        
        try {
            Storage::disk('local')->put($filename, json_encode($report, JSON_PRETTY_PRINT));
            $fullPath = storage_path('app/' . $filename);
            $this->info("📄 Validation report saved to: {$fullPath}");
        } catch (\Exception $e) {
            $this->warn("⚠️  Could not save validation report: " . $e->getMessage());
        }
    }
}