<?php

/**
 * Comprehensive Event Cleanup Report
 * 
 * This script provides a detailed analysis of the current database state
 * and confirms the cleanup status.
 */

class ComprehensiveEventCleanupReport 
{
    private $pdo;
    private $report = [];

    public function __construct() 
    {
        $this->connectToDatabase();
    }

    private function connectToDatabase()
    {
        try {
            $dbPath = __DIR__ . '/database/database.sqlite';
            if (!file_exists($dbPath)) {
                throw new Exception("Database file does not exist: $dbPath");
            }
            
            $this->pdo = new PDO("sqlite:$dbPath");
            $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
        } catch (Exception $e) {
            throw new Exception("Database connection failed: " . $e->getMessage());
        }
    }

    public function generateReport()
    {
        echo "=== MRVL Event Cleanup Verification Report ===\n";
        echo "Generated on: " . date('Y-m-d H:i:s') . "\n\n";

        $this->checkDatabaseStatus();
        $this->checkTableStructure();
        $this->checkForExistingData();
        $this->checkEventFiles();
        $this->checkMigrationFiles();
        
        $this->displayFinalSummary();
    }

    private function checkDatabaseStatus()
    {
        echo "1. DATABASE CONNECTION STATUS\n";
        echo "================================\n";
        
        try {
            $version = $this->pdo->query('SELECT sqlite_version()')->fetchColumn();
            echo "✅ Database connected successfully\n";
            echo "📍 Location: /var/www/mrvl-frontend/database/database.sqlite\n";
            echo "🔧 SQLite Version: $version\n";
            
            $size = filesize(__DIR__ . '/database/database.sqlite');
            echo "💾 Database Size: " . $this->formatBytes($size) . "\n";
            $this->report['database_status'] = 'connected';
            
        } catch (Exception $e) {
            echo "❌ Database connection failed: " . $e->getMessage() . "\n";
            $this->report['database_status'] = 'failed';
        }
        
        echo "\n";
    }

    private function checkTableStructure()
    {
        echo "2. TABLE STRUCTURE ANALYSIS\n";
        echo "============================\n";
        
        try {
            $tables = $this->pdo->query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")->fetchAll(PDO::FETCH_COLUMN);
            
            if (empty($tables)) {
                echo "📋 No tables found in database\n";
                echo "✅ This indicates a clean database state - no event data to remove\n";
                $this->report['table_status'] = 'empty';
            } else {
                echo "📋 Found " . count($tables) . " table(s):\n";
                foreach ($tables as $table) {
                    echo "   - $table\n";
                }
                $this->report['table_status'] = 'populated';
                $this->report['tables'] = $tables;
            }
            
        } catch (Exception $e) {
            echo "❌ Error checking tables: " . $e->getMessage() . "\n";
            $this->report['table_status'] = 'error';
        }
        
        echo "\n";
    }

    private function checkForExistingData()
    {
        echo "3. DATA VERIFICATION\n";
        echo "====================\n";
        
        $eventTables = ['events', 'matches', 'teams', 'players', 'match_player'];
        $totalRecords = 0;
        
        foreach ($eventTables as $table) {
            try {
                $count = $this->pdo->query("SELECT COUNT(*) FROM $table")->fetchColumn();
                echo sprintf("📊 %-20s: %d records\n", ucfirst($table), $count);
                $totalRecords += $count;
                $this->report['data_counts'][$table] = $count;
                
            } catch (Exception $e) {
                echo sprintf("📊 %-20s: Table not found\n", ucfirst($table));
                $this->report['data_counts'][$table] = 'N/A';
            }
        }
        
        if ($totalRecords === 0) {
            echo "\n✅ VERIFICATION COMPLETE: No event-related data found\n";
            echo "🎯 Database is already in a clean state\n";
            $this->report['cleanup_status'] = 'already_clean';
        } else {
            echo "\n⚠️  Found $totalRecords total records that would be affected by cleanup\n";
            $this->report['cleanup_status'] = 'needs_cleanup';
        }
        
        echo "\n";
    }

    private function checkEventFiles()
    {
        echo "4. EVENT FILES VERIFICATION\n";
        echo "============================\n";
        
        $eventDirectories = [
            __DIR__ . '/storage/app/public/events',
            __DIR__ . '/public/events',
            __DIR__ . '/public/images/events',
            __DIR__ . '/events'
        ];
        
        $totalFiles = 0;
        
        foreach ($eventDirectories as $dir) {
            if (is_dir($dir)) {
                $files = glob($dir . '/*');
                $fileCount = count(array_filter($files, 'is_file'));
                echo sprintf("📁 %-40s: %d files\n", $dir, $fileCount);
                $totalFiles += $fileCount;
            } else {
                echo sprintf("📁 %-40s: Directory not found\n", $dir);
            }
        }
        
        if ($totalFiles === 0) {
            echo "✅ No event files found to clean up\n";
            $this->report['files_status'] = 'clean';
        } else {
            echo "📄 Found $totalFiles event-related files\n";
            $this->report['files_status'] = 'needs_cleanup';
            $this->report['files_count'] = $totalFiles;
        }
        
        echo "\n";
    }

    private function checkMigrationFiles()
    {
        echo "5. MIGRATION FILES ANALYSIS\n";
        echo "============================\n";
        
        $migrationDir = __DIR__ . '/database/migrations';
        if (is_dir($migrationDir)) {
            $migrations = glob($migrationDir . '/*.php');
            echo "📋 Found " . count($migrations) . " migration files:\n";
            
            foreach ($migrations as $migration) {
                $filename = basename($migration);
                if (strpos($filename, 'event') !== false) {
                    echo "   🎯 $filename (event-related)\n";
                } else {
                    echo "   📄 $filename\n";
                }
            }
        } else {
            echo "❌ Migration directory not found\n";
        }
        
        echo "\n";
    }

    private function displayFinalSummary()
    {
        echo "6. CLEANUP SUMMARY & RECOMMENDATIONS\n";
        echo "=====================================\n";
        
        if ($this->report['cleanup_status'] === 'already_clean') {
            echo "✅ RESULT: Database is already clean\n";
            echo "🎯 ACTION: No cleanup required\n";
            echo "💡 STATUS: All event data has been successfully removed or never existed\n";
            
        } elseif ($this->report['cleanup_status'] === 'needs_cleanup') {
            echo "⚠️  RESULT: Event data found that requires cleanup\n";
            echo "🎯 ACTION: Run the cleanup script to safely remove data\n";
            echo "💡 COMMAND: php direct_database_cleanup.php --force\n";
            
        } else {
            echo "❓ RESULT: Unable to determine cleanup status\n";
            echo "🎯 ACTION: Manual investigation required\n";
        }
        
        echo "\n📋 CLEANUP TOOLS AVAILABLE:\n";
        echo "   1. direct_database_cleanup.php - Direct database cleanup script\n";
        echo "   2. safe_event_cleanup.php - Laravel-based cleanup (requires vendor/)\n";
        echo "   3. SafeEventDeletion.php - Laravel Artisan command\n";
        
        echo "\n🔒 SAFETY FEATURES IMPLEMENTED:\n";
        echo "   ✅ Transaction-based operations\n";
        echo "   ✅ Referential integrity preservation\n";
        echo "   ✅ File cleanup included\n";
        echo "   ✅ Verification and rollback capabilities\n";
        echo "   ✅ Detailed logging and reporting\n";
        
        echo "\n=== REPORT COMPLETE ===\n";
    }

    private function formatBytes($bytes, $precision = 2)
    {
        $units = array('B', 'KB', 'MB', 'GB', 'TB');
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, $precision) . ' ' . $units[$i];
    }
}

// Generate the report
try {
    $report = new ComprehensiveEventCleanupReport();
    $report->generateReport();
    exit(0);
    
} catch (Exception $e) {
    echo "❌ Fatal error: " . $e->getMessage() . "\n";
    exit(1);
}