<?php

namespace Tests\Feature;

use App\Events\DelivererStatusChanged;
use App\Events\DeliveryCompleted;
use App\Events\DeliveryPointLogged;
use App\Events\DeliveryStarted;
use App\Events\LocationUpdated;
use App\Events\SosAlertCreated;
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
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class BroadcastTest extends TestCase
{
    use RefreshDatabase;

    private User $deliverer;
    private User $admin;
    private Route $route;
    private RoutePoint $point;
    private Shop $shop;

    protected function setUp(): void
    {
        parent::setUp();

        $this->shop = Shop::create([
            'name'    => 'テスト店',
            'code'    => 'BCT',
            'address' => '山口市テスト1-1',
            'phone'   => '083-000-0000',
        ]);

        $this->admin = User::create([
            'shop_id'  => $this->shop->id,
            'name'     => '管理者',
            'email'    => 'admin@bc.jp',
            'password' => Hash::make('password'),
            'role'     => 'admin',
            'settings' => [],
        ]);

        $this->deliverer = User::create([
            'shop_id'  => $this->shop->id,
            'name'     => '配達員',
            'email'    => 'del@bc.jp',
            'password' => Hash::make('password'),
            'role'     => 'deliverer',
            'settings' => [],
        ]);

        $area = Area::create([
            'shop_id' => $this->shop->id,
            'name'    => 'A区域',
            'code'    => 'A',
        ]);

        $newspaper = NewspaperType::create([
            'shop_id'       => $this->shop->id,
            'name'          => '朝日朝刊',
            'code'          => 'ASA-M',
            'delivery_time' => 'morning',
        ]);

        $this->route = Route::create([
            'area_id'          => $area->id,
            'assigned_user_id' => $this->deliverer->id,
            'name'             => 'A朝刊',
            'delivery_time'    => 'morning',
            'total_points'     => 1,
        ]);

        $sub = Subscriber::create([
            'area_id'       => $area->id,
            'customer_code' => 'BC-001',
            'name'          => 'テスト 一郎',
            'address'       => '山口市テスト1-1-1',
        ]);

        SubscriberNewspaper::create([
            'subscriber_id'     => $sub->id,
            'newspaper_type_id' => $newspaper->id,
            'quantity'          => 1,
            'start_date'        => '2025-01-01',
        ]);

        $this->point = RoutePoint::create([
            'route_id'       => $this->route->id,
            'subscriber_id'  => $sub->id,
            'sequence_order' => 1,
        ]);
    }

    // ── DeliveryStarted + DelivererStatusChanged ─────────────────────────────

    public function test_start_delivery_dispatches_events(): void
    {
        Event::fake([DeliveryStarted::class, DelivererStatusChanged::class]);

        $this->actingAs($this->deliverer, 'sanctum')
            ->postJson('/api/v1/delivery/start', [
                'route_id'      => $this->route->id,
                'delivery_date' => now()->toDateString(),
                'delivery_time' => 'morning',
            ])
            ->assertStatus(201);

        Event::assertDispatched(DeliveryStarted::class, function ($e) {
            return $e->shopId === $this->shop->id
                && $e->userId === $this->deliverer->id
                && $e->routeId === $this->route->id;
        });

        Event::assertDispatched(DelivererStatusChanged::class, function ($e) {
            return $e->status === 'delivering'
                && $e->userId === $this->deliverer->id;
        });
    }

    // ── DeliveryPointLogged ───────────────────────────────────────────────────

    public function test_log_point_dispatches_event(): void
    {
        Event::fake([DeliveryPointLogged::class]);

        $delivery = Delivery::create([
            'route_id'      => $this->route->id,
            'user_id'       => $this->deliverer->id,
            'delivery_date' => now()->toDateString(),
            'delivery_time' => 'morning',
            'started_at'    => now(),
            'total_points'  => 1,
            'status'        => 'in_progress',
        ]);

        $this->actingAs($this->deliverer, 'sanctum')
            ->postJson('/api/v1/delivery/log', [
                'delivery_id'    => $delivery->id,
                'route_point_id' => $this->point->id,
                'status'         => 'delivered',
                'delivered_at'   => now()->toIso8601String(),
            ])
            ->assertStatus(201);

        Event::assertDispatched(DeliveryPointLogged::class, function ($e) use ($delivery) {
            return $e->deliveryId === $delivery->id
                && $e->routePointId === $this->point->id
                && $e->status === 'delivered';
        });
    }

    // ── DeliveryCompleted + DelivererStatusChanged ───────────────────────────

    public function test_complete_delivery_dispatches_events(): void
    {
        Event::fake([DeliveryCompleted::class, DelivererStatusChanged::class]);

        $delivery = Delivery::create([
            'route_id'       => $this->route->id,
            'user_id'        => $this->deliverer->id,
            'delivery_date'  => now()->toDateString(),
            'delivery_time'  => 'morning',
            'started_at'     => now()->subMinutes(20),
            'total_points'   => 1,
            'delivered_count'=> 1,
            'status'         => 'in_progress',
        ]);

        $this->actingAs($this->deliverer, 'sanctum')
            ->postJson("/api/v1/delivery/{$delivery->id}/complete")
            ->assertStatus(200);

        Event::assertDispatched(DeliveryCompleted::class, function ($e) use ($delivery) {
            return $e->deliveryId === $delivery->id
                && $e->deliveredCount === 1;
        });

        Event::assertDispatched(DelivererStatusChanged::class, function ($e) {
            return $e->status === 'online';
        });
    }

    // ── LocationUpdated ───────────────────────────────────────────────────────

    public function test_location_dispatches_event(): void
    {
        Event::fake([LocationUpdated::class]);

        $this->actingAs($this->deliverer, 'sanctum')
            ->postJson('/api/v1/delivery/location', [
                'lat'   => 34.186,
                'lng'   => 131.471,
                'speed' => 12.5,
            ])
            ->assertStatus(200);

        Event::assertDispatched(LocationUpdated::class, function ($e) {
            return $e->lat === 34.186
                && $e->lng === 131.471
                && $e->speed === 12.5
                && $e->userId === $this->deliverer->id;
        });
    }

    // ── SosAlertCreated ───────────────────────────────────────────────────────

    public function test_sos_trigger_dispatches_event(): void
    {
        Event::fake([SosAlertCreated::class]);

        $this->actingAs($this->deliverer, 'sanctum')
            ->postJson('/api/v1/delivery/sos', [
                'lat'   => 34.186,
                'lng'   => 131.471,
                'notes' => '転倒しました',
            ])
            ->assertStatus(201);

        Event::assertDispatched(SosAlertCreated::class, function ($e) {
            return $e->shopId === $this->shop->id
                && $e->userId === $this->deliverer->id
                && $e->notes === '転倒しました';
        });
    }

    // ── Event payload structure ───────────────────────────────────────────────

    public function test_events_broadcast_on_correct_channel(): void
    {
        $event = new DeliveryStarted(
            shopId:     42,
            deliveryId: 1,
            userId:     2,
            userName:   'テスト',
            routeId:    3,
            startedAt:  now()->toIso8601String(),
        );

        $channels = $event->broadcastOn();
        $this->assertCount(1, $channels);
        $this->assertEquals('private-shop.42', $channels[0]->name);
        $this->assertEquals('delivery.started', $event->broadcastAs());
    }

    public function test_location_event_payload(): void
    {
        $event = new LocationUpdated(
            shopId:    1,
            userId:    2,
            userName:  '配達員',
            lat:       34.186,
            lng:       131.471,
            speed:     10.0,
            updatedAt: '2026-04-04T06:00:00+09:00',
        );

        $payload = $event->broadcastWith();
        $this->assertArrayHasKey('lat', $payload);
        $this->assertArrayHasKey('lng', $payload);
        $this->assertArrayHasKey('speed', $payload);
        $this->assertEquals(34.186, $payload['lat']);
    }

    // ── Channel authorization ─────────────────────────────────────────────────

    public function test_shop_channel_auth_allows_own_shop_user(): void
    {
        // broadcasting/auth uses web middleware — use actingAs not withToken
        $res = $this->actingAs($this->deliverer, 'sanctum')
            ->postJson('/broadcasting/auth', [
                'channel_name' => "private-shop.{$this->shop->id}",
                'socket_id'    => '123.456',
            ]);

        $res->assertStatus(200);
    }

    public function test_shop_channel_auth_rejects_other_shop_user(): void
    {
        $otherShop = Shop::create([
            'name'    => '別の店',
            'code'    => 'OTH',
            'address' => '東京都1-1',
            'phone'   => '03-0000-0000',
        ]);

        $res = $this->actingAs($this->deliverer, 'sanctum')
            ->postJson('/broadcasting/auth', [
                'channel_name' => "private-shop.{$otherShop->id}",
                'socket_id'    => '123.456',
            ]);

        $res->assertStatus(403);
    }
}
