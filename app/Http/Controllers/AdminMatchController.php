<?php

namespace App\Http\Controllers;

use App\Models\Match;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AdminMatchController extends Controller
{
    public function index()
    {
        $matches = Match::with(['team1', 'team2', 'event'])
            ->orderBy('scheduled_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $matches
        ]);
    }

    public function show(Match $match)
    {
        $match->load(['team1', 'team2', 'event']);

        return response()->json([
            'success' => true,
            'data' => $match
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'event_id' => 'required|exists:events,id',
            'team1_id' => 'required|exists:teams,id',
            'team2_id' => 'required|exists:teams,id|different:team1_id',
            'scheduled_at' => 'required|date',
            'status' => 'required|in:scheduled,live,completed,cancelled'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $match = Match::create($request->all());
        $match->load(['team1', 'team2', 'event']);

        return response()->json([
            'success' => true,
            'message' => 'Match created successfully',
            'data' => $match
        ], 201);
    }

    public function update(Request $request, Match $match)
    {
        $validator = Validator::make($request->all(), [
            'scheduled_at' => 'sometimes|required|date',
            'status' => 'sometimes|required|in:scheduled,live,completed,cancelled',
            'team1_score' => 'nullable|integer|min:0',
            'team2_score' => 'nullable|integer|min:0',
            'winner_id' => 'nullable|exists:teams,id',
            'match_data' => 'nullable|array'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $match->update($request->all());
        $match->load(['team1', 'team2', 'event']);

        return response()->json([
            'success' => true,
            'message' => 'Match updated successfully',
            'data' => $match
        ]);
    }

    public function destroy(Match $match)
    {
        $match->delete();

        return response()->json([
            'success' => true,
            'message' => 'Match deleted successfully'
        ]);
    }
}