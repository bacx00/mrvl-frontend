<?php

namespace App\Console\Commands;

use App\Services\LiquipediaScraper;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class ScrapeLiquipediaData extends Command
{
    protected $signature = 'scrape:liquipedia 
                           {--teams-only : Only scrape teams data}
                           {--players-only : Only scrape players data}
                           {--limit=0 : Limit number of teams to scrape (0 for all)}
                           {--report-file=liquipedia_scraping_report.json : Output report file name}';

    protected $description = 'Scrape comprehensive Marvel Rivals data from Liquipedia';

    public function handle(): int
    {
        $this->info('🚀 Starting Marvel Rivals Liquipedia scraping...');
        
        try {
            $scraper = new LiquipediaScraper();
            
            // Show configuration
            $this->table(
                ['Setting', 'Value'],
                [
                    ['Teams Only', $this->option('teams-only') ? 'Yes' : 'No'],
                    ['Players Only', $this->option('players-only') ? 'Yes' : 'No'],
                    ['Limit', $this->option('limit') ?: 'No limit'],
                    ['Report File', $this->option('report-file')]
                ]
            );

            $this->newLine();
            $this->info('⏳ This process may take several minutes due to rate limiting...');
            $this->newLine();

            // Create progress bar
            $progressBar = $this->output->createProgressBar();
            $progressBar->setFormat('debug');
            $progressBar->start();

            // Start scraping
            $report = $scraper->scrapeAllData();
            
            $progressBar->finish();
            $this->newLine(2);

            // Display results
            $this->displayResults($report);
            
            // Save detailed report
            $this->saveReport($report);
            
            // Check if we have minimum required data
            if ($report['teams']['successful'] < 5) {
                $this->warn('⚠️  Warning: Very few teams were successfully scraped. Check the error log.');
                return Command::FAILURE;
            }

            $this->info('✅ Scraping completed successfully!');
            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error('❌ Scraping failed: ' . $e->getMessage());
            $this->error('Stack trace: ' . $e->getTraceAsString());
            return Command::FAILURE;
        }
    }

    private function displayResults(array $report): void
    {
        $this->info('📊 SCRAPING RESULTS');
        $this->info('==================');

        // Teams results
        $this->table(
            ['Metric', 'Count', 'Percentage'],
            [
                [
                    'Teams Found',
                    $report['teams']['found'],
                    '100%'
                ],
                [
                    'Teams Successfully Scraped',
                    $report['teams']['successful'],
                    $report['teams']['found'] > 0 
                        ? round(($report['teams']['successful'] / $report['teams']['found']) * 100, 1) . '%'
                        : '0%'
                ],
                [
                    'Teams Failed',
                    $report['teams']['failed'],
                    $report['teams']['found'] > 0
                        ? round(($report['teams']['failed'] / $report['teams']['found']) * 100, 1) . '%'
                        : '0%'
                ]
            ]
        );

        $this->newLine();

        // Players results
        $this->table(
            ['Metric', 'Count', 'Percentage'],
            [
                [
                    'Players Found',
                    $report['players']['found'],
                    '100%'
                ],
                [
                    'Players Successfully Scraped',
                    $report['players']['successful'],
                    $report['players']['found'] > 0
                        ? round(($report['players']['successful'] / $report['players']['found']) * 100, 1) . '%'
                        : '0%'
                ],
                [
                    'Players Failed',
                    $report['players']['failed'],
                    $report['players']['found'] > 0
                        ? round(($report['players']['failed'] / $report['players']['found']) * 100, 1) . '%'
                        : '0%'
                ]
            ]
        );

        $this->newLine();

        // Summary information
        if (isset($report['summary'])) {
            $this->info('📈 SUMMARY');
            $this->info('==========');
            $this->line('Duration: ' . ($report['summary']['total_duration'] ?? 'N/A'));
            $this->line('Team Success Rate: ' . ($report['summary']['success_rate_teams'] ?? 'N/A'));
            $this->line('Player Success Rate: ' . ($report['summary']['success_rate_players'] ?? 'N/A'));
            $this->line('Total Errors: ' . ($report['summary']['total_errors'] ?? 'N/A'));
        }

        // Show some errors if any
        if (!empty($report['errors'])) {
            $this->newLine();
            $this->warn('⚠️  ERRORS ENCOUNTERED');
            $this->warn('======================');
            
            $errorCount = min(5, count($report['errors'])); // Show max 5 errors
            for ($i = 0; $i < $errorCount; $i++) {
                $error = $report['errors'][$i];
                $this->line('• ' . $error['message']);
            }
            
            if (count($report['errors']) > 5) {
                $this->line('... and ' . (count($report['errors']) - 5) . ' more errors (see full report)');
            }
        }

        $this->newLine();
    }

    private function saveReport(array $report): void
    {
        $filename = $this->option('report-file');
        
        try {
            Storage::disk('local')->put($filename, json_encode($report, JSON_PRETTY_PRINT));
            $fullPath = storage_path('app/' . $filename);
            $this->info("📄 Detailed report saved to: {$fullPath}");
        } catch (\Exception $e) {
            $this->warn("⚠️  Could not save report: " . $e->getMessage());
        }
    }
}