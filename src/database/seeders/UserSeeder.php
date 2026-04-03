<?php

namespace Database\Seeders;

use App\Models\Shop;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $shop = Shop::first();

        User::create([
            'shop_id'  => $shop->id,
            'name'     => '山田 太郎',
            'email'    => 'admin@asa-yama.jp',
            'phone'    => '090-0001-0001',
            'password' => Hash::make('password'),
            'role'     => 'admin',
            'settings' => [
                'lang'             => 'ja',
                'font_size'        => 'medium',
                'voice_guide'      => false,
                'dark_mode'        => 'auto',
                'onboarding_done'  => true,
            ],
        ]);

        User::create([
            'shop_id'  => $shop->id,
            'name'     => '佐藤 健',
            'email'    => 'sato@asa-yama.jp',
            'phone'    => '090-0002-0001',
            'password' => Hash::make('password'),
            'role'     => 'deliverer',
            'settings' => [
                'lang'             => 'ja',
                'font_size'        => 'large',
                'voice_guide'      => true,
                'dark_mode'        => 'auto',
                'onboarding_done'  => true,
            ],
        ]);

        User::create([
            'shop_id'  => $shop->id,
            'name'     => 'Nguyen Van An',
            'email'    => 'nguyen@asa-yama.jp',
            'phone'    => '090-0003-0001',
            'password' => Hash::make('password'),
            'role'     => 'deliverer',
            'settings' => [
                'lang'             => 'vi',
                'font_size'        => 'medium',
                'voice_guide'      => false,
                'dark_mode'        => 'auto',
                'onboarding_done'  => false,
            ],
        ]);
    }
}
