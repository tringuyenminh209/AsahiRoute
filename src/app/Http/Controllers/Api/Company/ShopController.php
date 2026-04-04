<?php

namespace App\Http\Controllers\Api\Company;

use App\Http\Controllers\Api\ApiController;
use App\Http\Responses\ApiResponse;
use App\Models\Shop;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShopController extends ApiController
{
    /** GET /company/shops — 傘下の店舗一覧 */
    public function index(Request $request): JsonResponse
    {
        $shops = Shop::where('company_id', $request->user()->company_id)
            ->withCount(['users', 'areas'])
            ->orderBy('code')
            ->get();

        return $this->success($shops);
    }

    /** POST /company/shops — 新規店舗作成 */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'            => ['required', 'string', 'max:100'],
            'code'            => ['required', 'string', 'max:20', 'unique:shops,code'],
            'address'         => ['required', 'string', 'max:255'],
            'phone'           => ['required', 'string', 'max:20'],
            'emergency_phone' => ['nullable', 'string', 'max:20'],
            'lat'             => ['nullable', 'numeric'],
            'lng'             => ['nullable', 'numeric'],
        ]);

        $shop = Shop::create(array_merge($data, [
            'company_id' => $request->user()->company_id,
        ]));

        return $this->created($shop);
    }

    /** GET /company/shops/{shop} */
    public function show(Request $request, Shop $shop): JsonResponse
    {
        $this->authorizeShop($request, $shop);

        $shop->loadCount(['users', 'areas']);
        $shop->load(['areas', 'users' => fn ($q) => $q->where('role', 'admin')->select('id', 'shop_id', 'name', 'email', 'phone')]);

        return $this->success($shop);
    }

    /** PUT /company/shops/{shop} */
    public function update(Request $request, Shop $shop): JsonResponse
    {
        $this->authorizeShop($request, $shop);

        $data = $request->validate([
            'name'            => ['sometimes', 'string', 'max:100'],
            'address'         => ['sometimes', 'string', 'max:255'],
            'phone'           => ['sometimes', 'string', 'max:20'],
            'emergency_phone' => ['nullable', 'string', 'max:20'],
            'lat'             => ['nullable', 'numeric'],
            'lng'             => ['nullable', 'numeric'],
        ]);

        $shop->update($data);

        return $this->success($shop);
    }

    /** DELETE /company/shops/{shop} */
    public function destroy(Request $request, Shop $shop): JsonResponse
    {
        $this->authorizeShop($request, $shop);

        $shop->delete();

        return $this->noContent();
    }

    /** GET /company/shops/{shop}/users — 店舗のユーザー一覧 */
    public function users(Request $request, Shop $shop): JsonResponse
    {
        $this->authorizeShop($request, $shop);

        $users = $shop->users()
            ->select('id', 'shop_id', 'name', 'email', 'phone', 'role', 'created_at')
            ->orderBy('role')
            ->orderBy('name')
            ->get();

        return $this->success($users);
    }

    /** POST /company/shops/{shop}/users — 店舗にユーザーを追加 */
    public function addUser(Request $request, Shop $shop): JsonResponse
    {
        $this->authorizeShop($request, $shop);

        $data = $request->validate([
            'name'     => ['required', 'string', 'max:100'],
            'email'    => ['required', 'email', 'unique:users,email'],
            'phone'    => ['nullable', 'string', 'max:20'],
            'role'     => ['required', 'in:admin,deliverer'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $user = $shop->users()->create(array_merge($data, [
            'settings' => [
                'lang'            => 'ja',
                'font_size'       => 'medium',
                'voice_guide'     => false,
                'dark_mode'       => 'auto',
                'onboarding_done' => false,
            ],
        ]));

        return $this->created($user->only('id', 'name', 'email', 'phone', 'role'));
    }

    // ─────────────────────────────────────────────────────────────────────
    private function authorizeShop(Request $request, Shop $shop): void
    {
        if ($shop->company_id !== $request->user()->company_id) {
            abort(403, 'この店舗へのアクセス権がありません');
        }
    }
}
