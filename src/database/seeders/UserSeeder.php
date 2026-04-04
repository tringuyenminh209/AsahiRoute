<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $company  = Company::first();
        $shopNzg  = Shop::where('code', 'ASA-NZG')->first();
        $shopKbn  = Shop::where('code', 'ASA-KBN')->first();

        // ── 会社管理者（全店舗管理）────────────────────────────────────────────
        User::create([
            'company_id' => $company->id,
            'shop_id'    => null,
            'name'       => '本社 管理者',
            'email'      => 'hq@asa-osaka-west.jp',
            'phone'      => '06-6471-0010',
            'password'   => Hash::make('password'),
            'role'       => 'company_admin',
            'settings'   => [
                'lang'            => 'ja',
                'font_size'       => 'medium',
                'voice_guide'     => false,
                'dark_mode'       => 'auto',
                'onboarding_done' => true,
            ],
        ]);

        // ── 西淀川店 ─────────────────────────────────────────────────────────
        // 店舗管理者
        User::create([
            'shop_id'  => $shopNzg->id,
            'name'     => '田村 浩二',
            'email'    => 'admin@asa-nzg.jp',
            'phone'    => '090-1234-0001',
            'password' => Hash::make('password'),
            'role'     => 'admin',
            'settings' => [
                'lang'            => 'ja',
                'font_size'       => 'medium',
                'voice_guide'     => false,
                'dark_mode'       => 'auto',
                'onboarding_done' => true,
            ],
        ]);

        // 配達員①（日本語）
        User::create([
            'shop_id'  => $shopNzg->id,
            'name'     => '松田 誠',
            'email'    => 'matsuda@asa-nzg.jp',
            'phone'    => '090-1234-0002',
            'password' => Hash::make('password'),
            'role'     => 'deliverer',
            'settings' => [
                'lang'            => 'ja',
                'font_size'       => 'large',
                'voice_guide'     => true,
                'dark_mode'       => 'auto',
                'onboarding_done' => true,
            ],
        ]);

        // 配達員②（ベトナム語）
        User::create([
            'shop_id'  => $shopNzg->id,
            'name'     => 'Nguyen Van An',
            'email'    => 'nguyen@asa-nzg.jp',
            'phone'    => '090-1234-0003',
            'password' => Hash::make('password'),
            'role'     => 'deliverer',
            'settings' => [
                'lang'            => 'vi',
                'font_size'       => 'medium',
                'voice_guide'     => false,
                'dark_mode'       => 'auto',
                'onboarding_done' => false,
            ],
        ]);

        // 配達員③（中国語）
        User::create([
            'shop_id'  => $shopNzg->id,
            'name'     => 'Li Wei',
            'email'    => 'li.wei@asa-nzg.jp',
            'phone'    => '090-1234-0004',
            'password' => Hash::make('password'),
            'role'     => 'deliverer',
            'settings' => [
                'lang'            => 'zh',
                'font_size'       => 'medium',
                'voice_guide'     => false,
                'dark_mode'       => 'auto',
                'onboarding_done' => true,
            ],
        ]);

        // ── 此花店 ───────────────────────────────────────────────────────────
        // 店舗管理者
        User::create([
            'shop_id'  => $shopKbn->id,
            'name'     => '村上 恵子',
            'email'    => 'admin@asa-kbn.jp',
            'phone'    => '090-2345-0001',
            'password' => Hash::make('password'),
            'role'     => 'admin',
            'settings' => [
                'lang'            => 'ja',
                'font_size'       => 'medium',
                'voice_guide'     => false,
                'dark_mode'       => 'auto',
                'onboarding_done' => true,
            ],
        ]);

        // 配達員（此花）
        User::create([
            'shop_id'  => $shopKbn->id,
            'name'     => '佐藤 健',
            'email'    => 'sato@asa-kbn.jp',
            'phone'    => '090-2345-0002',
            'password' => Hash::make('password'),
            'role'     => 'deliverer',
            'settings' => [
                'lang'            => 'ja',
                'font_size'       => 'medium',
                'voice_guide'     => false,
                'dark_mode'       => 'auto',
                'onboarding_done' => true,
            ],
        ]);
    }
}
