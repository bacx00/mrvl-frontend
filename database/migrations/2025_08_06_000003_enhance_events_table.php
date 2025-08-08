<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('events', function (Blueprint $table) {
            // Remove old date field and add new fields
            $table->dropColumn('date');
            
            // Add new event fields to match frontend expectations
            $table->datetime('start_date')->after('description');
            $table->datetime('end_date')->nullable()->after('start_date');
            $table->string('status')->default('upcoming')->after('end_date'); // upcoming, ongoing, completed, cancelled
            $table->string('region')->nullable()->after('status');
            $table->string('type')->nullable()->after('region'); // tournament, league, showmatch
            $table->string('format')->nullable()->after('type'); // single_elimination, double_elimination, round_robin
            $table->decimal('prize_pool', 10, 2)->nullable()->after('format');
            $table->string('currency', 3)->default('USD')->after('prize_pool');
            $table->integer('max_teams')->default(16)->after('currency');
            $table->string('banner')->nullable()->after('max_teams'); // banner image URL
            $table->string('logo')->nullable()->after('banner'); // event logo URL
            $table->text('rules')->nullable()->after('logo');
            $table->json('prize_distribution')->nullable()->after('rules'); // prize breakdown
            $table->json('details')->nullable()->after('prize_distribution'); // additional event details
        });
    }

    public function down()
    {
        Schema::table('events', function (Blueprint $table) {
            // Revert changes
            $table->dropColumn([
                'start_date', 'end_date', 'status', 'region', 'type', 'format',
                'prize_pool', 'currency', 'max_teams', 'banner', 'logo', 
                'rules', 'prize_distribution', 'details'
            ]);
            $table->datetime('date')->after('description');
        });
    }
};