<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('suspensions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subscriber_id')->constrained()->cascadeOnDelete();
            $table->foreignId('registered_by')->constrained('users');
            $table->foreignId('cancelled_by')->nullable()->constrained('users');
            $table->date('start_date');
            $table->date('end_date');
            $table->string('reason')->nullable();
            $table->json('newspapers')->nullable()->comment('[{"newspaper_type_id":1,"quantity":1}]');
            $table->enum('status', ['scheduled', 'active', 'completed', 'cancelled'])->default('scheduled');
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->index(['subscriber_id', 'status']);
            $table->index(['start_date', 'end_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('suspensions');
    }
};
