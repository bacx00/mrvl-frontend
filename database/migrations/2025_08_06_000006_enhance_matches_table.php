<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('matches', function (Blueprint $table) {
            // Add event relationship
            $table->foreignId('event_id')->nullable()->constrained()->onDelete('cascade')->after('id');
            
            // Rename score fields to match frontend expectations
            $table->renameColumn('score1', 'team1_score');
            $table->renameColumn('score2', 'team2_score');
            $table->renameColumn('date', 'scheduled_at');
            
            // Add new match fields
            $table->datetime('started_at')->nullable()->after('team2_score');
            $table->datetime('ended_at')->nullable()->after('started_at');
            $table->string('status')->default('scheduled')->after('ended_at'); // scheduled, live, completed, cancelled
            $table->foreignId('winner_id')->nullable()->constrained('teams')->onDelete('set null')->after('status');
            $table->json('match_data')->nullable()->after('winner_id'); // detailed match data
            $table->string('stream_url')->nullable()->after('match_data');
            $table->string('vod_url')->nullable()->after('stream_url');
            
            // Add indexes
            $table->index(['event_id']);
            $table->index(['status']);
            $table->index(['scheduled_at']);
        });
    }

    public function down()
    {
        Schema::table('matches', function (Blueprint $table) {
            $table->dropForeign(['event_id']);
            $table->dropForeign(['winner_id']);
            $table->dropIndex(['event_id']);
            $table->dropIndex(['status']);
            $table->dropIndex(['scheduled_at']);
            
            $table->dropColumn([
                'event_id', 'started_at', 'ended_at', 'status', 
                'winner_id', 'match_data', 'stream_url', 'vod_url'
            ]);
            
            $table->renameColumn('team1_score', 'score1');
            $table->renameColumn('team2_score', 'score2');
            $table->renameColumn('scheduled_at', 'date');
        });
    }
};