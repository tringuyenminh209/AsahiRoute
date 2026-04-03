<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('routes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('area_id')->constrained()->cascadeOnDelete();
            $table->foreignId('assigned_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('name');
            $table->enum('delivery_time', ['morning', 'evening']);
            $table->unsignedSmallInteger('total_points')->default(0);
            $table->unsignedSmallInteger('estimated_duration_min')->nullable();
            $table->unsignedInteger('estimated_distance_m')->nullable();
            $table->timestamp('optimized_at')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('routes');
    }
};
