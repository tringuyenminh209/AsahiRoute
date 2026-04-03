<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delivery_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('delivery_id')->constrained()->cascadeOnDelete();
            $table->foreignId('route_point_id')->constrained()->cascadeOnDelete();
            $table->enum('status', ['delivered', 'skipped', 'failed', 'absent']);
            $table->timestamp('delivered_at')->nullable();
            $table->decimal('lat', 10, 7)->nullable();
            $table->decimal('lng', 10, 7)->nullable();
            $table->string('failure_reason')->nullable();
            $table->string('photo')->nullable();
            $table->boolean('synced')->default(true)->comment('false = offline で記録、未同期');
            $table->timestamps();

            $table->unique(['delivery_id', 'route_point_id']);
            $table->index(['delivery_id', 'status']);
            $table->index('synced');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_logs');
    }
};
