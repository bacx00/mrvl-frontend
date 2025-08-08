<?php

/**
 * MRVL Safe Event Cleanup Script
 * 
 * This script safely deletes all events and related data while maintaining referential integrity.
 * Run this script from the Laravel root directory.
 */

require_once 'vendor/autoload.php';

use Illuminate\Database\Capsule\Manager as Capsule;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

class SafeEventCleanup 
{
    private $capsule;
    private $deletionSummary = [];

    public function __construct() 
    {
        $this->setupDatabase();
    }

    private function setupDatabase()
    {
        $this->capsule = new Capsule;

        // Try to load Laravel's database config
        if (file_exists('.env')) {
            $env = file_get_contents('.env');
            $lines = explode("\n", $env);
            
            $config = [];
            foreach ($lines as $line) {
                if (strpos($line, '=') !== false && !empty(trim($line)) && $line[0] !== '#') {
                    [$key, $value] = explode('=', $line, 2);
                    $config[trim($key)] = trim($value);
                }
            }
            
            // Configure database connection based on .env
            if (isset($config['DB_CONNECTION'])) {
                $connection = $config['DB_CONNECTION'] ?? 'sqlite';
                
                if ($connection === 'sqlite') {
                    $this->capsule->addConnection([
                        'driver' => 'sqlite',
                        'database' => $config['DB_DATABASE'] ?? __DIR__ . '/database/database.sqlite',
                        'prefix' => '',
                    ]);
                } elseif ($connection === 'mysql') {
                    $this->capsule->addConnection([
                        'driver' => 'mysql',
                        'host' => $config['DB_HOST'] ?? '127.0.0.1',
                        'port' => $config['DB_PORT'] ?? '3306',
                        'database' => $config['DB_DATABASE'] ?? 'laravel',
                        'username' => $config['DB_USERNAME'] ?? 'root',
                        'password' => $config['DB_PASSWORD'] ?? '',
                        'charset' => 'utf8mb4',
                        'collation' => 'utf8mb4_unicode_ci',
                        'prefix' => '',
                    ]);
                }
            }
        } else {
            // Default SQLite configuration
            $this->capsule->addConnection([
                'driver' => 'sqlite',
                'database' => __DIR__ . '/database/database.sqlite',
                'prefix' => '',
            ]);
        }

        $this->capsule->setAsGlobal();
        $this->capsule->bootEloquent();
    }

    public function run($force = false)
    {
        echo "=== MRVL Safe Event Cleanup Tool ===\n";
        echo "This tool will safely delete all events and related data.\n\n";

        if (!$this->checkDatabaseConnection()) {
            echo "❌ Error: Could not connect to database.\n";
            return false;
        }

        if (!$this->checkTablesExist()) {
            echo "❌ Error: Required database tables do not exist.\n";
            return false;
        }

        $this->showCurrentDataCounts();

        if (!$force) {
            echo "\nAre you sure you want to delete ALL events and related data? This action cannot be undone. (y/N): ";
            $handle = fopen("php://stdin", "r");
            $confirmation = trim(fgets($handle));
            fclose($handle);

            if (strtolower($confirmation) !== 'y' && strtolower($confirmation) !== 'yes') {
                echo "Operation cancelled.\n";
                return false;
            }
        }

        try {
            $this->capsule->connection()->beginTransaction();
            
            $this->performSafeDeletion();
            
            $this->capsule->connection()->commit();
            
            echo "\n✅ Event cleanup completed successfully!\n";
            $this->displayDeletionSummary();
            
            $this->verifyDeletion();
            
            return true;
            
        } catch (Exception $e) {
            $this->capsule->connection()->rollBack();
            echo "\n❌ Error during deletion: " . $e->getMessage() . "\n";
            echo "Transaction rolled back. No data was deleted.\n";
            return false;
        }
    }

    private function checkDatabaseConnection(): bool
    {
        try {
            $this->capsule->connection()->getPdo();
            return true;
        } catch (Exception $e) {
            echo "Database connection error: " . $e->getMessage() . "\n";
            return false;
        }
    }

    private function checkTablesExist(): bool
    {
        $requiredTables = ['events', 'matches', 'teams', 'players', 'match_player'];
        $schema = $this->capsule->connection()->getSchemaBuilder();
        
        foreach ($requiredTables as $table) {
            if (!$schema->hasTable($table)) {
                echo "❌ Table '$table' does not exist.\n";
                return false;
            }
        }
        
        return true;
    }

    private function showCurrentDataCounts(): void
    {
        echo "Current database contents:\n";
        echo "+-----------------------+-------+\n";
        echo "| Table                 | Count |\n";
        echo "+-----------------------+-------+\n";
        
        try {
            $counts = [
                'Events' => $this->capsule->table('events')->count(),
                'Matches' => $this->capsule->table('matches')->count(),
                'Teams' => $this->capsule->table('teams')->count(),
                'Players' => $this->capsule->table('players')->count(),
                'Match-Player Relations' => $this->capsule->table('match_player')->count(),
            ];
            
            foreach ($counts as $table => $count) {
                echo sprintf("| %-21s | %5d |\n", $table, $count);
            }
            
        } catch (Exception $e) {
            echo "Could not retrieve current counts: " . $e->getMessage() . "\n";
        }
        
        echo "+-----------------------+-------+\n";
    }

    private function performSafeDeletion(): void
    {
        echo "\n🔄 Starting safe deletion process...\n";

        // Step 1: Delete events (they are standalone in current schema)
        echo "📋 Deleting events...\n";
        $this->deletionSummary['events'] = $this->capsule->table('events')->count();
        $this->capsule->table('events')->delete();
        echo "✅ Deleted {$this->deletionSummary['events']} events\n";

        // Step 2: Clean up match-player pivot records
        echo "🔗 Cleaning up match-player relations...\n";
        $this->deletionSummary['match_player'] = $this->capsule->table('match_player')->count();
        $this->capsule->table('match_player')->delete();
        echo "✅ Deleted {$this->deletionSummary['match_player']} match-player relations\n";

        // Step 3: Delete matches
        echo "⚔️ Deleting matches...\n";
        $this->deletionSummary['matches'] = $this->capsule->table('matches')->count();
        $this->capsule->table('matches')->delete();
        echo "✅ Deleted {$this->deletionSummary['matches']} matches\n";

        // Step 4: Delete players (depends on teams, so delete first)
        echo "👥 Deleting players...\n";
        $this->deletionSummary['players'] = $this->capsule->table('players')->count();
        $this->capsule->table('players')->delete();
        echo "✅ Deleted {$this->deletionSummary['players']} players\n";

        // Step 5: Delete teams
        echo "🏆 Deleting teams...\n";
        $this->deletionSummary['teams'] = $this->capsule->table('teams')->count();
        $this->capsule->table('teams')->delete();
        echo "✅ Deleted {$this->deletionSummary['teams']} teams\n";

        // Step 6: Clean up event-related files
        echo "🗂️ Cleaning up event-related files...\n";
        $this->deletionSummary['event_files'] = $this->cleanupEventFiles();
        echo "✅ Cleaned up {$this->deletionSummary['event_files']} event files\n";
    }

    private function cleanupEventFiles(): int
    {
        $filesDeleted = 0;
        $eventDirectories = [
            __DIR__ . '/storage/app/public/events',
            __DIR__ . '/public/events',
            __DIR__ . '/public/images/events'
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
        echo "\n🔍 Verifying deletion...\n";
        
        $remainingCounts = [
            'events' => $this->capsule->table('events')->count(),
            'matches' => $this->capsule->table('matches')->count(),
            'teams' => $this->capsule->table('teams')->count(),
            'players' => $this->capsule->table('players')->count(),
            'match_player' => $this->capsule->table('match_player')->count(),
        ];

        $allEmpty = true;
        foreach ($remainingCounts as $table => $count) {
            if ($count > 0) {
                echo "⚠️ Warning: $table still contains $count records\n";
                $allEmpty = false;
            }
        }

        if ($allEmpty) {
            echo "✅ Verification successful: All targeted data has been deleted\n";
        } else {
            echo "⚠️ Some data may still remain. Please review manually.\n";
        }
    }

    private function displayDeletionSummary(): void
    {
        echo "\n📊 Deletion Summary:\n";
        echo "+------------------------+-------+\n";
        echo "| Data Type              | Count |\n";
        echo "+------------------------+-------+\n";
        
        $total = 0;
        foreach ($this->deletionSummary as $type => $count) {
            $displayType = ucfirst(str_replace('_', ' ', $type));
            echo sprintf("| %-22s | %5d |\n", $displayType, $count);
            if ($type !== 'event_files') {
                $total += $count;
            }
        }
        
        echo "+------------------------+-------+\n";
        echo sprintf("| %-22s | %5d |\n", 'TOTAL RECORDS', $total);
        echo "+------------------------+-------+\n";
    }
}

// Check command line arguments
$force = in_array('--force', $argv) || in_array('-f', $argv);

// Run the cleanup
$cleanup = new SafeEventCleanup();
$success = $cleanup->run($force);

exit($success ? 0 : 1);