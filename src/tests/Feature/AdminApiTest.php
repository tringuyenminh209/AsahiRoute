<?php

namespace Tests\Feature;

use App\Models\Area;
use App\Models\NewspaperType;
use App\Models\Route;
use App\Models\RoutePoint;
use App\Models\Shop;
use App\Models\Subscriber;
use App\Models\SubscriberNewspaper;
use App\Models\Suspension;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminApiTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $deliverer;
    private Shop $shop;
    private Area $area;

    protected function setUp(): void
    {
        parent::setUp();

        $this->shop = Shop::create(['name' => 'テスト店', 'code' => 'TST', 'address' => '山口市テスト1-1', 'phone' => '083-000-0000']);

        $this->admin = User::create([
            'shop_id'  => $this->shop->id,
            'name'     => '管理者',
            'email'    => 'admin@test.jp',
            'password' => Hash::make('password'),
            'role'     => 'admin',
            'settings' => [],
        ]);

        $this->deliverer = User::create([
            'shop_id'  => $this->shop->id,
            'name'     => '配達員',
            'email'    => 'del@test.jp',
            'password' => Hash::make('password'),
            'role'     => 'deliverer',
            'settings' => [],
        ]);

        $this->area = Area::create([
            'shop_id' => $this->shop->id,
            'name'    => 'A区域',
            'code'    => 'A',
        ]);
    }

    // ── Area ─────────────────────────────────────────────────────────────────

    public function test_areas_list(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/areas')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.code', 'A');
    }

    public function test_area_create(): void
    {
        $res = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/admin/areas', ['name' => 'B区域', 'code' => 'B', 'color' => '#0000FF']);

        $res->assertStatus(201);
        $this->assertDatabaseHas('areas', ['code' => 'B', 'shop_id' => $this->shop->id]);
    }

    public function test_area_update(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/v1/admin/areas/{$this->area->id}", ['name' => 'A区域（更新）'])
            ->assertStatus(200)
            ->assertJsonPath('data.name', 'A区域（更新）');
    }

    public function test_area_delete(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/v1/admin/areas/{$this->area->id}")
            ->assertStatus(204);

        $this->assertDatabaseMissing('areas', ['id' => $this->area->id, 'deleted_at' => null]);
    }

    public function test_admin_routes_blocked_for_deliverer(): void
    {
        $this->actingAs($this->deliverer, 'sanctum')
            ->getJson('/api/v1/admin/areas')
            ->assertStatus(403);
    }

    // ── Subscribers ───────────────────────────────────────────────────────────

    public function test_subscribers_list(): void
    {
        Subscriber::create([
            'area_id'       => $this->area->id,
            'customer_code' => 'T-001',
            'name'          => '田中 太郎',
            'address'       => '山口市テスト1-1-1',
        ]);

        $res = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/subscribers');

        $res->assertStatus(200)
            ->assertJsonStructure(['data', 'meta' => ['current_page', 'total']]);
    }

    public function test_subscriber_create(): void
    {
        $res = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/admin/subscribers', [
                'area_id'       => $this->area->id,
                'customer_code' => 'NEW-001',
                'name'          => '新規 登録',
                'address'       => '山口市新規1-1-1',
            ]);

        $res->assertStatus(201);
        $this->assertDatabaseHas('subscribers', ['customer_code' => 'NEW-001']);
    }

    public function test_subscriber_update(): void
    {
        $sub = Subscriber::create([
            'area_id'       => $this->area->id,
            'customer_code' => 'T-001',
            'name'          => '旧名前',
            'address'       => '旧住所',
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/v1/admin/subscribers/{$sub->id}", ['name' => '新名前'])
            ->assertStatus(200)
            ->assertJsonPath('data.name', '新名前');
    }

    public function test_subscriber_delete(): void
    {
        $sub = Subscriber::create([
            'area_id'       => $this->area->id,
            'customer_code' => 'T-DEL',
            'name'          => '削除テスト',
            'address'       => '住所',
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/v1/admin/subscribers/{$sub->id}")
            ->assertStatus(204);
    }

    public function test_subscriber_search(): void
    {
        Subscriber::create(['area_id' => $this->area->id, 'customer_code' => 'S-001', 'name' => '田中 太郎', 'address' => '山口市1-1']);
        Subscriber::create(['area_id' => $this->area->id, 'customer_code' => 'S-002', 'name' => '鈴木 花子', 'address' => '山口市2-2']);

        $res = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/subscribers?q=田中');

        $res->assertStatus(200);
        $data = $res->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals('田中 太郎', $data[0]['name']);
    }

    // ── Users ─────────────────────────────────────────────────────────────────

    public function test_user_list(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/users')
            ->assertStatus(200)
            ->assertJsonStructure(['data']);
    }

    public function test_user_create(): void
    {
        $res = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/admin/users', [
                'name'     => '新配達員',
                'email'    => 'new_del@test.jp',
                'password' => 'password123',
                'role'     => 'deliverer',
            ]);

        $res->assertStatus(201)
            ->assertJsonPath('data.role', 'deliverer');

        $this->assertDatabaseHas('users', ['email' => 'new_del@test.jp']);
    }

    public function test_user_cannot_delete_self(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/v1/admin/users/{$this->admin->id}")
            ->assertStatus(403);
    }

    // ── Suspensions ───────────────────────────────────────────────────────────

    public function test_suspension_create(): void
    {
        $sub = Subscriber::create([
            'area_id'       => $this->area->id,
            'customer_code' => 'T-SUS',
            'name'          => '留守テスト',
            'address'       => '住所',
        ]);

        $res = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/admin/suspensions', [
                'subscriber_id' => $sub->id,
                'start_date'    => now()->toDateString(),
                'end_date'      => now()->addDays(3)->toDateString(),
                'reason'        => '旅行',
            ]);

        $res->assertStatus(201);
        $this->assertDatabaseHas('suspensions', ['subscriber_id' => $sub->id]);
    }

    public function test_suspension_calendar(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/suspensions/calendar?year=2026&month=4')
            ->assertStatus(200)
            ->assertJsonStructure(['data' => ['year', 'month', 'calendar']]);
    }

    // ── Dashboard ─────────────────────────────────────────────────────────────

    public function test_dashboard_summary(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/dashboard/summary')
            ->assertStatus(200)
            ->assertJsonStructure(['data' => ['date', 'deliveries', 'points', 'active_suspensions']]);
    }

    public function test_dashboard_today(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/dashboard/today')
            ->assertStatus(200)
            ->assertJsonStructure(['data' => ['deliverers', 'updated_at']]);
    }

    // ── Routes (admin) ───────────────────────────────────────────────────────

    public function test_admin_routes_list(): void
    {
        Route::create([
            'area_id'          => $this->area->id,
            'assigned_user_id' => $this->deliverer->id,
            'name'             => 'A朝刊',
            'delivery_time'    => 'morning',
            'total_points'     => 0,
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/routes')
            ->assertStatus(200)
            ->assertJsonStructure(['data', 'meta']);
    }

    public function test_newspaper_types_list(): void
    {
        NewspaperType::create(['shop_id' => $this->shop->id, 'name' => '朝日朝刊', 'code' => 'ASA-M', 'delivery_time' => 'morning']);

        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/newspaper-types')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_reports_daily(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/reports/daily')
            ->assertStatus(200)
            ->assertJsonStructure(['data' => ['date', 'summary', 'deliveries']]);
    }

    public function test_audit_logs_list(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/audit-logs')
            ->assertStatus(200)
            ->assertJsonStructure(['data', 'meta']);
    }
}
