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
            'name'    => '野里2区域',
            'code'    => 'NZ2',
            'color'   => '#CC0000',
        ]);

        Area::create([
            'shop_id' => $shop->id,
            'name'    => '野里1区域',
            'code'    => 'NZ1',
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
