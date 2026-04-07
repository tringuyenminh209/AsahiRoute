<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // company_admin は shop を持たないため shop_id を nullable に
            $table->foreignId('shop_id')->nullable()->change();

            // company_admin は company_id で所属会社を持つ
            $table->foreignId('company_id')
                ->nullable()
                ->after('id')
                ->constrained()
                ->nullOnDelete();
        });

        // role was changed to string in the initial modification, no need to alter column here.
    }

    public function down(): void
    {
        // No action needed for role string

        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['company_id']);
            $table->dropColumn('company_id');
            $table->foreignId('shop_id')->nullable(false)->change();
        });
    }
};
