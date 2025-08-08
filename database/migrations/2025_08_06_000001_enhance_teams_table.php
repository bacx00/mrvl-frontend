<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('teams', function (Blueprint $table) {
            // Basic team information
            $table->string('short_name')->nullable()->after('name');
            $table->string('tag')->nullable()->after('short_name');
            $table->text('description')->nullable()->after('points');
            
            // Regional information
            $table->string('region')->nullable()->after('description');
            $table->string('country')->nullable()->after('region');
            $table->string('country_code', 3)->nullable()->after('country');
            $table->string('flag_url')->nullable()->after('country_code');
            
            // Visual assets
            $table->string('logo_url')->nullable()->after('flag_url');
            $table->string('banner_url')->nullable()->after('logo_url');
            
            // Financial information
            $table->decimal('total_earnings', 15, 2)->default(0)->after('banner_url');
            $table->string('currency', 3)->default('USD')->after('total_earnings');
            
            // Social media links
            $table->json('social_links')->nullable()->after('currency');
            
            // Team statistics
            $table->integer('tournaments_played')->default(0)->after('social_links');
            $table->integer('tournaments_won')->default(0)->after('tournaments_played');
            $table->decimal('win_rate', 5, 2)->default(0)->after('tournaments_won');
            
            // Liquipedia specific
            $table->string('liquipedia_url')->nullable()->after('win_rate');
            $table->string('liquipedia_id')->nullable()->after('liquipedia_url');
            
            // Status and metadata
            $table->enum('status', ['active', 'inactive', 'disbanded'])->default('active')->after('liquipedia_id');
            $table->timestamp('founded_at')->nullable()->after('status');
            $table->timestamp('disbanded_at')->nullable()->after('founded_at');
            $table->timestamp('last_scraped_at')->nullable()->after('disbanded_at');
            
            // Coach information
            $table->string('coach_name')->nullable()->after('last_scraped_at');
            $table->string('coach_real_name')->nullable()->after('coach_name');
            $table->string('coach_country')->nullable()->after('coach_real_name');
            $table->string('coach_flag_url')->nullable()->after('coach_country');
            $table->string('coach_image_url')->nullable()->after('coach_flag_url');
            $table->json('coach_social_links')->nullable()->after('coach_image_url');
        });
    }

    public function down()
    {
        Schema::table('teams', function (Blueprint $table) {
            $table->dropColumn([
                'short_name', 'tag', 'description', 'region', 'country', 'country_code', 'flag_url',
                'logo_url', 'banner_url', 'total_earnings', 'currency', 'social_links',
                'tournaments_played', 'tournaments_won', 'win_rate', 'liquipedia_url', 'liquipedia_id',
                'status', 'founded_at', 'disbanded_at', 'last_scraped_at',
                'coach_name', 'coach_real_name', 'coach_country', 'coach_flag_url', 'coach_image_url', 'coach_social_links'
            ]);
        });
    }
};