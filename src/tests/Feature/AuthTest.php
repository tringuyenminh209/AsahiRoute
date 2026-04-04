<?php

namespace Tests\Feature;

use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $deliverer;

    protected function setUp(): void
    {
        parent::setUp();

        $shop = Shop::create(['name' => 'テスト店', 'code' => 'TEST', 'address' => '山口市テスト1-1', 'phone' => '083-000-0000']);

        $this->admin = User::create([
            'shop_id'  => $shop->id,
            'name'     => '管理者',
            'email'    => 'admin@test.jp',
            'password' => Hash::make('password'),
            'role'     => 'admin',
            'settings' => ['lang' => 'ja', 'font_size' => 'medium', 'voice_guide' => false, 'dark_mode' => 'auto', 'onboarding_done' => true],
        ]);

        $this->deliverer = User::create([
            'shop_id'  => $shop->id,
            'name'     => '配達員',
            'email'    => 'deliverer@test.jp',
            'password' => Hash::make('password'),
            'role'     => 'deliverer',
            'settings' => ['lang' => 'ja', 'font_size' => 'medium', 'voice_guide' => false, 'dark_mode' => 'auto', 'onboarding_done' => false],
        ]);
    }

    public function test_login_success_admin(): void
    {
        $res = $this->postJson('/api/v1/auth/login', [
            'email'    => 'admin@test.jp',
            'password' => 'password',
        ]);

        $res->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => ['token', 'token_type', 'expires_at', 'user' => ['id', 'name', 'email', 'role']],
            ])
            ->assertJsonPath('data.user.role', 'admin');
    }

    public function test_login_success_deliverer(): void
    {
        $res = $this->postJson('/api/v1/auth/login', [
            'email'    => 'deliverer@test.jp',
            'password' => 'password',
        ]);

        $res->assertStatus(200)
            ->assertJsonPath('data.user.role', 'deliverer');
    }

    public function test_login_wrong_password(): void
    {
        $this->postJson('/api/v1/auth/login', [
            'email'    => 'admin@test.jp',
            'password' => 'wrong',
        ])->assertStatus(401)
          ->assertJsonPath('success', false);
    }

    public function test_login_unknown_email(): void
    {
        $this->postJson('/api/v1/auth/login', [
            'email'    => 'nobody@test.jp',
            'password' => 'password',
        ])->assertStatus(401);
    }

    public function test_me_returns_user(): void
    {
        $res = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/auth/me');

        $res->assertStatus(200)
            ->assertJsonPath('data.email', 'admin@test.jp')
            ->assertJsonPath('data.role', 'admin');
    }

    public function test_me_requires_auth(): void
    {
        $this->getJson('/api/v1/auth/me')->assertStatus(401);
    }

    public function test_logout(): void
    {
        $token = $this->admin->createToken('test')->plainTextToken;

        $this->withToken($token)
            ->postJson('/api/v1/auth/logout')
            ->assertStatus(200);

        // Token should be deleted from DB
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_update_settings(): void
    {
        $res = $this->actingAs($this->deliverer, 'sanctum')
            ->putJson('/api/v1/auth/settings', ['lang' => 'vi', 'font_size' => 'large']);

        $res->assertStatus(200)
            ->assertJsonPath('data.settings.lang', 'vi')
            ->assertJsonPath('data.settings.font_size', 'large');
    }
}
