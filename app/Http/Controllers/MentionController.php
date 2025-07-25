<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Team;
use App\Models\Player;
use Illuminate\Support\Facades\DB;

class MentionController extends Controller
{
    public function search(Request $request)
    {
        $query = $request->get('q', '');
        $type = $request->get('type', 'all');
        $limit = min($request->get('limit', 10), 50);

        $results = [];

        if ($type === 'all' || $type === 'user') {
            $users = User::where('name', 'like', '%' . $query . '%')
                ->orWhere('username', 'like', '%' . $query . '%')
                ->select('id', 'name', 'username', 'avatar')
                ->limit($limit)
                ->get()
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'type' => 'user',
                        'name' => $user->name,
                        'username' => $user->username,
                        'avatar' => $user->avatar,
                        'mention_text' => '@' . $user->username,
                        'display_name' => $user->name
                    ];
                });
            $results = array_merge($results, $users->toArray());
        }

        if ($type === 'all' || $type === 'team') {
            $teams = Team::where('name', 'like', '%' . $query . '%')
                ->orWhere('tag', 'like', '%' . $query . '%')
                ->select('id', 'name', 'tag', 'logo', 'region')
                ->limit($limit)
                ->get()
                ->map(function ($team) {
                    return [
                        'id' => $team->id,
                        'type' => 'team',
                        'name' => $team->name,
                        'tag' => $team->tag,
                        'logo' => $team->logo,
                        'region' => $team->region,
                        'mention_text' => '@team:' . $team->tag,
                        'display_name' => $team->name . ' (' . $team->tag . ')'
                    ];
                });
            $results = array_merge($results, $teams->toArray());
        }

        if ($type === 'all' || $type === 'player') {
            $players = Player::where('name', 'like', '%' . $query . '%')
                ->orWhere('ign', 'like', '%' . $query . '%')
                ->with('team:id,name,tag')
                ->select('id', 'name', 'ign', 'avatar', 'team_id', 'role')
                ->limit($limit)
                ->get()
                ->map(function ($player) {
                    return [
                        'id' => $player->id,
                        'type' => 'player',
                        'name' => $player->name,
                        'ign' => $player->ign,
                        'avatar' => $player->avatar,
                        'role' => $player->role,
                        'team' => $player->team ? [
                            'id' => $player->team->id,
                            'name' => $player->team->name,
                            'tag' => $player->team->tag
                        ] : null,
                        'mention_text' => '@player:' . $player->ign,
                        'display_name' => $player->ign . ($player->team ? ' (' . $player->team->tag . ')' : '')
                    ];
                });
            $results = array_merge($results, $players->toArray());
        }

        // Sort by relevance (exact matches first)
        usort($results, function ($a, $b) use ($query) {
            $aExact = stripos($a['display_name'], $query) === 0 ? 0 : 1;
            $bExact = stripos($b['display_name'], $query) === 0 ? 0 : 1;
            return $aExact - $bExact;
        });

        // Limit results
        $results = array_slice($results, 0, $limit);

        return response()->json([
            'success' => true,
            'data' => $results
        ]);
    }

    public function popular(Request $request)
    {
        $limit = min($request->get('limit', 8), 20);
        $results = [];

        // Get popular users (most active)
        $popularUsers = User::select('users.id', 'users.name', 'users.username', 'users.avatar')
            ->leftJoin('posts', 'users.id', '=', 'posts.user_id')
            ->leftJoin('threads', 'users.id', '=', 'threads.user_id')
            ->groupBy('users.id', 'users.name', 'users.username', 'users.avatar')
            ->orderByRaw('COUNT(posts.id) + COUNT(threads.id) DESC')
            ->limit($limit / 3)
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'type' => 'user',
                    'name' => $user->name,
                    'username' => $user->username,
                    'avatar' => $user->avatar,
                    'mention_text' => '@' . $user->username,
                    'display_name' => $user->name
                ];
            });

        // Get popular teams
        $popularTeams = Team::select('id', 'name', 'tag', 'logo', 'region')
            ->orderBy('created_at', 'desc')
            ->limit($limit / 3)
            ->get()
            ->map(function ($team) {
                return [
                    'id' => $team->id,
                    'type' => 'team',
                    'name' => $team->name,
                    'tag' => $team->tag,
                    'logo' => $team->logo,
                    'region' => $team->region,
                    'mention_text' => '@team:' . $team->tag,
                    'display_name' => $team->name . ' (' . $team->tag . ')'
                ];
            });

        // Get popular players
        $popularPlayers = Player::with('team:id,name,tag')
            ->select('id', 'name', 'ign', 'avatar', 'team_id', 'role')
            ->whereNotNull('team_id')
            ->orderBy('created_at', 'desc')
            ->limit($limit / 3)
            ->get()
            ->map(function ($player) {
                return [
                    'id' => $player->id,
                    'type' => 'player',
                    'name' => $player->name,
                    'ign' => $player->ign,
                    'avatar' => $player->avatar,
                    'role' => $player->role,
                    'team' => $player->team ? [
                        'id' => $player->team->id,
                        'name' => $player->team->name,
                        'tag' => $player->team->tag
                    ] : null,
                    'mention_text' => '@player:' . $player->ign,
                    'display_name' => $player->ign . ($player->team ? ' (' . $player->team->tag . ')' : '')
                ];
            });

        $results = array_merge(
            $popularUsers->toArray(),
            $popularTeams->toArray(),
            $popularPlayers->toArray()
        );

        return response()->json([
            'success' => true,
            'data' => $results
        ]);
    }
}