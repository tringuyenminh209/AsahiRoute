<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CompanyAdminTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;
    private Company $otherCompany;
    private User $companyAdmin;
    private User $otherAdmin;
    private Shop $shop;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create([
            'name'    => 'テスト新聞社',
            'code'    => 'TEST-CO',
            'address' => '大阪市テスト1-1',
            'phone'   => '06-0000-0001',
        ]);

        $this->otherCompany = Company::create([
            'name'    => '他社新聞',
            'code'    => 'OTHER-CO',
            'address' => '東京都テスト2-2',
            'phone'   => '03-0000-0002',
        ]);

        $this->shop = Shop::create([
            'company_id' => $this->company->id,
            'name'       => 'テスト西淀川',
            'code'       => 'TST-NZG',
            'address'    => '大阪府大阪市西淀川区テスト1-1',
            'phone'      => '06-0001-0001',
        ]);

        $this->companyAdmin = User::create([
            'company_id' => $this->company->id,
            'shop_id'    => null,
            'name'       => '会社管理者',
            'email'      => 'hq@test.jp',
            'password'   => Hash::make('password'),
            'role'       => 'company_admin',
            'settings'   => [],
        ]);

        // Another company's admin (should not see our data)
        $this->otherAdmin = User::create([
            'company_id' => $this->otherCompany->id,
            'shop_id'    => null,
            'name'       => '他社管理者',
            'email'      => 'hq@other.jp',
            'password'   => Hash::make('password'),
            'role'       => 'company_admin',
            'settings'   => [],
        ]);
    }

    // ── Dashboard ────────────────────────────────────────────────────────────

    public function test_company_admin_can_access_dashboard(): void
    {
        $res = $this->withToken($this->companyAdmin->createToken('t')->plainTextToken)
            ->getJson('/api/v1/company/dashboard');

        $res->assertOk()->assertJsonPath('success', true);
    }

    public function test_non_company_admin_cannot_access_dashboard(): void
    {
        $shopAdmin = User::create([
            'shop_id'  => $this->shop->id,
            'name'     => '店舗管理者',
            'email'    => 'sadmin@test.jp',
            'password' => Hash::make('password'),
            'role'     => 'admin',
            'settings' => [],
        ]);

        $this->withToken($shopAdmin->createToken('t')->plainTextToken)
            ->getJson('/api/v1/company/dashboard')
            ->assertForbidden();
    }

    public function test_unauthenticated_cannot_access_dashboard(): void
    {
        $this->getJson('/api/v1/company/dashboard')->assertUnauthorized();
    }

    // ── Shop List ────────────────────────────────────────────────────────────

    public function test_company_admin_sees_only_own_shops(): void
    {
        // Create a shop for the other company
        Shop::create([
            'company_id' => $this->otherCompany->id,
            'name'       => '他社の店舗',
            'code'       => 'OTHER-SHOP',
            'address'    => '東京テスト1-1',
            'phone'      => '03-9999-9999',
        ]);

        $res = $this->withToken($this->companyAdmin->createToken('t')->plainTextToken)
            ->getJson('/api/v1/company/shops');

        $res->assertOk();
        $data = $res->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals('TST-NZG', $data[0]['code']);
    }

    public function test_other_company_admin_cannot_see_our_shops(): void
    {
        $res = $this->withToken($this->otherAdmin->createToken('t')->plainTextToken)
            ->getJson('/api/v1/company/shops');

        $res->assertOk();
        $this->assertCount(0, $res->json('data'));
    }

    // ── Shop Create ──────────────────────────────────────────────────────────

    public function test_company_admin_can_create_shop(): void
    {
        $res = $this->withToken($this->companyAdmin->createToken('t')->plainTextToken)
            ->postJson('/api/v1/company/shops', [
                'name'    => '新規店舗',
                'code'    => 'NEW-SHOP',
                'address' => '大阪府テスト3-3',
                'phone'   => '06-0002-0002',
            ]);

        $res->assertCreated()->assertJsonPath('data.code', 'NEW-SHOP');
        $this->assertDatabaseHas('shops', [
            'code'       => 'NEW-SHOP',
            'company_id' => $this->company->id,
        ]);
    }

    public function test_create_shop_requires_all_fields(): void
    {
        $this->withToken($this->companyAdmin->createToken('t')->plainTextToken)
            ->postJson('/api/v1/company/shops', ['name' => '不完全'])
            ->assertUnprocessable();
    }

    // ── Shop Update ──────────────────────────────────────────────────────────

    public function test_company_admin_can_update_own_shop(): void
    {
        $res = $this->withToken($this->companyAdmin->createToken('t')->plainTextToken)
            ->putJson("/api/v1/company/shops/{$this->shop->id}", [
                'name' => '更新後の店舗名',
            ]);

        $res->assertOk()->assertJsonPath('data.name', '更新後の店舗名');
    }

    public function test_company_admin_cannot_update_other_company_shop(): void
    {
        $otherShop = Shop::create([
            'company_id' => $this->otherCompany->id,
            'name'       => '他社店舗',
            'code'       => 'OTH-SHOP2',
            'address'    => '東京1-1',
            'phone'      => '03-1111-1111',
        ]);

        $this->withToken($this->companyAdmin->createToken('t')->plainTextToken)
            ->putJson("/api/v1/company/shops/{$otherShop->id}", ['name' => '乗っ取り'])
            ->assertForbidden();
    }

    // ── Shop Delete ──────────────────────────────────────────────────────────

    public function test_company_admin_can_delete_own_shop(): void
    {
        $this->withToken($this->companyAdmin->createToken('t')->plainTextToken)
            ->deleteJson("/api/v1/company/shops/{$this->shop->id}")
            ->assertNoContent();

        $this->assertSoftDeleted('shops', ['id' => $this->shop->id]);
    }

    // ── Shop Users ───────────────────────────────────────────────────────────

    public function test_company_admin_can_list_shop_users(): void
    {
        User::create([
            'shop_id'  => $this->shop->id,
            'name'     => '配達員1',
            'email'    => 'del1@test.jp',
            'password' => Hash::make('password'),
            'role'     => 'deliverer',
            'settings' => [],
        ]);

        $res = $this->withToken($this->companyAdmin->createToken('t')->plainTextToken)
            ->getJson("/api/v1/company/shops/{$this->shop->id}/users");

        $res->assertOk();
        $this->assertGreaterThanOrEqual(1, count($res->json('data')));
    }
}
