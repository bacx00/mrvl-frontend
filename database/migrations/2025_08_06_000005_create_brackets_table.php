<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('brackets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->unique()->constrained()->onDelete('cascade');
            $table->string('type')->default('single_elimination'); // single_elimination, double_elimination, swiss
            $table->json('structure'); // bracket structure and rounds
            $table->json('settings')->nullable(); // bracket configuration
            $table->timestamps();
            
            $table->index(['event_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('brackets');
    }
};