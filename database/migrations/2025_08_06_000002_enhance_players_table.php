<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('players', function (Blueprint $table) {
            // Basic player information
            $table->string('username')->nullable()->after('name');
            $table->string('real_name')->nullable()->after('username');
            $table->string('nickname')->nullable()->after('real_name');
            
            // Regional information
            $table->string('country')->nullable()->after('nickname');
            $table->string('country_code', 3)->nullable()->after('country');
            $table->string('flag_url')->nullable()->after('country_code');
            
            // Game specific information
            $table->string('role')->nullable()->after('flag_url');
            $table->string('secondary_role')->nullable()->after('role');
            $table->integer('elo_rating')->nullable()->after('secondary_role');
            $table->integer('peak_elo')->nullable()->after('elo_rating');
            
            // Visual assets
            $table->string('avatar_url')->nullable()->after('peak_elo');
            $table->string('profile_image_url')->nullable()->after('avatar_url');
            
            // Financial information
            $table->decimal('total_earnings', 15, 2)->default(0)->after('profile_image_url');
            $table->string('currency', 3)->default('USD')->after('total_earnings');
            
            // Social media links
            $table->json('social_links')->nullable()->after('currency');
            
            // Player statistics
            $table->integer('tournaments_played')->default(0)->after('social_links');
            $table->integer('tournaments_won')->default(0)->after('tournaments_played');
            $table->decimal('win_rate', 5, 2)->default(0)->after('tournaments_won');
            $table->integer('maps_played')->default(0)->after('win_rate');
            $table->integer('maps_won')->default(0)->after('maps_played');
            
            // Performance statistics
            $table->decimal('kd_ratio', 5, 2)->nullable()->after('maps_won');
            $table->decimal('avg_kills_per_map', 5, 2)->nullable()->after('kd_ratio');
            $table->decimal('avg_deaths_per_map', 5, 2)->nullable()->after('avg_kills_per_map');
            $table->decimal('avg_assists_per_map', 5, 2)->nullable()->after('avg_deaths_per_map');
            
            // Liquipedia specific
            $table->string('liquipedia_url')->nullable()->after('avg_assists_per_map');
            $table->string('liquipedia_id')->nullable()->after('liquipedia_url');
            
            // Status and metadata
            $table->enum('status', ['active', 'inactive', 'retired', 'substitute'])->default('active')->after('liquipedia_id');
            $table->date('birth_date')->nullable()->after('status');
            $table->integer('age')->nullable()->after('birth_date');
            $table->timestamp('career_start')->nullable()->after('age');
            $table->timestamp('last_active_at')->nullable()->after('career_start');
            $table->timestamp('last_scraped_at')->nullable()->after('last_active_at');
            
            // Team history
            $table->json('team_history')->nullable()->after('last_scraped_at');
            $table->date('joined_current_team_at')->nullable()->after('team_history');
            
            // Achievements
            $table->json('achievements')->nullable()->after('joined_current_team_at');
            $table->json('awards')->nullable()->after('achievements');
        });
    }

    public function down()
    {
        Schema::table('players', function (Blueprint $table) {
            $table->dropColumn([
                'username', 'real_name', 'nickname', 'country', 'country_code', 'flag_url',
                'role', 'secondary_role', 'elo_rating', 'peak_elo', 'avatar_url', 'profile_image_url',
                'total_earnings', 'currency', 'social_links', 'tournaments_played', 'tournaments_won',
                'win_rate', 'maps_played', 'maps_won', 'kd_ratio', 'avg_kills_per_map', 'avg_deaths_per_map',
                'avg_assists_per_map', 'liquipedia_url', 'liquipedia_id', 'status', 'birth_date', 'age',
                'career_start', 'last_active_at', 'last_scraped_at', 'team_history', 'joined_current_team_at',
                'achievements', 'awards'
            ]);
        });
    }
};