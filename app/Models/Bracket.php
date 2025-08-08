<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Bracket extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_id',
        'type',
        'structure',
        'settings'
    ];

    protected $casts = [
        'structure' => 'json',
        'settings' => 'json'
    ];

    // Bracket belongs to Event
    public function event()
    {
        return $this->belongsTo(Event::class);
    }
}