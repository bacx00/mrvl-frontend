<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Team extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'short_name', 'tag', 'description', 'points',
        'region', 'country', 'country_code', 'flag_url',
        'logo_url', 'banner_url', 'total_earnings', 'currency',
        'social_links', 'tournaments_played', 'tournaments_won',
        'win_rate', 'liquipedia_url', 'liquipedia_id', 'status',
        'founded_at', 'disbanded_at', 'last_scraped_at',
        'coach_name', 'coach_real_name', 'coach_country',
        'coach_flag_url', 'coach_image_url', 'coach_social_links'
    ];

    protected $casts = [
        'social_links' => 'array',
        'coach_social_links' => 'array',
        'total_earnings' => 'decimal:2',
        'win_rate' => 'decimal:2',
        'founded_at' => 'datetime',
        'disbanded_at' => 'datetime',
        'last_scraped_at' => 'datetime',
    ];

    public function players()
    {
        return $this->hasMany(Player::class);
    }

    public function activePlayers()
    {
        return $this->hasMany(Player::class)->where('status', 'active');
    }

    public function mainPlayers()
    {
        return $this->hasMany(Player::class)
                   ->whereIn('status', ['active'])
                   ->whereNotIn('status', ['substitute'])
                   ->limit(6);
    }

    public function coach()
    {
        return $this->hasOne(Player::class)->where('role', 'coach');
    }

    public function matchesAsTeam1()
    {
        return $this->hasMany(Match::class, 'team1_id');
    }

    public function matchesAsTeam2()
    {
        return $this->hasMany(Match::class, 'team2_id');
    }

    public function allMatches()
    {
        return Match::where('team1_id', $this->id)
                   ->orWhere('team2_id', $this->id);
    }

    // Team-Event relationship (many-to-many)
    public function events()
    {
        return $this->belongsToMany(Event::class, 'event_teams')
            ->withTimestamps();
    }

    // Helper methods for social media links
    public function getTwitterUrl(): ?string
    {
        return $this->social_links['twitter'] ?? null;
    }

    public function getDiscordUrl(): ?string
    {
        return $this->social_links['discord'] ?? null;
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

    public function getFacebookUrl(): ?string
    {
        return $this->social_links['facebook'] ?? null;
    }

    // Calculated attributes
    protected function winRatePercentage(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->win_rate ? round($this->win_rate, 1) . '%' : '0%'
        );
    }

    protected function isActive(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->status === 'active'
        );
    }

    protected function formattedEarnings(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->currency . ' ' . number_format($this->total_earnings, 2)
        );
    }
}