<?php

namespace App\Http\Controllers;

use App\Models\Team;
use Illuminate\Http\Request;

class TeamController extends Controller
{
    public function index(Request $request)
    {
        $query = Team::query();

        // Filter by region if provided
        if ($request->has('region') && $request->region !== 'all') {
            $query->where('region', $request->region);
        }

        // Sort by specified field
        if ($request->has('sort_by')) {
            $sortBy = $request->sort_by;
            if (in_array($sortBy, ['name', 'points', 'region', 'created_at'])) {
                $query->orderBy($sortBy, 'desc');
            }
        } else {
            $query->orderBy('points', 'desc');
        }

        $teams = $query->get();

        return response()->json([
            'success' => true,
            'data' => $teams
        ]);
    }

    public function show(Team $team)
    {
        // Load related players if they exist
        $team->load('players');

        return response()->json([
            'success' => true,
            'data' => $team
        ]);
    }
}