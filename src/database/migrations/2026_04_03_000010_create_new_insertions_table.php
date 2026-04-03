<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('new_insertions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subscriber_id')->constrained()->cascadeOnDelete();
            $table->foreignId('route_id')->constrained()->cascadeOnDelete();
            $table->foreignId('registered_by')->constrained('users');
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->unsignedSmallInteger('suggested_order')->nullable();
            $table->unsignedSmallInteger('actual_order')->nullable();
            $table->enum('status', ['pending', 'approved', 'inserted', 'rejected'])->default('pending');
            $table->date('effective_date');
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();

            $table->index(['route_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('new_insertions');
    }
};
