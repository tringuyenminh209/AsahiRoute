<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            ShopSeeder::class,
            UserSeeder::class,
            AreaAndNewspaperSeeder::class,
            SubscriberSeeder::class,
            RouteSeeder::class,
        ]);
    }
}
