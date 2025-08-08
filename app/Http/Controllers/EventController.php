<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Request;

class EventController extends Controller
{
    public function index(Request $request)
    {
        $query = Event::query();

        // Filter by status if provided
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by region if provided
        if ($request->has('region') && $request->region !== 'all') {
            $query->where('region', $request->region);
        }

        $events = $query->orderBy('start_date', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $events
        ]);
    }

    public function show(Event $event)
    {
        // Load all related data that frontend expects
        $event->load(['teams', 'matches.team1', 'matches.team2', 'bracket']);

        return response()->json([
            'success' => true,
            'data' => $event
        ]);
    }

    public function teams(Event $event)
    {
        $teams = $event->teams()->get();

        return response()->json([
            'success' => true,
            'data' => $teams
        ]);
    }

    public function matches(Event $event)
    {
        $matches = $event->matches()
            ->with(['team1', 'team2'])
            ->orderBy('scheduled_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $matches
        ]);
    }
}