<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Models\Delivery;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = User::where('shop_id', $request->user()->shop_id)
            ->whereNull('deleted_at');

        if ($role = $request->query('role')) {
            $query->where('role', $role);
        }

        $users = $query->orderBy('name')->get()->map(fn($u) => $this->formatUser($u));

        return $this->success($users);
    }

    public function show(Request $request, User $user): JsonResponse
    {
        $this->authorizeShop($request, $user);

        return $this->success($this->formatUser($user));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'     => ['required', 'string', 'max:100'],
            'email'    => ['required', 'email', 'unique:users,email'],
            'phone'    => ['sometimes', 'nullable', 'string', 'max:20'],
            'password' => ['required', 'string', 'min:8'],
            'role'     => ['required', 'in:admin,deliverer'],
        ]);

        $user = User::create([
            ...$data,
            'shop_id'  => $request->user()->shop_id,
            'password' => Hash::make($data['password']),
            'settings' => ['lang' => 'ja', 'font_size' => 'medium', 'voice_guide' => false, 'dark_mode' => 'auto', 'onboarding_done' => false],
        ]);

        return $this->created($this->formatUser($user), 'ユーザーを作成しました');
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $this->authorizeShop($request, $user);

        $data = $request->validate([
            'name'     => ['sometimes', 'string', 'max:100'],
            'phone'    => ['sometimes', 'nullable', 'string', 'max:20'],
            'role'     => ['sometimes', 'in:admin,deliverer'],
            'password' => ['sometimes', 'string', 'min:8'],
        ]);

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $user->update($data);

        return $this->success($this->formatUser($user->fresh()), 'ユーザーを更新しました');
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $this->authorizeShop($request, $user);

        if ($user->id === $request->user()->id) {
            return \App\Http\Responses\ApiResponse::error('FORBIDDEN', '自分自身は削除できません', 403);
        }

        $user->delete();

        return $this->noContent();
    }

    /**
     * GET /api/v1/admin/users/{user}/performance
     */
    public function performance(Request $request, User $user): JsonResponse
    {
        $this->authorizeShop($request, $user);

        $days = (int) $request->query('days', 30);

        $deliveries = Delivery::where('user_id', $user->id)
            ->where('status', 'completed')
            ->where('delivery_date', '>=', now()->subDays($days)->toDateString())
            ->get();

        $avgDuration = $deliveries->avg(function ($d) {
            if (!$d->started_at || !$d->completed_at) {
                return null;
            }
            return $d->started_at->diffInMinutes($d->completed_at);
        });

        $totalDelivered = $deliveries->sum('delivered_count');
        $totalPoints    = $deliveries->sum('total_points');

        return $this->success([
            'user_id'              => $user->id,
            'user_name'            => $user->name,
            'period_days'          => $days,
            'total_sessions'       => $deliveries->count(),
            'total_delivered'      => $totalDelivered,
            'completion_rate'      => $totalPoints > 0 ? round($totalDelivered / $totalPoints * 100, 1) : 0,
            'avg_duration_minutes' => $avgDuration ? round($avgDuration, 1) : null,
        ]);
    }

    /**
     * GET /api/v1/admin/users/{user}/deliveries
     */
    public function deliveries(Request $request, User $user): JsonResponse
    {
        $this->authorizeShop($request, $user);

        $paginator = Delivery::where('user_id', $user->id)
            ->with('route.area')
            ->orderByDesc('delivery_date')
            ->paginate(20);

        return $this->paginated($paginator);
    }

    private function formatUser(User $user): array
    {
        return [
            'id'         => $user->id,
            'shop_id'    => $user->shop_id,
            'name'       => $user->name,
            'email'      => $user->email,
            'phone'      => $user->phone,
            'role'       => $user->role,
            'created_at' => $user->created_at,
        ];
    }

    private function authorizeShop(Request $request, User $user): void
    {
        if ($user->shop_id !== $request->user()->shop_id) {
            abort(403);
        }
    }
}
