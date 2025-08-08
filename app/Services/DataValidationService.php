<?php

namespace App\Services;

use App\Models\Team;
use App\Models\Player;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class DataValidationService
{
    private array $validationReport = [];
    private array $validRoles = [
        'Duelist', 'Vanguard', 'Strategist', 'Coach', 'Substitute', 'Flex'
    ];
    private array $validStatuses = [
        'active', 'inactive', 'retired', 'substitute'
    ];

    /**
     * Validate all scraped data
     */
    public function validateAllData(): array
    {
        $this->initializeReport();
        
        $this->validateTeams();
        $this->validatePlayers();
        $this->validateRosterStructure();
        $this->validateDataConsistency();
        
        $this->finalizeReport();
        
        return $this->validationReport;
    }

    /**
     * Validate team data
     */
    private function validateTeams(): void
    {
        $teams = Team::all();
        $teamIssues = [];

        foreach ($teams as $team) {
            $issues = $this->validateSingleTeam($team);
            if (!empty($issues)) {
                $teamIssues[$team->id] = [
                    'team_name' => $team->name,
                    'issues' => $issues
                ];
            }
        }

        $this->validationReport['teams'] = [
            'total_teams' => $teams->count(),
            'teams_with_issues' => count($teamIssues),
            'issues' => $teamIssues
        ];
    }

    /**
     * Validate single team
     */
    private function validateSingleTeam(Team $team): array
    {
        $issues = [];

        // Required fields validation
        $requiredFields = ['name', 'liquipedia_url'];
        foreach ($requiredFields as $field) {
            if (empty($team->$field)) {
                $issues[] = "Missing required field: {$field}";
            }
        }

        // URL validation
        if (!empty($team->liquipedia_url) && !filter_var($team->liquipedia_url, FILTER_VALIDATE_URL)) {
            $issues[] = "Invalid Liquipedia URL format";
        }

        if (!empty($team->logo_url) && !filter_var($team->logo_url, FILTER_VALIDATE_URL)) {
            $issues[] = "Invalid logo URL format";
        }

        // Social links validation
        if (!empty($team->social_links)) {
            foreach ($team->social_links as $platform => $url) {
                if (!filter_var($url, FILTER_VALIDATE_URL)) {
                    $issues[] = "Invalid {$platform} social URL";
                }
            }
        }

        // Country code validation
        if (!empty($team->country_code) && !preg_match('/^[A-Z]{2,3}$/', $team->country_code)) {
            $issues[] = "Invalid country code format";
        }

        // Earnings validation
        if ($team->total_earnings < 0) {
            $issues[] = "Negative total earnings";
        }

        // Win rate validation
        if ($team->win_rate < 0 || $team->win_rate > 100) {
            $issues[] = "Invalid win rate (should be 0-100)";
        }

        // Status validation
        if (!in_array($team->status, ['active', 'inactive', 'disbanded'])) {
            $issues[] = "Invalid team status";
        }

        // Coach data consistency
        if (!empty($team->coach_name)) {
            if (empty($team->coach_real_name) && empty($team->coach_image_url)) {
                $issues[] = "Coach data incomplete (missing real name or image)";
            }
        }

        return $issues;
    }

    /**
     * Validate player data
     */
    private function validatePlayers(): void
    {
        $players = Player::all();
        $playerIssues = [];

        foreach ($players as $player) {
            $issues = $this->validateSinglePlayer($player);
            if (!empty($issues)) {
                $playerIssues[$player->id] = [
                    'player_name' => $player->name,
                    'team_name' => $player->team->name ?? 'No Team',
                    'issues' => $issues
                ];
            }
        }

        $this->validationReport['players'] = [
            'total_players' => $players->count(),
            'players_with_issues' => count($playerIssues),
            'issues' => $playerIssues
        ];
    }

    /**
     * Validate single player
     */
    private function validateSinglePlayer(Player $player): array
    {
        $issues = [];

        // Required fields validation
        $requiredFields = ['name', 'team_id'];
        foreach ($requiredFields as $field) {
            if (empty($player->$field)) {
                $issues[] = "Missing required field: {$field}";
            }
        }

        // Team existence validation
        if (!empty($player->team_id) && !Team::find($player->team_id)) {
            $issues[] = "Referenced team does not exist";
        }

        // Role validation
        if (!empty($player->role) && !in_array($player->role, $this->validRoles)) {
            $issues[] = "Invalid role: {$player->role}";
        }

        // Status validation
        if (!in_array($player->status, $this->validStatuses)) {
            $issues[] = "Invalid player status: {$player->status}";
        }

        // URL validation
        if (!empty($player->liquipedia_url) && !filter_var($player->liquipedia_url, FILTER_VALIDATE_URL)) {
            $issues[] = "Invalid Liquipedia URL format";
        }

        if (!empty($player->profile_image_url) && !filter_var($player->profile_image_url, FILTER_VALIDATE_URL)) {
            $issues[] = "Invalid profile image URL format";
        }

        // Social links validation
        if (!empty($player->social_links)) {
            foreach ($player->social_links as $platform => $url) {
                if (!filter_var($url, FILTER_VALIDATE_URL)) {
                    $issues[] = "Invalid {$platform} social URL";
                }
            }
        }

        // Country code validation
        if (!empty($player->country_code) && !preg_match('/^[A-Z]{2,3}$/', $player->country_code)) {
            $issues[] = "Invalid country code format";
        }

        // ELO validation
        if (!empty($player->elo_rating) && ($player->elo_rating < 0 || $player->elo_rating > 5000)) {
            $issues[] = "Invalid ELO rating (should be 0-5000)";
        }

        // Age validation
        if (!empty($player->age) && ($player->age < 16 || $player->age > 40)) {
            $issues[] = "Unusual age value: {$player->age}";
        }

        // Earnings validation
        if ($player->total_earnings < 0) {
            $issues[] = "Negative total earnings";
        }

        // Statistics validation
        if ($player->win_rate < 0 || $player->win_rate > 100) {
            $issues[] = "Invalid win rate (should be 0-100)";
        }

        if ($player->kd_ratio < 0) {
            $issues[] = "Invalid K/D ratio (cannot be negative)";
        }

        return $issues;
    }

    /**
     * Validate roster structure (6 players + coach per team)
     */
    private function validateRosterStructure(): void
    {
        $teams = Team::with('players')->get();
        $rosterIssues = [];

        foreach ($teams as $team) {
            $issues = [];
            $players = $team->players;
            
            $mainPlayers = $players->where('status', 'active')->whereNotIn('role', ['coach', 'substitute']);
            $coaches = $players->where('role', 'coach');
            $substitutes = $players->where('status', 'substitute');

            // Check main players count
            if ($mainPlayers->count() !== 6) {
                $issues[] = "Team should have exactly 6 main players, found {$mainPlayers->count()}";
            }

            // Check coach count
            if ($coaches->count() > 1) {
                $issues[] = "Team has multiple coaches ({$coaches->count()})";
            }

            // Check role distribution
            $roleCounts = $mainPlayers->groupBy('role')->map->count();
            foreach ($roleCounts as $role => $count) {
                if ($count > 3) { // Max 3 players per role is reasonable
                    $issues[] = "Too many players with role '{$role}': {$count}";
                }
            }

            // Check for players without roles
            $playersWithoutRoles = $mainPlayers->whereNull('role')->count();
            if ($playersWithoutRoles > 0) {
                $issues[] = "{$playersWithoutRoles} main players are missing role assignment";
            }

            if (!empty($issues)) {
                $rosterIssues[$team->id] = [
                    'team_name' => $team->name,
                    'main_players' => $mainPlayers->count(),
                    'coaches' => $coaches->count(),
                    'substitutes' => $substitutes->count(),
                    'issues' => $issues
                ];
            }
        }

        $this->validationReport['roster_structure'] = [
            'teams_checked' => $teams->count(),
            'teams_with_roster_issues' => count($rosterIssues),
            'issues' => $rosterIssues
        ];
    }

    /**
     * Validate data consistency
     */
    private function validateDataConsistency(): void
    {
        $consistencyIssues = [];

        // Check for duplicate team names
        $duplicateTeams = Team::select('name', \DB::raw('count(*) as total'))
                             ->groupBy('name')
                             ->having('total', '>', 1)
                             ->get();

        if ($duplicateTeams->count() > 0) {
            $consistencyIssues['duplicate_teams'] = $duplicateTeams->pluck('name')->toArray();
        }

        // Check for duplicate player names within teams
        $duplicatePlayersQuery = Player::select('name', 'team_id', \DB::raw('count(*) as total'))
                                      ->groupBy('name', 'team_id')
                                      ->having('total', '>', 1)
                                      ->with('team')
                                      ->get();

        if ($duplicatePlayersQuery->count() > 0) {
            $consistencyIssues['duplicate_players'] = $duplicatePlayersQuery->map(function ($player) {
                return [
                    'name' => $player->name,
                    'team' => $player->team->name ?? 'Unknown',
                    'count' => $player->total
                ];
            })->toArray();
        }

        // Check for orphaned players (team doesn't exist)
        $orphanedPlayers = Player::whereNotIn('team_id', Team::pluck('id'))->get();
        if ($orphanedPlayers->count() > 0) {
            $consistencyIssues['orphaned_players'] = $orphanedPlayers->pluck('name')->toArray();
        }

        // Check for teams without players
        $emptyTeams = Team::doesntHave('players')->get();
        if ($emptyTeams->count() > 0) {
            $consistencyIssues['empty_teams'] = $emptyTeams->pluck('name')->toArray();
        }

        // Check social links consistency
        $invalidSocialLinks = $this->validateAllSocialLinks();
        if (!empty($invalidSocialLinks)) {
            $consistencyIssues['invalid_social_links'] = $invalidSocialLinks;
        }

        $this->validationReport['data_consistency'] = [
            'issues_found' => !empty($consistencyIssues),
            'issues' => $consistencyIssues
        ];
    }

    /**
     * Validate all social links
     */
    private function validateAllSocialLinks(): array
    {
        $invalidLinks = [];

        // Check team social links
        $teams = Team::whereNotNull('social_links')->get();
        foreach ($teams as $team) {
            foreach ($team->social_links as $platform => $url) {
                if (!$this->isValidSocialUrl($platform, $url)) {
                    $invalidLinks[] = [
                        'type' => 'team',
                        'name' => $team->name,
                        'platform' => $platform,
                        'url' => $url
                    ];
                }
            }
        }

        // Check player social links
        $players = Player::whereNotNull('social_links')->get();
        foreach ($players as $player) {
            foreach ($player->social_links as $platform => $url) {
                if (!$this->isValidSocialUrl($platform, $url)) {
                    $invalidLinks[] = [
                        'type' => 'player',
                        'name' => $player->name,
                        'platform' => $platform,
                        'url' => $url
                    ];
                }
            }
        }

        return $invalidLinks;
    }

    /**
     * Validate social URL format
     */
    private function isValidSocialUrl(string $platform, string $url): bool
    {
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            return false;
        }

        $platformDomains = [
            'twitter' => ['twitter.com', 'x.com'],
            'instagram' => ['instagram.com'],
            'youtube' => ['youtube.com', 'youtu.be'],
            'twitch' => ['twitch.tv'],
            'discord' => ['discord.gg', 'discord.com'],
            'tiktok' => ['tiktok.com'],
            'facebook' => ['facebook.com']
        ];

        if (!isset($platformDomains[$platform])) {
            return true; // Unknown platform, assume valid
        }

        foreach ($platformDomains[$platform] as $domain) {
            if (strpos($url, $domain) !== false) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get validation summary
     */
    public function getValidationSummary(): array
    {
        if (empty($this->validationReport)) {
            return ['status' => 'not_run'];
        }

        $totalIssues = 0;
        $totalIssues += $this->validationReport['teams']['teams_with_issues'] ?? 0;
        $totalIssues += $this->validationReport['players']['players_with_issues'] ?? 0;
        $totalIssues += $this->validationReport['roster_structure']['teams_with_roster_issues'] ?? 0;
        
        return [
            'status' => 'completed',
            'total_issues' => $totalIssues,
            'teams_with_issues' => $this->validationReport['teams']['teams_with_issues'] ?? 0,
            'players_with_issues' => $this->validationReport['players']['players_with_issues'] ?? 0,
            'roster_issues' => $this->validationReport['roster_structure']['teams_with_roster_issues'] ?? 0,
            'data_consistency_issues' => !empty($this->validationReport['data_consistency']['issues']),
        ];
    }

    private function initializeReport(): void
    {
        $this->validationReport = [
            'validation_started_at' => now()->toISOString(),
            'teams' => [],
            'players' => [],
            'roster_structure' => [],
            'data_consistency' => []
        ];
    }

    private function finalizeReport(): void
    {
        $this->validationReport['validation_completed_at'] = now()->toISOString();
        $this->validationReport['summary'] = $this->getValidationSummary();
    }

    /**
     * Clean and fix common data issues
     */
    public function cleanAndFixData(): array
    {
        $fixes = [];

        // Fix country codes
        $fixes['country_codes'] = $this->fixCountryCodes();
        
        // Fix social links
        $fixes['social_links'] = $this->fixSocialLinks();
        
        // Fix role assignments
        $fixes['role_assignments'] = $this->fixRoleAssignments();
        
        // Remove duplicate entries
        $fixes['duplicates_removed'] = $this->removeDuplicates();

        return $fixes;
    }

    private function fixCountryCodes(): int
    {
        $fixed = 0;
        
        // Fix team country codes
        $teams = Team::whereNotNull('country_code')->get();
        foreach ($teams as $team) {
            if (!preg_match('/^[A-Z]{2,3}$/', $team->country_code)) {
                $team->country_code = strtoupper(substr($team->country_code, 0, 3));
                $team->save();
                $fixed++;
            }
        }

        // Fix player country codes
        $players = Player::whereNotNull('country_code')->get();
        foreach ($players as $player) {
            if (!preg_match('/^[A-Z]{2,3}$/', $player->country_code)) {
                $player->country_code = strtoupper(substr($player->country_code, 0, 3));
                $player->save();
                $fixed++;
            }
        }

        return $fixed;
    }

    private function fixSocialLinks(): int
    {
        $fixed = 0;

        // Fix team social links
        $teams = Team::whereNotNull('social_links')->get();
        foreach ($teams as $team) {
            $socialLinks = $team->social_links;
            $updated = false;

            foreach ($socialLinks as $platform => $url) {
                if (!filter_var($url, FILTER_VALIDATE_URL)) {
                    unset($socialLinks[$platform]);
                    $updated = true;
                    $fixed++;
                }
            }

            if ($updated) {
                $team->social_links = $socialLinks;
                $team->save();
            }
        }

        // Fix player social links
        $players = Player::whereNotNull('social_links')->get();
        foreach ($players as $player) {
            $socialLinks = $player->social_links;
            $updated = false;

            foreach ($socialLinks as $platform => $url) {
                if (!filter_var($url, FILTER_VALIDATE_URL)) {
                    unset($socialLinks[$platform]);
                    $updated = true;
                    $fixed++;
                }
            }

            if ($updated) {
                $player->social_links = $socialLinks;
                $player->save();
            }
        }

        return $fixed;
    }

    private function fixRoleAssignments(): int
    {
        $fixed = 0;

        $players = Player::whereNotIn('role', $this->validRoles)
                        ->orWhereNull('role')
                        ->where('status', 'active')
                        ->get();

        foreach ($players as $player) {
            // Assign default role based on team needs
            $team = $player->team;
            if ($team) {
                $teamRoles = $team->players()->whereIn('role', $this->validRoles)->pluck('role');
                
                // Find missing roles and assign
                foreach ($this->validRoles as $role) {
                    if ($role !== 'Coach' && $role !== 'Substitute') {
                        $roleCount = $teamRoles->where('role', $role)->count();
                        if ($roleCount < 2) { // Max 2 per role is reasonable
                            $player->role = $role;
                            $player->save();
                            $fixed++;
                            break;
                        }
                    }
                }
            }
        }

        return $fixed;
    }

    private function removeDuplicates(): int
    {
        $removed = 0;

        // Remove duplicate players (keep the most recent)
        $duplicateGroups = Player::select('name', 'team_id', \DB::raw('count(*) as total'))
                                ->groupBy('name', 'team_id')
                                ->having('total', '>', 1)
                                ->get();

        foreach ($duplicateGroups as $group) {
            $duplicates = Player::where('name', $group->name)
                               ->where('team_id', $group->team_id)
                               ->orderBy('updated_at', 'desc')
                               ->get();
            
            // Keep the first (most recent), remove the rest
            $duplicates->shift();
            foreach ($duplicates as $duplicate) {
                $duplicate->delete();
                $removed++;
            }
        }

        return $removed;
    }
}