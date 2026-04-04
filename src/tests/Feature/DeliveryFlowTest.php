<?php

namespace Tests\Feature;

use App\Models\Area;
use App\Models\Delivery;
use App\Models\NewspaperType;
use App\Models\Route;
use App\Models\RoutePoint;
use App\Models\Shop;
use App\Models\Subscriber;
use App\Models\SubscriberNewspaper;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class DeliveryFlowTest extends TestCase
{
    use RefreshDatabase;

    private User $deliverer;
    private Route $route;
    private RoutePoint $point1;
    private RoutePoint $point2;

    protected function setUp(): void
    {
        parent::setUp();

        $shop = Shop::create(['name' => 'テスト店', 'code' => 'TEST', 'address' => '山口市テスト1-1', 'phone' => '083-000-0000']);

        $this->deliverer = User::create([
            'shop_id'  => $shop->id,
            'name'     => '配達員',
            'email'    => 'del@test.jp',
            'password' => Hash::make('password'),
            'role'     => 'deliverer',
            'settings' => [],
        ]);

        $area = Area::create(['shop_id' => $shop->id, 'name' => 'A区域', 'code' => 'A']);

        $newspaper = NewspaperType::create([
            'shop_id'       => $shop->id,
            'name'          => '朝日新聞朝刊',
            'code'          => 'ASA-M',
            'delivery_time' => 'morning',
        ]);

        $this->route = Route::create([
            'area_id'          => $area->id,
            'assigned_user_id' => $this->deliverer->id,
            'name'             => 'A区域 朝刊',
            'delivery_time'    => 'morning',
            'total_points'     => 2,
        ]);

        foreach ([1, 2] as $seq) {
            $sub = Subscriber::create([
                'area_id'       => $area->id,
                'customer_code' => "T-00{$seq}",
                'name'          => "テスト {$seq}",
                'address'       => "山口市テスト{$seq}-1-1",
            ]);
            SubscriberNewspaper::create([
                'subscriber_id'     => $sub->id,
                'newspaper_type_id' => $newspaper->id,
                'quantity'          => 1,
                'start_date'        => '2025-01-01',
            ]);
            $point = RoutePoint::create([
                'route_id'       => $this->route->id,
                'subscriber_id'  => $sub->id,
                'sequence_order' => $seq,
            ]);
            if ($seq === 1) $this->point1 = $point;
            if ($seq === 2) $this->point2 = $point;
        }
    }

    public function test_my_routes_returns_assigned_route(): void
    {
        $res = $this->actingAs($this->deliverer, 'sanctum')
            ->getJson('/api/v1/delivery/my-routes?date=' . now()->toDateString());

        $res->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $this->route->id)
            ->assertJsonPath('data.0.total_points', 2)
            ->assertJsonStructure(['data' => [['id', 'name', 'points']]]);
    }

    public function test_admin_can_also_access_delivery_routes(): void
    {
        // EnsureIsDeliverer middleware allows admin role too (by design)
        $shop = Shop::first();
        $admin = User::create([
            'shop_id'  => $shop->id,
            'name'     => '管理者',
            'email'    => 'adm@test.jp',
            'password' => 'x',
            'role'     => 'admin',
            'settings' => [],
        ]);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/delivery/my-routes')
            ->assertStatus(200);
    }

    public function test_start_delivery_creates_session(): void
    {
        $res = $this->actingAs($this->deliverer, 'sanctum')
            ->postJson('/api/v1/delivery/start', [
                'route_id'      => $this->route->id,
                'delivery_date' => now()->toDateString(),
                'delivery_time' => 'morning',
            ]);

        $res->assertStatus(201)
            ->assertJsonStructure(['data' => ['id', 'route_id', 'total_points', 'status']])
            ->assertJsonPath('data.status', 'in_progress');

        $this->assertDatabaseHas('deliveries', [
            'route_id' => $this->route->id,
            'status'   => 'in_progress',
        ]);
    }

    public function test_start_delivery_returns_existing_if_duplicate(): void
    {
        $payload = [
            'route_id'      => $this->route->id,
            'delivery_date' => now()->toDateString(),
            'delivery_time' => 'morning',
        ];

        $this->actingAs($this->deliverer, 'sanctum')->postJson('/api/v1/delivery/start', $payload);
        $res = $this->actingAs($this->deliverer, 'sanctum')->postJson('/api/v1/delivery/start', $payload);

        $res->assertStatus(200); // 200 = resume existing
        $this->assertDatabaseCount('deliveries', 1);
    }

    public function test_log_point_delivered(): void
    {
        $delivery = Delivery::create([
            'route_id'      => $this->route->id,
            'user_id'       => $this->deliverer->id,
            'delivery_date' => now()->toDateString(),
            'delivery_time' => 'morning',
            'started_at'    => now(),
            'total_points'  => 2,
            'status'        => 'in_progress',
        ]);

        $res = $this->actingAs($this->deliverer, 'sanctum')
            ->postJson('/api/v1/delivery/log', [
                'delivery_id'    => $delivery->id,
                'route_point_id' => $this->point1->id,
                'status'         => 'delivered',
                'delivered_at'   => now()->toIso8601String(),
            ]);

        $res->assertStatus(201)
            ->assertJsonPath('data.status', 'delivered');

        $this->assertDatabaseHas('delivery_logs', [
            'delivery_id'    => $delivery->id,
            'route_point_id' => $this->point1->id,
            'status'         => 'delivered',
        ]);

        $delivery->refresh();
        $this->assertEquals(1, $delivery->delivered_count);
    }

    public function test_log_point_duplicate_returns_conflict(): void
    {
        $delivery = Delivery::create([
            'route_id'      => $this->route->id,
            'user_id'       => $this->deliverer->id,
            'delivery_date' => now()->toDateString(),
            'delivery_time' => 'morning',
            'started_at'    => now(),
            'total_points'  => 2,
            'status'        => 'in_progress',
        ]);

        $payload = [
            'delivery_id'    => $delivery->id,
            'route_point_id' => $this->point1->id,
            'status'         => 'delivered',
            'delivered_at'   => now()->toIso8601String(),
        ];

        $this->actingAs($this->deliverer, 'sanctum')->postJson('/api/v1/delivery/log', $payload);
        $this->actingAs($this->deliverer, 'sanctum')->postJson('/api/v1/delivery/log', $payload)
            ->assertStatus(409);
    }

    public function test_complete_delivery(): void
    {
        $delivery = Delivery::create([
            'route_id'       => $this->route->id,
            'user_id'        => $this->deliverer->id,
            'delivery_date'  => now()->toDateString(),
            'delivery_time'  => 'morning',
            'started_at'     => now()->subMinutes(30),
            'total_points'   => 2,
            'delivered_count'=> 2,
            'status'         => 'in_progress',
        ]);

        $res = $this->actingAs($this->deliverer, 'sanctum')
            ->postJson("/api/v1/delivery/{$delivery->id}/complete");

        $res->assertStatus(200)
            ->assertJsonStructure(['data' => ['delivery_id', 'counts', 'completion_rate', 'duration_minutes']]);

        $this->assertDatabaseHas('deliveries', [
            'id'     => $delivery->id,
            'status' => 'completed',
        ]);
    }
}
