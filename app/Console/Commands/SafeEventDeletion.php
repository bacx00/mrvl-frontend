<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use App\Models\Event;
use App\Models\Match;
use App\Models\Team;
use App\Models\Player;
use Exception;

class SafeEventDeletion extends Command
{
    protected $signature = 'events:delete-all {--force : Skip confirmation prompt}';
    
    protected $description = 'Safely delete all events and related data while maintaining referential integrity';

    public function handle()
    {
        $this->info('=== MRVL Event Deletion Tool ===');
        $this->info('This tool will safely delete all events and related data.');
        
        // Check if tables exist
        if (!$this->checkTablesExist()) {
            $this->error('Required database tables do not exist. Please run migrations first.');
            return 1;
        }

        // Show current data counts
        $this->showCurrentDataCounts();

        if (!$this->option('force') && !$this->confirm('Are you sure you want to delete ALL events and related data? This action cannot be undone.')) {
            $this->info('Operation cancelled.');
            return 0;
        }

        try {
            DB::beginTransaction();
            
            $deletionSummary = $this->performSafeDeletion();
            
            DB::commit();
            
            $this->info('✅ Event deletion completed successfully!');
            $this->displayDeletionSummary($deletionSummary);
            
            // Verify deletion
            $this->verifyDeletion();
            
            return 0;
            
        } catch (Exception $e) {
            DB::rollBack();
            $this->error('❌ Error during deletion: ' . $e->getMessage());
            $this->error('Transaction rolled back. No data was deleted.');
            return 1;
        }
    }

    private function checkTablesExist(): bool
    {
        $requiredTables = ['events', 'matches', 'teams', 'players', 'match_player'];
        
        foreach ($requiredTables as $table) {
            if (!Schema::hasTable($table)) {
                $this->error("Table '$table' does not exist.");
                return false;
            }
        }
        
        return true;
    }

    private function showCurrentDataCounts(): void
    {
        $this->info('Current database contents:');
        
        try {
            $eventsCount = DB::table('events')->count();
            $matchesCount = DB::table('matches')->count();
            $teamsCount = DB::table('teams')->count();
            $playersCount = DB::table('players')->count();
            $matchPlayerCount = DB::table('match_player')->count();
            
            $this->table(
                ['Table', 'Count'],
                [
                    ['Events', $eventsCount],
                    ['Matches', $matchesCount],
                    ['Teams', $teamsCount],
                    ['Players', $playersCount],
                    ['Match-Player Relations', $matchPlayerCount],
                ]
            );
            
        } catch (Exception $e) {
            $this->warn('Could not retrieve current counts: ' . $e->getMessage());
        }
    }

    private function performSafeDeletion(): array
    {
        $deletionSummary = [
            'events' => 0,
            'match_player' => 0,
            'matches' => 0,
            'players' => 0,
            'teams' => 0,
            'event_files' => 0
        ];

        $this->info('🔄 Starting safe deletion process...');

        // Step 1: Delete events (they are standalone in current schema)
        $this->info('📋 Deleting events...');
        $deletionSummary['events'] = DB::table('events')->count();
        DB::table('events')->delete();
        $this->info("✅ Deleted {$deletionSummary['events']} events");

        // Step 2: Clean up match-player pivot records
        $this->info('🔗 Cleaning up match-player relations...');
        $deletionSummary['match_player'] = DB::table('match_player')->count();
        DB::table('match_player')->delete();
        $this->info("✅ Deleted {$deletionSummary['match_player']} match-player relations");

        // Step 3: Delete matches
        $this->info('⚔️ Deleting matches...');
        $deletionSummary['matches'] = DB::table('matches')->count();
        DB::table('matches')->delete();
        $this->info("✅ Deleted {$deletionSummary['matches']} matches");

        // Step 4: Delete players (depends on teams, so delete first)
        $this->info('👥 Deleting players...');
        $deletionSummary['players'] = DB::table('players')->count();
        DB::table('players')->delete();
        $this->info("✅ Deleted {$deletionSummary['players']} players");

        // Step 5: Delete teams
        $this->info('🏆 Deleting teams...');
        $deletionSummary['teams'] = DB::table('teams')->count();
        DB::table('teams')->delete();
        $this->info("✅ Deleted {$deletionSummary['teams']} teams");

        // Step 6: Clean up event-related files
        $this->info('🗂️ Cleaning up event-related files...');
        $deletionSummary['event_files'] = $this->cleanupEventFiles();
        $this->info("✅ Cleaned up {$deletionSummary['event_files']} event files");

        return $deletionSummary;
    }

    private function cleanupEventFiles(): int
    {
        $filesDeleted = 0;
        $eventDirectories = [
            storage_path('app/public/events'),
            public_path('events'),
            public_path('images/events')
        ];

        foreach ($eventDirectories as $directory) {
            if (is_dir($directory)) {
                $files = glob($directory . '/*');
                foreach ($files as $file) {
                    if (is_file($file)) {
                        unlink($file);
                        $filesDeleted++;
                    }
                }
            }
        }

        return $filesDeleted;
    }

    private function verifyDeletion(): void
    {
        $this->info('🔍 Verifying deletion...');
        
        $remainingCounts = [
            'events' => DB::table('events')->count(),
            'matches' => DB::table('matches')->count(),
            'teams' => DB::table('teams')->count(),
            'players' => DB::table('players')->count(),
            'match_player' => DB::table('match_player')->count(),
        ];

        $allEmpty = true;
        foreach ($remainingCounts as $table => $count) {
            if ($count > 0) {
                $this->warn("⚠️ Warning: $table still contains $count records");
                $allEmpty = false;
            }
        }

        if ($allEmpty) {
            $this->info('✅ Verification successful: All targeted data has been deleted');
        } else {
            $this->warn('⚠️ Some data may still remain. Please review manually.');
        }
    }

    private function displayDeletionSummary(array $summary): void
    {
        $this->info('📊 Deletion Summary:');
        
        $tableData = [];
        $total = 0;
        
        foreach ($summary as $type => $count) {
            $tableData[] = [ucfirst(str_replace('_', ' ', $type)), $count];
            if ($type !== 'event_files') {
                $total += $count;
            }
        }
        
        $tableData[] = ['TOTAL RECORDS', $total];
        
        $this->table(['Data Type', 'Deleted Count'], $tableData);
    }
}