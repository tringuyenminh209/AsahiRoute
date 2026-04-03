<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\UpdateSettingsRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends ApiController
{
    /**
     * POST /api/v1/auth/login
     * トークン発行 + ユーザー情報 + settings を返す
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)
            ->whereNull('deleted_at')
            ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return \App\Http\Responses\ApiResponse::error(
                'INVALID_CREDENTIALS',
                'メールアドレスまたはパスワードが正しくありません',
                401
            );
        }

        $deviceName = $request->device_name ?? ($request->header('User-Agent') ?? 'unknown');

        // Mobile は 30日、Admin は 8時間
        $expiresAt = $user->isAdmin()
            ? now()->addHours(8)
            : now()->addDays(30);

        $token = $user->createToken($deviceName, ['*'], $expiresAt)->plainTextToken;

        return $this->success([
            'token'      => $token,
            'token_type' => 'Bearer',
            'expires_at' => $expiresAt->toIso8601String(),
            'user'       => $this->formatUser($user),
        ], 'ログインしました');
    }

    /**
     * POST /api/v1/auth/logout
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return $this->success(null, 'ログアウトしました');
    }

    /**
     * GET /api/v1/auth/me
     */
    public function me(Request $request): JsonResponse
    {
        return $this->success($this->formatUser($request->user()));
    }

    /**
     * PUT /api/v1/auth/settings
     */
    public function updateSettings(UpdateSettingsRequest $request): JsonResponse
    {
        $user = $request->user();

        $currentSettings = $user->settings ?? [];
        $newSettings = array_merge($currentSettings, $request->validated());

        $user->update(['settings' => $newSettings]);

        return $this->success([
            'settings' => $user->fresh()->settings,
        ], '設定を更新しました');
    }

    private function formatUser(User $user): array
    {
        return [
            'id'       => $user->id,
            'shop_id'  => $user->shop_id,
            'name'     => $user->name,
            'email'    => $user->email,
            'phone'    => $user->phone,
            'role'     => $user->role,
            'settings' => $user->settings ?? [
                'lang'            => 'ja',
                'font_size'       => 'medium',
                'voice_guide'     => false,
                'dark_mode'       => 'auto',
                'onboarding_done' => false,
            ],
        ];
    }
}
