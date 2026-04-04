<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\Shop;
use Illuminate\Database\Seeder;

class ShopSeeder extends Seeder
{
    public function run(): void
    {
        $company = Company::first();

        // 朝日新聞サービスアンカー 西淀川（メイン開発用）
        // 実在店舗: 34.7143554, 135.4559044（Google Maps確認済み）
        Shop::create([
            'company_id'      => $company->id,
            'name'            => '朝日新聞サービスアンカー 西淀川',
            'code'            => 'ASA-NZG',
            'address'         => '大阪府大阪市西淀川区竹島２丁目２番８号',
            'phone'           => '06-6471-0001',
            'emergency_phone' => '06-6471-0002',
            'lat'             => 34.7144,
            'lng'             => 135.4559,
        ]);

        // 朝日新聞サービスアンカー 此花（マルチショップ検証用）
        // 此花区: 西淀川の南隣エリア
        Shop::create([
            'company_id'      => $company->id,
            'name'            => '朝日新聞サービスアンカー 此花',
            'code'            => 'ASA-KBN',
            'address'         => '大阪府大阪市此花区梅香１丁目２番３号',
            'phone'           => '06-6462-0001',
            'emergency_phone' => '06-6462-0002',
            'lat'             => 34.6840,
            'lng'             => 135.4450,
        ]);
    }
}
