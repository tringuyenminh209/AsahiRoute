<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('areas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('code', 20);
            $table->longText('boundary_geojson')->nullable();
            $table->string('color', 7)->default('#CC0000');
            $table->softDeletes();
            $table->timestamps();

            $table->unique(['shop_id', 'code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('areas');
    }
};
