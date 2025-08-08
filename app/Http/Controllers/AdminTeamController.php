<?php

namespace App\Http\Controllers;

use App\Models\Team;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AdminTeamController extends Controller
{
    public function index()
    {
        $teams = Team::with('players')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $teams
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:teams',
            'region' => 'required|string|max:100',
            'country' => 'nullable|string|max:100',
            'logo' => 'nullable|string|max:500',
            'description' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $team = Team::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Team created successfully',
            'data' => $team
        ], 201);
    }

    public function update(Request $request, Team $team)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255|unique:teams,name,' . $team->id,
            'region' => 'sometimes|required|string|max:100',
            'country' => 'nullable|string|max:100',
            'logo' => 'nullable|string|max:500',
            'description' => 'nullable|string',
            'points' => 'nullable|integer|min:0'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $team->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Team updated successfully',
            'data' => $team
        ]);
    }

    public function destroy(Team $team)
    {
        $team->delete();

        return response()->json([
            'success' => true,
            'message' => 'Team deleted successfully'
        ]);
    }
}