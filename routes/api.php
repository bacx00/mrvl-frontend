<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ThreadController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\MatchController;
use App\Http\Controllers\RankingController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\PlayerController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\AdminStatsController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\AdminEventController;
use App\Http\Controllers\AdminMatchController;
use App\Http\Controllers\AdminTeamController;

// Authentication routes
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::middleware('auth:sanctum')->post('/logout', [AuthController::class, 'logout']);
});

// User routes
Route::middleware('auth:sanctum')->get('/user', [AuthController::class, 'user']);

// Forum routes
Route::prefix('forum')->group(function () {
    Route::get('/threads', [ThreadController::class, 'index']);
    Route::get('/threads/{thread}', [ThreadController::class, 'show']);
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/threads', [ThreadController::class, 'store']);
        Route::post('/threads/{thread}/posts', [PostController::class, 'store']);
        Route::delete('/threads/{thread}', [ThreadController::class, 'destroy']);
        Route::delete('/posts/{post}', [PostController::class, 'destroy']);
    });
});

// Matches routes
Route::get('/matches', [MatchController::class, 'index']);
Route::get('/matches/{match}', [MatchController::class, 'show']);


// Ranking routes
Route::get('/rankings', [RankingController::class, 'index']);

// Public API routes
Route::get('/events', [EventController::class, 'index']);
Route::get('/events/{event}', [EventController::class, 'show']);
Route::get('/events/{event}/teams', [EventController::class, 'teams']);
Route::get('/events/{event}/matches', [EventController::class, 'matches']);

Route::get('/teams', [TeamController::class, 'index']);
Route::get('/teams/{team}', [TeamController::class, 'show']);

Route::get('/players', [PlayerController::class, 'index']);
Route::get('/players/{player}', [PlayerController::class, 'show']);

//Chat routes

Route::middleware('auth:sanctum')->get('/chat', [ChatController::class, 'index']);
Route::middleware('auth:sanctum')->post('/chat', [ChatController::class, 'store']);

// Admin routes with proper authentication
Route::prefix('admin')->middleware(['auth:sanctum', 'role:admin|moderator'])->group(function () {
    // Admin stats
    Route::get('/stats', [AdminStatsController::class, 'index']);
    
    // User management
    Route::get('/users', [AdminUserController::class, 'index']);
    Route::put('/users/{user}', [AdminUserController::class, 'update']);
    
    // Event management
    Route::get('/events', [AdminEventController::class, 'index']);
    Route::get('/events/{event}', [AdminEventController::class, 'show']);
    Route::post('/events', [AdminEventController::class, 'store']);
    Route::put('/events/{event}', [AdminEventController::class, 'update']);
    Route::delete('/events/{event}', [AdminEventController::class, 'destroy']);
    
    // Event team management
    Route::post('/events/{event}/teams', [AdminEventController::class, 'addTeam']);
    Route::delete('/events/{event}/teams/{team}', [AdminEventController::class, 'removeTeam']);
    
    // Bracket generation
    Route::post('/events/{event}/generate-bracket', [AdminEventController::class, 'generateBracket']);
    
    // Match management  
    Route::get('/matches', [AdminMatchController::class, 'index']);
    Route::get('/matches/{match}', [AdminMatchController::class, 'show']);
    Route::post('/matches', [AdminMatchController::class, 'store']);
    Route::put('/matches/{match}', [AdminMatchController::class, 'update']);
    Route::delete('/matches/{match}', [AdminMatchController::class, 'destroy']);
    
    // Team management
    Route::get('/teams', [AdminTeamController::class, 'index']);
    Route::post('/teams', [AdminTeamController::class, 'store']);
    Route::put('/teams/{team}', [AdminTeamController::class, 'update']);
    Route::delete('/teams/{team}', [AdminTeamController::class, 'destroy']);
});