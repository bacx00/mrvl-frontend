<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Match extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_id',
        'team1_id', 
        'team2_id', 
        'team1_score', 
        'team2_score',
        'scheduled_at',
        'started_at',
        'ended_at', 
        'status',
        'winner_id',
        'match_data',
        'stream_url',
        'vod_url'
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'match_data' => 'json'
    ];

    // Match belongs to Event
    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function team1()
    {
        return $this->belongsTo(Team::class, 'team1_id');
    }

    public function team2()
    {
        return $this->belongsTo(Team::class, 'team2_id');
    }

    public function winner()
    {
        return $this->belongsTo(Team::class, 'winner_id');
    }

    public function players()
    {
        return $this->belongsToMany(Player::class, 'match_player')
                    ->withPivot('kills', 'deaths', 'assists')
                    ->withTimestamps();
    }

    // Scope for filtering by status
    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    // Scope for live matches
    public function scopeLive($query)
    {
        return $query->where('status', 'live');
    }

    // Helper method to check if match is live
    public function isLive()
    {
        return $this->status === 'live';
    }

    // Helper method to check if match is completed
    public function isCompleted()
    {
        return $this->status === 'completed';
    }
}