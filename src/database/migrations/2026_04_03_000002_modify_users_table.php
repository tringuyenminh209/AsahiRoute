<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('shop_id')->after('id')->constrained()->cascadeOnDelete();
            $table->string('phone', 20)->nullable()->after('email');
            $table->enum('role', ['admin', 'deliverer'])->default('deliverer')->after('phone');
            $table->json('settings')->nullable()->after('role')
                ->comment('{"lang":"ja","font_size":"medium","voice_guide":false,"dark_mode":"auto","onboarding_done":false}');
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['shop_id']);
            $table->dropColumn(['shop_id', 'phone', 'role', 'settings', 'deleted_at']);
        });
    }
};
