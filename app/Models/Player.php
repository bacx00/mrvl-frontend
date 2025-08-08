<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Player extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'username', 'real_name', 'nickname', 'team_id',
        'country', 'country_code', 'flag_url', 'role', 'secondary_role',
        'elo_rating', 'peak_elo', 'avatar_url', 'profile_image_url',
        'total_earnings', 'currency', 'social_links', 'tournaments_played',
        'tournaments_won', 'win_rate', 'maps_played', 'maps_won',
        'kd_ratio', 'avg_kills_per_map', 'avg_deaths_per_map', 'avg_assists_per_map',
        'liquipedia_url', 'liquipedia_id', 'status', 'birth_date', 'age',
        'career_start', 'last_active_at', 'last_scraped_at', 'team_history',
        'joined_current_team_at', 'achievements', 'awards'
    ];

    protected $casts = [
        'social_links' => 'array',
        'team_history' => 'array',
        'achievements' => 'array',
        'awards' => 'array',
        'total_earnings' => 'decimal:2',
        'win_rate' => 'decimal:2',
        'kd_ratio' => 'decimal:2',
        'avg_kills_per_map' => 'decimal:2',
        'avg_deaths_per_map' => 'decimal:2',
        'avg_assists_per_map' => 'decimal:2',
        'birth_date' => 'date',
        'career_start' => 'datetime',
        'last_active_at' => 'datetime',
        'last_scraped_at' => 'datetime',
        'joined_current_team_at' => 'date',
    ];

    public function team()
    {
        return $this->belongsTo(Team::class);
    }

    public function matches()
    {
        return $this->belongsToMany(Match::class, 'match_player')
                    ->withPivot('kills', 'deaths', 'assists')
                    ->withTimestamps();
    }

    // Helper methods for social media links
    public function getTwitterUrl(): ?string
    {
        return $this->social_links['twitter'] ?? null;
    }

    public function getInstagramUrl(): ?string
    {
        return $this->social_links['instagram'] ?? null;
    }

    public function getYoutubeUrl(): ?string
    {
        return $this->social_links['youtube'] ?? null;
    }

    public function getTwitchUrl(): ?string
    {
        return $this->social_links['twitch'] ?? null;
    }

    public function getDiscordUrl(): ?string
    {
        return $this->social_links['discord'] ?? null;
    }

    public function getTiktokUrl(): ?string
    {
        return $this->social_links['tiktok'] ?? null;
    }

    public function getFacebookUrl(): ?string
    {
        return $this->social_links['facebook'] ?? null;
    }

    // Role checking methods
    public function isMainPlayer(): bool
    {
        return $this->status === 'active' && !in_array($this->role, ['coach', 'substitute']);
    }

    public function isCoach(): bool
    {
        return $this->role === 'coach';
    }

    public function isSubstitute(): bool
    {
        return $this->status === 'substitute' || $this->role === 'substitute';
    }

    // Calculated attributes
    protected function displayName(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->username ?: $this->name
        );
    }

    protected function fullName(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->real_name ?: $this->name
        );
    }

    protected function winRatePercentage(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->win_rate ? round($this->win_rate, 1) . '%' : '0%'
        );
    }

    protected function mapWinRatePercentage(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->maps_played > 0 
                ? round(($this->maps_won / $this->maps_played) * 100, 1) . '%' 
                : '0%'
        );
    }

    protected function formattedEarnings(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->currency . ' ' . number_format($this->total_earnings, 2)
        );
    }

    protected function isActive(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->status === 'active'
        );
    }

    protected function ageFromBirthDate(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->birth_date 
                ? $this->birth_date->diffInYears(now())
                : $this->age
        );
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeMainPlayers($query)
    {
        return $query->where('status', 'active')
                    ->whereNotIn('role', ['coach', 'substitute']);
    }

    public function scopeCoaches($query)
    {
        return $query->where('role', 'coach');
    }

    public function scopeByRole($query, $role)
    {
        return $query->where('role', $role);
    }
}