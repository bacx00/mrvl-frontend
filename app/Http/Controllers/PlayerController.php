<?php

namespace App\Http\Controllers;

use App\Models\Player;
use Illuminate\Http\Request;

class PlayerController extends Controller
{
    public function index(Request $request)
    {
        $query = Player::with('team');

        // Filter by team if provided
        if ($request->has('team') && $request->team !== 'all') {
            $query->where('team_id', $request->team);
        }

        // Filter by role if provided
        if ($request->has('role') && $request->role !== 'all') {
            $query->where('role', $request->role);
        }

        // Filter by region if provided
        if ($request->has('region') && $request->region !== 'all') {
            $query->whereHas('team', function($q) use ($request) {
                $q->where('region', $request->region);
            });
        }

        $players = $query->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => $players
        ]);
    }

    public function show(Player $player)
    {
        $player->load('team');

        return response()->json([
            'success' => true,
            'data' => $player
        ]);
    }
}