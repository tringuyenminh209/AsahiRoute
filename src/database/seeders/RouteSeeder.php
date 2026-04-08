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
        $areaNZ2 = Area::where('code', 'NZ2')->first();
        $areaNZ1 = Area::where('code', 'NZ1')->first();
        $deliverer1 = User::where('email', 'matsuda@asa-nzg.jp')->first();
        $deliverer2 = User::where('email', 'nguyen@asa-nzg.jp')->first();
        $delivererTri = User::where('email', 'tri@asa-nzg.jp')->first();

        // 野里2区域 朝刊ルート（17軒 - 3番を除く）
        $routeNZ2 = Route::create([
            'area_id'                => $areaNZ2->id,
            'assigned_user_id'       => $deliverer1->id,
            'name'                   => '野里2区域 朝刊ルート',
            'delivery_time'          => 'morning',
            'total_points'           => 17,
            'estimated_duration_min' => 45,
            'estimated_distance_m'   => 2800,
        ]);

        // 配達順: 北西から南東へ蛇行（現実的な順番）
        $orderNZ2 = [
            'NZ2-016', // 6番2号（北西）
            'NZ2-017', // 6番5号
            'NZ2-015', // 5番7号
            'NZ2-014', // 5番4号
            'NZ2-013', // 5番1号
            'NZ2-001', // 1番1号
            'NZ2-002', // 1番4号
            'NZ2-003', // 1番7号
            'NZ2-005', // 2番5号
            'NZ2-006', // 2番9号
            'NZ2-004', // 2番2号（集合住宅）
            'NZ2-010', // 4番2号
            'NZ2-011', // 4番5号
            'NZ2-012', // 4番8号（集合住宅）
            'NZ2-019', // 7番4号
            'NZ2-018', // 7番1号（集合住宅）
            'NZ2-020', // 8番3号（南東）
        ];

        foreach ($orderNZ2 as $seq => $code) {
            $subscriber = Subscriber::where('customer_code', $code)->first();
            RoutePoint::create([
                'route_id'       => $routeNZ2->id,
                'subscriber_id'  => $subscriber->id,
                'sequence_order' => $seq + 1,
            ]);
        }

        // 野里2区域（2-3専用） 朝刊ルート（3軒） - TRI
        $routeNZ2Tri = Route::create([
            'area_id'                => $areaNZ2->id,
            'assigned_user_id'       => $delivererTri->id,
            'name'                   => '野里2区域(3番) 朝刊ルート',
            'delivery_time'          => 'morning',
            'total_points'           => 22,
            'estimated_duration_min' => 45,
            'estimated_distance_m'   => 3500,
        ]);

        $orderNZ2Tri = [
            'NZ2-009', // 3番6号
            'NZ2-008', // 3番3号
            'NZ2-007', // 3番1号
            'TRI-001', 'TRI-002', 'TRI-003', 'TRI-004', 'TRI-005',
            'TRI-006', 'TRI-007', 'TRI-008', 'TRI-009', 'TRI-010',
            'TRI-011', 'TRI-012', 'TRI-013', 'TRI-014', 'TRI-015',
            'TRI-016', 'TRI-017', 'TRI-018', 'TRI-019',
        ];

        foreach ($orderNZ2Tri as $seq => $code) {
            $subscriber = Subscriber::where('customer_code', $code)->first();
            RoutePoint::create([
                'route_id'       => $routeNZ2Tri->id,
                'subscriber_id'  => $subscriber->id,
                'sequence_order' => $seq + 1,
            ]);
        }

        // 野里1区域 朝刊ルート（5軒）
        $routeNZ1 = Route::create([
            'area_id'                => $areaNZ1->id,
            'assigned_user_id'       => $deliverer2->id,
            'name'                   => '野里1区域 朝刊ルート',
            'delivery_time'          => 'morning',
            'total_points'           => 14,
            'estimated_duration_min' => 35,
            'estimated_distance_m'   => 1900,
        ]);

        $subscribersNZ1 = Subscriber::where('area_id', $areaNZ1->id)
            ->orderBy('customer_code')
            ->get();

        foreach ($subscribersNZ1 as $seq => $subscriber) {
            RoutePoint::create([
                'route_id'       => $routeNZ1->id,
                'subscriber_id'  => $subscriber->id,
                'sequence_order' => $seq + 1,
            ]);
        }
    }
}
