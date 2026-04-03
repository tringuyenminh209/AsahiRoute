<?php

namespace Database\Seeders;

use App\Models\Area;
use App\Models\NewspaperType;
use App\Models\Shop;
use Illuminate\Database\Seeder;

class AreaAndNewspaperSeeder extends Seeder
{
    public function run(): void
    {
        $shop = Shop::first();

        Area::create([
            'shop_id' => $shop->id,
            'name'    => 'A区域',
            'code'    => 'A',
            'color'   => '#CC0000',
        ]);

        Area::create([
            'shop_id' => $shop->id,
            'name'    => 'B区域',
            'code'    => 'B',
            'color'   => '#0066CC',
        ]);

        NewspaperType::create([
            'shop_id'       => $shop->id,
            'name'          => '朝日新聞 朝刊',
            'code'          => 'ASA-M',
            'delivery_time' => 'morning',
        ]);

        NewspaperType::create([
            'shop_id'       => $shop->id,
            'name'          => '朝日新聞 夕刊',
            'code'          => 'ASA-E',
            'delivery_time' => 'evening',
        ]);
    }
}
