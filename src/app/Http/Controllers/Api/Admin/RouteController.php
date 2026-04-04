<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Models\Route;
use App\Models\RoutePoint;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RouteController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $shopId = $request->user()->shop_id;

        $query = Route::whereHas('area', fn($q) => $q->where('shop_id', $shopId))
            ->with(['area', 'assignedUser'])
            ->withCount('routePoints');

        if ($areaId = $request->query('area_id')) {
            $query->where('area_id', $areaId);
        }

        if ($time = $request->query('delivery_time')) {
            $query->where('delivery_time', $time);
        }

        $paginator = $query->orderBy('name')->paginate(20);

        return $this->paginated($paginator);
    }

    public function show(Request $request, Route $route): JsonResponse
    {
        $this->authorizeShop($request, $route);

        $route->load([
            'area',
            'assignedUser',
            'routePoints' => fn($q) => $q->orderBy('sequence_order'),
            'routePoints.subscriber.subscriberNewspapers.newspaperType',
        ]);

        return $this->success($route);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'area_id'       => ['required', 'integer', 'exists:areas,id'],
            'name'          => ['required', 'string', 'max:100'],
            'delivery_time' => ['required', 'in:morning,evening'],
        ]);

        $route = Route::create($data);

        return $this->created($route, 'ルートを作成しました');
    }

    public function update(Request $request, Route $route): JsonResponse
    {
        $this->authorizeShop($request, $route);

        $data = $request->validate([
            'name'          => ['sometimes', 'string', 'max:100'],
            'delivery_time' => ['sometimes', 'in:morning,evening'],
        ]);

        $route->update($data);

        return $this->success($route->fresh(), 'ルートを更新しました');
    }

    public function destroy(Request $request, Route $route): JsonResponse
    {
        $this->authorizeShop($request, $route);
        $route->delete();

        return $this->noContent();
    }

    /**
     * PUT /api/v1/admin/routes/{route}/reorder
     * body: { "orders": [{"id": 1, "sequence_order": 1}, ...] }
     */
    public function reorder(Request $request, Route $route): JsonResponse
    {
        $this->authorizeShop($request, $route);

        $request->validate([
            'orders'                  => ['required', 'array'],
            'orders.*.id'             => ['required', 'integer'],
            'orders.*.sequence_order' => ['required', 'integer', 'min:1'],
        ]);

        DB::transaction(function () use ($request, $route) {
            foreach ($request->orders as $item) {
                RoutePoint::where('id', $item['id'])
                    ->where('route_id', $route->id)
                    ->update(['sequence_order' => $item['sequence_order']]);
            }
        });

        return $this->success(null, '順序を保存しました');
    }

    /**
     * POST /api/v1/admin/routes/{route}/assign
     * body: { "user_id": 2 }
     */
    public function assign(Request $request, Route $route): JsonResponse
    {
        $this->authorizeShop($request, $route);

        $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        $route->update(['assigned_user_id' => $request->user_id]);

        return $this->success(null, '担当者を割り当てました');
    }

    /**
     * POST /api/v1/admin/routes/{route}/optimize
     */
    public function optimize(Request $request, Route $route): JsonResponse
    {
        $this->authorizeShop($request, $route);

        \App\Jobs\OptimizeRouteJob::dispatch($route->id);

        return $this->success([
            'route_id' => $route->id,
            'status'   => 'queued',
        ], '最適化ジョブをキューに追加しました。完了時に通知されます。');
    }

    /**
     * GET /api/v1/admin/routes/{route}/preview
     */
    public function preview(Request $request, Route $route): JsonResponse
    {
        $this->authorizeShop($request, $route);

        $route->load([
            'routePoints' => fn($q) => $q->orderBy('sequence_order'),
            'routePoints.subscriber',
        ]);

        return $this->success([
            'route_id'    => $route->id,
            'optimized_at'=> $route->optimized_at,
            'points'      => $route->routePoints->map(fn($p) => [
                'id'             => $p->id,
                'sequence_order' => $p->sequence_order,
                'subscriber'     => [
                    'name'    => $p->subscriber->name,
                    'address' => $p->subscriber->address,
                ],
            ]),
        ]);
    }

    /**
     * GET /api/v1/admin/routes/{route}/print
     */
    public function print(Request $request, Route $route): JsonResponse
    {
        $this->authorizeShop($request, $route);

        $route->load([
            'area',
            'assignedUser',
            'routePoints' => fn($q) => $q->orderBy('sequence_order'),
            'routePoints.subscriber.subscriberNewspapers.newspaperType',
        ]);

        $points = $route->routePoints->map(fn($p) => [
            'sequence_order' => $p->sequence_order,
            'customer_code'  => $p->subscriber->customer_code,
            'name'           => $p->subscriber->name,
            'address'        => $p->subscriber->address . ($p->subscriber->address_detail ? ' ' . $p->subscriber->address_detail : ''),
            'delivery_note'  => $p->subscriber->delivery_note,
            'is_skipped'     => $p->is_skipped,
            'newspapers'     => $p->subscriber->subscriberNewspapers->map(fn($sn) => [
                'name'     => $sn->newspaperType->name,
                'quantity' => $sn->quantity,
            ]),
        ]);

        return $this->success([
            'route_name'    => $route->name,
            'area_name'     => $route->area->name,
            'deliverer'     => $route->assignedUser?->name,
            'delivery_time' => $route->delivery_time,
            'printed_at'    => now()->toIso8601String(),
            'points'        => $points,
        ]);
    }

    private function authorizeShop(Request $request, Route $route): void
    {
        if ($route->area->shop_id !== $request->user()->shop_id) {
            abort(403);
        }
    }
}
