<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Team;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AdminEventController extends Controller
{
    public function index()
    {
        $events = Event::with(['teams', 'matches'])
            ->orderBy('start_date', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $events
        ]);
    }

    public function show(Event $event)
    {
        $event->load(['teams', 'matches.team1', 'matches.team2', 'bracket']);

        return response()->json([
            'success' => true,
            'data' => $event
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after:start_date',
            'location' => 'nullable|string|max:255',
            'status' => 'required|in:upcoming,ongoing,completed,cancelled',
            'region' => 'required|string|max:100',
            'type' => 'required|string|max:100',
            'format' => 'required|string|max:100',
            'prize_pool' => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|size:3',
            'max_teams' => 'required|integer|min:2|max:64'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $event = Event::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Event created successfully',
            'data' => $event
        ], 201);
    }

    public function update(Request $request, Event $event)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|required|string',
            'start_date' => 'sometimes|required|date',
            'end_date' => 'nullable|date|after:start_date',
            'status' => 'sometimes|required|in:upcoming,ongoing,completed,cancelled',
            'prize_pool' => 'nullable|numeric|min:0',
            'max_teams' => 'sometimes|required|integer|min:2|max:64'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $event->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Event updated successfully',
            'data' => $event
        ]);
    }

    public function destroy(Event $event)
    {
        $event->delete();

        return response()->json([
            'success' => true,
            'message' => 'Event deleted successfully'
        ]);
    }

    public function addTeam(Request $request, Event $event)
    {
        $validator = Validator::make($request->all(), [
            'team_id' => 'required|exists:teams,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $team = Team::find($request->team_id);

        // Check if team is already registered
        if ($event->teams()->where('team_id', $team->id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Team is already registered for this event'
            ], 409);
        }

        // Check max teams limit
        if ($event->teams()->count() >= $event->max_teams) {
            return response()->json([
                'success' => false,
                'message' => 'Event has reached maximum team limit'
            ], 409);
        }

        $event->teams()->attach($team->id);

        return response()->json([
            'success' => true,
            'message' => 'Team added to event successfully'
        ]);
    }

    public function removeTeam(Event $event, Team $team)
    {
        if (!$event->teams()->where('team_id', $team->id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Team is not registered for this event'
            ], 404);
        }

        $event->teams()->detach($team->id);

        return response()->json([
            'success' => true,
            'message' => 'Team removed from event successfully'
        ]);
    }

    public function generateBracket(Event $event)
    {
        $teams = $event->teams()->get();

        if ($teams->count() < 2) {
            return response()->json([
                'success' => false,
                'message' => 'Need at least 2 teams to generate bracket'
            ], 400);
        }

        // Simple bracket generation logic - you can enhance this
        $bracket = [
            'type' => 'single_elimination',
            'teams' => $teams->toArray(),
            'rounds' => $this->generateBracketRounds($teams)
        ];

        $event->update(['details' => array_merge($event->details ?? [], ['bracket' => $bracket])]);

        return response()->json([
            'success' => true,
            'message' => 'Bracket generated successfully',
            'data' => $bracket
        ]);
    }

    private function generateBracketRounds($teams)
    {
        $teamCount = $teams->count();
        $rounds = [];
        
        // Simple round-robin or single elimination logic
        // This is a basic implementation - enhance as needed
        $rounds[0] = [];
        for ($i = 0; $i < $teamCount; $i += 2) {
            if (isset($teams[$i + 1])) {
                $rounds[0][] = [
                    'team1_id' => $teams[$i]->id,
                    'team2_id' => $teams[$i + 1]->id,
                    'winner_id' => null
                ];
            }
        }

        return $rounds;
    }
}