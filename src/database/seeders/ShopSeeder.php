<?php

namespace Database\Seeders;

use App\Models\Shop;
use Illuminate\Database\Seeder;

class ShopSeeder extends Seeder
{
    public function run(): void
    {
        Shop::create([
            'name'            => 'ASA山口中央',
            'code'            => 'ASA-YGC-001',
            'address'         => '山口県山口市中央通り1-1-1',
            'phone'           => '083-900-0001',
            'emergency_phone' => '083-900-0002',
            'lat'             => 34.1855,
            'lng'             => 131.4706,
        ]);
    }
}
