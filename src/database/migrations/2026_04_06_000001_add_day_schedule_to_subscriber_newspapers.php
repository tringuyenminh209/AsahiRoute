<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subscriber_newspapers', function (Blueprint $table) {
            // Per-day quantity overrides: {"weekday":1,"saturday":2,"sunday":2,"holiday":1}
            // Null = use base quantity for all days
            $table->json('day_schedule')->nullable()->after('quantity');
        });
    }

    public function down(): void
    {
        Schema::table('subscriber_newspapers', function (Blueprint $table) {
            $table->dropColumn('day_schedule');
        });
    }
};
