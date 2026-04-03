<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('route_points', function (Blueprint $table) {
            $table->id();
            $table->foreignId('route_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subscriber_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('sequence_order');
            $table->boolean('is_skipped')->default(false);
            $table->string('skip_reason')->nullable();
            $table->timestamps();

            $table->unique(['route_id', 'sequence_order']);
            $table->index(['route_id', 'subscriber_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('route_points');
    }
};
