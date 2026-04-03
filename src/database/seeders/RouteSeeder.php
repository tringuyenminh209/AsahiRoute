<?php

namespace Database\Seeders;

use App\Models\Area;
use App\Models\Route;
use App\Models\RoutePoint;
use App\Models\Subscriber;
use App\Models\User;
use Illuminate\Database\Seeder;

class RouteSeeder extends Seeder
{
    public function run(): void
    {
        $areaA = Area::where('code', 'A')->first();
        $areaB = Area::where('code', 'B')->first();
        $deliverer1 = User::where('email', 'sato@asa-yama.jp')->first();
        $deliverer2 = User::where('email', 'nguyen@asa-yama.jp')->first();

        // A区域 朝刊ルート
        $routeA = Route::create([
            'area_id'               => $areaA->id,
            'assigned_user_id'      => $deliverer1->id,
            'name'                  => 'A区域 朝刊ルート',
            'delivery_time'         => 'morning',
            'total_points'          => 15,
            'estimated_duration_min' => 85,
            'estimated_distance_m'  => 12500,
        ]);

        $subscribersA = Subscriber::where('area_id', $areaA->id)
            ->orderBy('customer_code')
            ->get();

        foreach ($subscribersA as $seq => $subscriber) {
            RoutePoint::create([
                'route_id'       => $routeA->id,
                'subscriber_id'  => $subscriber->id,
                'sequence_order' => $seq + 1,
            ]);
        }

        // B区域 朝刊ルート
        $routeB = Route::create([
            'area_id'               => $areaB->id,
            'assigned_user_id'      => $deliverer2->id,
            'name'                  => 'B区域 朝刊ルート',
            'delivery_time'         => 'morning',
            'total_points'          => 10,
            'estimated_duration_min' => 60,
            'estimated_distance_m'  => 8000,
        ]);

        $subscribersB = Subscriber::where('area_id', $areaB->id)
            ->orderBy('customer_code')
            ->get();

        foreach ($subscribersB as $seq => $subscriber) {
            RoutePoint::create([
                'route_id'       => $routeB->id,
                'subscriber_id'  => $subscriber->id,
                'sequence_order' => $seq + 1,
            ]);
        }
    }
}
