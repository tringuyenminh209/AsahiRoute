<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subscriber_newspapers', function (Blueprint $table) {
            // Which days of week this newspaper is delivered.
            // null = every day. [1,2,3,4,5] = weekdays. [6,7] = weekend.
            // Encoding: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun
            $table->json('delivery_days')->nullable()->after('day_schedule');
        });
    }

    public function down(): void
    {
        Schema::table('subscriber_newspapers', function (Blueprint $table) {
            $table->dropColumn('delivery_days');
        });
    }
};
