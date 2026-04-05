<?php

namespace Tests\Feature;

use App\Models\Area;
use App\Models\Route;
use App\Models\Shift;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ShiftTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $deliverer;
    private Shop $shop;
    private Route $route;

    protected function setUp(): void
    {
        parent::setUp();

        $this->shop = Shop::create([
            'name'    => 'シフトテスト店',
            'code'    => 'SFT-TST',
            'address' => '大阪府テスト1-1',
            'phone'   => '06-0000-1111',
        ]);

        $this->admin = User::create([
            'shop_id'  => $this->shop->id,
            'name'     => '管理者',
            'email'    => 'admin@sft.jp',
            'password' => Hash::make('password'),
            'role'     => 'admin',
            'settings' => [],
        ]);

        $this->deliverer = User::create([
            'shop_id'  => $this->shop->id,
            'name'     => '配達員',
            'email'    => 'del@sft.jp',
            'password' => Hash::make('password'),
            'role'     => 'deliverer',
            'settings' => [],
        ]);

        $area = Area::create([
            'shop_id' => $this->shop->id,
            'name'    => 'A区域',
            'code'    => 'A',
        ]);

        $this->route = Route::create([
            'shop_id'      => $this->shop->id,
            'area_id'      => $area->id,
            'name'         => 'テストルート',
            'delivery_time'=> 'morning',
        ]);
    }

    private function makeShift(array $overrides = []): Shift
    {
        return Shift::create(array_merge([
            'user_id'    => $this->deliverer->id,
            'route_id'   => $this->route->id,
            'shift_date' => '2026-05-01',
            'shift_type' => 'morning',
            'status'     => 'scheduled',
        ], $overrides));
    }

    // ── List ──────────────────────────────────────────────────────────────────

    public function test_admin_can_list_shifts(): void
    {
        $this->makeShift();
        $this->makeShift(['shift_date' => '2026-05-02', 'shift_type' => 'evening']);

        $res = $this->withToken($this->admin->createToken('t')->plainTextToken)
            ->getJson('/api/v1/admin/shifts');

        $res->assertOk()->assertJsonPath('success', true);
        $this->assertCount(2, $res->json('data'));
    }

    public function test_shifts_list_can_filter_by_date_range(): void
    {
        $this->makeShift(['shift_date' => '2026-05-01']);
        $this->makeShift(['shift_date' => '2026-05-15']);
        $this->makeShift(['shift_date' => '2026-05-31']);

        $res = $this->withToken($this->admin->createToken('t')->plainTextToken)
            ->getJson('/api/v1/admin/shifts?from=2026-05-10&to=2026-05-20');

        $res->assertOk();
        $this->assertCount(1, $res->json('data'));
    }

    public function test_deliverer_cannot_access_shifts(): void
    {
        $this->withToken($this->deliverer->createToken('t')->plainTextToken)
            ->getJson('/api/v1/admin/shifts')
            ->assertForbidden();
    }

    // ── Create ────────────────────────────────────────────────────────────────

    public function test_admin_can_create_shift(): void
    {
        $res = $this->withToken($this->admin->createToken('t')->plainTextToken)
            ->postJson('/api/v1/admin/shifts', [
                'user_id'    => $this->deliverer->id,
                'route_id'   => $this->route->id,
                'shift_date' => '2026-05-10',
                'shift_type' => 'morning',
            ]);

        $res->assertCreated();
        $this->assertDatabaseHas('shifts', [
            'user_id'    => $this->deliverer->id,
            'shift_date' => '2026-05-10',
            'status'     => 'scheduled',
        ]);
    }

    public function test_create_shift_requires_shift_type(): void
    {
        $this->withToken($this->admin->createToken('t')->plainTextToken)
            ->postJson('/api/v1/admin/shifts', [
                'user_id'    => $this->deliverer->id,
                'route_id'   => $this->route->id,
                'shift_date' => '2026-05-10',
                // shift_type missing
            ])
            ->assertUnprocessable();
    }

    // ── Update ────────────────────────────────────────────────────────────────

    public function test_admin_can_update_shift_status(): void
    {
        $shift = $this->makeShift();

        $res = $this->withToken($this->admin->createToken('t')->plainTextToken)
            ->putJson("/api/v1/admin/shifts/{$shift->id}", [
                'status' => 'confirmed',
            ]);

        $res->assertOk()->assertJsonPath('data.status', 'confirmed');
    }

    public function test_admin_can_update_shift_date(): void
    {
        $shift = $this->makeShift(['shift_date' => '2026-05-01']);

        $res = $this->withToken($this->admin->createToken('t')->plainTextToken)
            ->putJson("/api/v1/admin/shifts/{$shift->id}", [
                'shift_date' => '2026-05-08',
            ]);

        $res->assertOk();
        $this->assertDatabaseHas('shifts', ['id' => $shift->id, 'shift_date' => '2026-05-08']);
    }

    // ── Cancel (Delete) ───────────────────────────────────────────────────────

    public function test_admin_can_cancel_shift(): void
    {
        $shift = $this->makeShift();

        $this->withToken($this->admin->createToken('t')->plainTextToken)
            ->deleteJson("/api/v1/admin/shifts/{$shift->id}")
            ->assertNoContent();

        $this->assertDatabaseHas('shifts', [
            'id'     => $shift->id,
            'status' => 'cancelled',
        ]);
    }

    // ── Calendar ─────────────────────────────────────────────────────────────

    public function test_calendar_returns_shifts_grouped_by_date(): void
    {
        $this->makeShift(['shift_date' => '2026-05-01']);
        $this->makeShift(['shift_date' => '2026-05-01', 'shift_type' => 'evening']);
        $this->makeShift(['shift_date' => '2026-05-15']);

        $res = $this->withToken($this->admin->createToken('t')->plainTextToken)
            ->getJson('/api/v1/admin/shifts/calendar?year=2026&month=5');

        $res->assertOk()
            ->assertJsonPath('data.year', 2026)
            ->assertJsonPath('data.month', 5);

        $calendar = $res->json('data.calendar');
        $this->assertArrayHasKey('2026-05-01', $calendar);
        $this->assertCount(2, $calendar['2026-05-01']);
        $this->assertArrayHasKey('2026-05-15', $calendar);
    }

    public function test_calendar_requires_year_and_month(): void
    {
        $this->withToken($this->admin->createToken('t')->plainTextToken)
            ->getJson('/api/v1/admin/shifts/calendar')
            ->assertUnprocessable();
    }
}
