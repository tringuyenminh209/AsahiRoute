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

        $newspapers = [
            // 朝日新聞
            ['name' => '朝日新聞 朝刊',           'code' => 'ASA-M', 'delivery_time' => 'morning'],
            ['name' => '朝日新聞 夕刊',           'code' => 'ASA-E', 'delivery_time' => 'evening'],
            // 読売新聞
            ['name' => '読売新聞 朝刊',           'code' => 'YOM-M', 'delivery_time' => 'morning'],
            ['name' => '読売新聞 夕刊',           'code' => 'YOM-E', 'delivery_time' => 'evening'],
            // 毎日新聞
            ['name' => '毎日新聞 朝刊',           'code' => 'MAI-M', 'delivery_time' => 'morning'],
            ['name' => '毎日新聞 夕刊',           'code' => 'MAI-E', 'delivery_time' => 'evening'],
            // 産経新聞（夕刊なし）
            ['name' => '産経新聞',               'code' => 'SAN-M', 'delivery_time' => 'morning'],
            // 日本経済新聞
            ['name' => '日本経済新聞 朝刊',       'code' => 'NIK-M', 'delivery_time' => 'morning'],
            ['name' => '日本経済新聞 夕刊',       'code' => 'NIK-E', 'delivery_time' => 'evening'],
            // スポーツ紙
            ['name' => '日刊スポーツ',            'code' => 'NKS-M', 'delivery_time' => 'morning'],
            ['name' => 'スポーツニッポン',         'code' => 'SNP-M', 'delivery_time' => 'morning'],
            // 英字紙
            ['name' => 'The Japan Times',        'code' => 'JTM-M', 'delivery_time' => 'morning'],
            ['name' => 'The Japan News',         'code' => 'JNW-M', 'delivery_time' => 'morning'],
        ];

        foreach ($newspapers as $np) {
            NewspaperType::create([
                'shop_id'       => $shop->id,
                'name'          => $np['name'],
                'code'          => $np['code'],
                'delivery_time' => $np['delivery_time'],
            ]);
        }
    }
}
