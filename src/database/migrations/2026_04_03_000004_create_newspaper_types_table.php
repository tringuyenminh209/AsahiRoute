<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('newspaper_types', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('code', 20);
            $table->enum('delivery_time', ['morning', 'evening'])->default('morning');
            $table->timestamps();

            $table->unique(['shop_id', 'code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('newspaper_types');
    }
};
