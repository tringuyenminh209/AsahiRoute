<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscribers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('area_id')->constrained()->cascadeOnDelete();
            $table->string('customer_code', 50)->unique();
            $table->string('name');
            $table->string('name_kana')->nullable();
            $table->string('address');
            $table->string('address_kana')->nullable();
            $table->string('address_detail')->nullable()->comment('建物名・部屋番号');
            $table->string('postal_code', 10)->nullable();
            $table->decimal('lat', 10, 7)->nullable()->comment('緯度');
            $table->decimal('lng', 10, 7)->nullable()->comment('経度');
            $table->string('phone', 20)->nullable();
            $table->text('delivery_note')->nullable();
            $table->json('delivery_note_translations')->nullable()
                ->comment('{"en":"...","vi":"...","zh":"...","ko":"...","ne":"..."}');
            $table->json('photos')->nullable()->comment('["url1","url2"]');
            $table->softDeletes();
            $table->timestamps();

            $table->index(['lat', 'lng']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscribers');
    }
};
