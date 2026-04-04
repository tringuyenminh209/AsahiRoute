<?php

namespace Database\Seeders;

use App\Models\Company;
use Illuminate\Database\Seeder;

class CompanySeeder extends Seeder
{
    public function run(): void
    {
        // 朝日新聞サービスアンカー（ASA）の大阪西部エリア運営会社
        Company::create([
            'name'    => '朝日新聞サービスアンカー株式会社 大阪西部',
            'code'    => 'ASA-OSAKA-W',
            'address' => '大阪府大阪市西淀川区竹島２丁目２番８号',
            'phone'   => '06-6471-0000',
            'email'   => 'info@asa-osaka-west.jp',
            'website' => 'https://www.asahi.com/area/osaka/',
        ]);
    }
}
