<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('event_teams', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->onDelete('cascade');
            $table->foreignId('team_id')->constrained()->onDelete('cascade');
            $table->timestamps();
            
            // Ensure unique event-team combinations
            $table->unique(['event_id', 'team_id']);
            $table->index(['event_id']);
            $table->index(['team_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('event_teams');
    }
};