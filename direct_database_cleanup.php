<?php

/**
 * Direct Database Event Cleanup Script
 * 
 * This script directly connects to the database and performs safe event deletion
 * without requiring Laravel dependencies.
 */

class DirectDatabaseCleanup 
{
    private $pdo;
    private $deletionSummary = [];

    public function __construct() 
    {
        $this->setupDatabase();
    }

    private function setupDatabase()
    {
        // Try to read .env file for database configuration
        $dbConfig = $this->readEnvConfig();
        
        $connection = $dbConfig['DB_CONNECTION'] ?? 'sqlite';
        
        try {
            if ($connection === 'sqlite') {
                $dbPath = $dbConfig['DB_DATABASE'] ?? __DIR__ . '/database/database.sqlite';
                // Create database file if it doesn't exist
                if (!file_exists($dbPath)) {
                    $dbDir = dirname($dbPath);
                    if (!is_dir($dbDir)) {
                        mkdir($dbDir, 0755, true);
                    }
                    touch($dbPath);
                }
                $this->pdo = new PDO("sqlite:$dbPath");
            } elseif ($connection === 'mysql') {
                $host = $dbConfig['DB_HOST'] ?? '127.0.0.1';
                $port = $dbConfig['DB_PORT'] ?? '3306';
                $database = $dbConfig['DB_DATABASE'] ?? 'laravel';
                $username = $dbConfig['DB_USERNAME'] ?? 'root';
                $password = $dbConfig['DB_PASSWORD'] ?? '';
                
                $dsn = "mysql:host=$host;port=$port;dbname=$database;charset=utf8mb4";
                $this->pdo = new PDO($dsn, $username, $password);
            } else {
                throw new Exception("Unsupported database connection: $connection");
            }
            
            $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
        } catch (PDOException $e) {
            throw new Exception("Database connection failed: " . $e->getMessage());
        }
    }

    private function readEnvConfig(): array
    {
        $config = [];
        
        if (file_exists('.env')) {
            $lines = file('.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (strpos($line, '=') !== false && !empty(trim($line)) && $line[0] !== '#') {
                    [$key, $value] = explode('=', $line, 2);
                    $config[trim($key)] = trim($value, '"\'');
                }
            }
        }
        
        return $config;
    }

    public function run($force = false)
    {
        echo "=== MRVL Direct Database Cleanup Tool ===\n";
        echo "This tool will safely delete all events and related data.\n\n";

        if (!$this->checkTablesExist()) {
            echo "❌ Error: Required database tables do not exist or cannot be accessed.\n";
            echo "Please ensure the database is properly configured and migrated.\n";
            return false;
        }

        $this->showCurrentDataCounts();

        if (!$force) {
            echo "\nAre you sure you want to delete ALL events and related data? This action cannot be undone. (y/N): ";
            $confirmation = trim(fgets(STDIN));

            if (strtolower($confirmation) !== 'y' && strtolower($confirmation) !== 'yes') {
                echo "Operation cancelled.\n";
                return false;
            }
        }

        try {
            $this->pdo->beginTransaction();
            
            $this->performSafeDeletion();
            
            $this->pdo->commit();
            
            echo "\n✅ Event cleanup completed successfully!\n";
            $this->displayDeletionSummary();
            
            $this->verifyDeletion();
            
            return true;
            
        } catch (Exception $e) {
            $this->pdo->rollBack();
            echo "\n❌ Error during deletion: " . $e->getMessage() . "\n";
            echo "Transaction rolled back. No data was deleted.\n";
            return false;
        }
    }

    private function checkTablesExist(): bool
    {
        $requiredTables = ['events'];
        $optionalTables = ['matches', 'teams', 'players', 'match_player'];
        
        try {
            foreach ($requiredTables as $table) {
                $stmt = $this->pdo->prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=? UNION SELECT table_name as name FROM information_schema.tables WHERE table_name=?");
                $stmt->execute([$table, $table]);
                if (!$stmt->fetch()) {
                    echo "❌ Required table '$table' does not exist.\n";
                    return false;
                }
            }
            return true;
        } catch (Exception $e) {
            // Try alternative approach for different database types
            try {
                $stmt = $this->pdo->query("SELECT COUNT(*) FROM events LIMIT 1");
                return true;
            } catch (Exception $e2) {
                echo "❌ Cannot access events table: " . $e2->getMessage() . "\n";
                return false;
            }
        }
    }

    private function showCurrentDataCounts(): void
    {
        echo "Current database contents:\n";
        echo "+-----------------------+-------+\n";
        echo "| Table                 | Count |\n";
        echo "+-----------------------+-------+\n";
        
        $tables = [
            'Events' => 'events',
            'Matches' => 'matches',
            'Teams' => 'teams',
            'Players' => 'players',
            'Match-Player Relations' => 'match_player'
        ];
        
        foreach ($tables as $displayName => $tableName) {
            try {
                $stmt = $this->pdo->query("SELECT COUNT(*) FROM $tableName");
                $count = $stmt->fetchColumn();
                echo sprintf("| %-21s | %5d |\n", $displayName, $count);
            } catch (Exception $e) {
                echo sprintf("| %-21s | %5s |\n", $displayName, 'N/A');
            }
        }
        
        echo "+-----------------------+-------+\n";
    }

    private function performSafeDeletion(): void
    {
        echo "\n🔄 Starting safe deletion process...\n";

        // Get counts before deletion for summary
        $tablesToClean = ['events', 'matches', 'teams', 'players', 'match_player'];
        
        foreach ($tablesToClean as $table) {
            try {
                $stmt = $this->pdo->query("SELECT COUNT(*) FROM $table");
                $this->deletionSummary[$table] = $stmt->fetchColumn();
            } catch (Exception $e) {
                $this->deletionSummary[$table] = 0;
            }
        }

        // Delete in order to maintain referential integrity
        $deleteOrder = [
            'match_player' => '🔗 Cleaning up match-player relations...',
            'matches' => '⚔️ Deleting matches...',
            'players' => '👥 Deleting players...',
            'teams' => '🏆 Deleting teams...',
            'events' => '📋 Deleting events...'
        ];

        foreach ($deleteOrder as $table => $message) {
            echo "$message\n";
            try {
                $count = $this->deletionSummary[$table] ?? 0;
                $this->pdo->exec("DELETE FROM $table");
                echo "✅ Deleted $count records from $table\n";
            } catch (Exception $e) {
                echo "⚠️ Could not delete from $table: " . $e->getMessage() . "\n";
                $this->deletionSummary[$table] = 0;
            }
        }

        // Clean up event-related files
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
            __DIR__ . '/public/images/events',
            __DIR__ . '/events' // Based on the directory structure we saw
        ];

        foreach ($eventDirectories as $directory) {
            if (is_dir($directory)) {
                $files = glob($directory . '/*');
                foreach ($files as $file) {
                    if (is_file($file) && !is_dir($file)) {
                        try {
                            unlink($file);
                            $filesDeleted++;
                        } catch (Exception $e) {
                            echo "⚠️ Could not delete file $file: " . $e->getMessage() . "\n";
                        }
                    }
                }
            }
        }

        return $filesDeleted;
    }

    private function verifyDeletion(): void
    {
        echo "\n🔍 Verifying deletion...\n";
        
        $tables = ['events', 'matches', 'teams', 'players', 'match_player'];
        $allEmpty = true;

        foreach ($tables as $table) {
            try {
                $stmt = $this->pdo->query("SELECT COUNT(*) FROM $table");
                $count = $stmt->fetchColumn();
                if ($count > 0) {
                    echo "⚠️ Warning: $table still contains $count records\n";
                    $allEmpty = false;
                }
            } catch (Exception $e) {
                echo "⚠️ Could not verify $table: " . $e->getMessage() . "\n";
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

// Parse command line arguments
$force = in_array('--force', $argv ?? []) || in_array('-f', $argv ?? []);

try {
    // Run the cleanup
    $cleanup = new DirectDatabaseCleanup();
    $success = $cleanup->run($force);
    
    exit($success ? 0 : 1);
    
} catch (Exception $e) {
    echo "❌ Fatal error: " . $e->getMessage() . "\n";
    exit(1);
}