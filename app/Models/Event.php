<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description', 
        'start_date',
        'end_date',
        'location',
        'status',
        'region',
        'type',
        'format',
        'prize_pool',
        'currency',
        'max_teams',
        'banner',
        'logo',
        'rules',
        'prize_distribution',
        'details'
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'prize_pool' => 'decimal:2',
        'prize_distribution' => 'json',
        'details' => 'json'
    ];

    // Event-Team relationship (many-to-many)
    public function teams()
    {
        return $this->belongsToMany(Team::class, 'event_teams')
            ->withTimestamps();
    }

    // Event-Match relationship (one-to-many)
    public function matches()
    {
        return $this->hasMany(Match::class);
    }

    // Event bracket relationship (one-to-one)
    public function bracket()
    {
        return $this->hasOne(Bracket::class);
    }

    // Scope for filtering by status
    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    // Scope for filtering by region
    public function scopeRegion($query, $region)
    {
        return $query->where('region', $region);
    }
}