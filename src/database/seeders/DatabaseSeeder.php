<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            CompanySeeder::class,
            ShopSeeder::class,
            UserSeeder::class,
            AreaAndNewspaperSeeder::class,
            SubscriberSeeder::class,
            RouteSeeder::class,
        ]);
    }
}
