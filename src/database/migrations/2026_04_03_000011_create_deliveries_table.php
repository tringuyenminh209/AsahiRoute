<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('route_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('delivery_date');
            $table->enum('delivery_time', ['morning', 'evening']);
            $table->boolean('is_learning')->default(false);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->unsignedSmallInteger('total_points')->default(0);
            $table->unsignedSmallInteger('delivered_count')->default(0);
            $table->unsignedSmallInteger('skipped_count')->default(0);
            $table->unsignedSmallInteger('failed_count')->default(0);
            $table->unsignedInteger('total_distance_m')->nullable();
            $table->enum('status', ['not_started', 'in_progress', 'completed', 'handover'])->default('not_started');
            $table->timestamps();

            $table->unique(['route_id', 'delivery_date', 'delivery_time']);
            $table->index(['user_id', 'delivery_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deliveries');
    }
};
