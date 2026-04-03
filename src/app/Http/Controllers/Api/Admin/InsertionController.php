<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Models\NewInsertion;
use App\Models\RoutePoint;
use App\Models\Subscriber;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InsertionController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $shopId = $request->user()->shop_id;

        $query = NewInsertion::whereHas('route.area', fn($q) => $q->where('shop_id', $shopId))
            ->with(['subscriber', 'route', 'registeredBy', 'approvedBy']);

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $paginator = $query->orderByDesc('effective_date')->paginate(20);

        return $this->paginated($paginator);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'subscriber_id'  => ['required', 'integer', 'exists:subscribers,id'],
            'route_id'       => ['required', 'integer', 'exists:routes,id'],
            'effective_date' => ['required', 'date_format:Y-m-d'],
        ]);

        $insertion = NewInsertion::create([
            ...$data,
            'registered_by' => $request->user()->id,
            'status'        => 'pending',
        ]);

        return $this->created($insertion->load('subscriber', 'route'), '新規追加を登録しました');
    }

    public function show(Request $request, NewInsertion $insertion): JsonResponse
    {
        return $this->success($insertion->load('subscriber', 'route', 'registeredBy', 'approvedBy'));
    }

    public function update(Request $request, NewInsertion $insertion): JsonResponse
    {
        $data = $request->validate([
            'effective_date' => ['sometimes', 'date_format:Y-m-d'],
            'suggested_order'=> ['sometimes', 'nullable', 'integer'],
        ]);

        $insertion->update($data);

        return $this->success($insertion->fresh(), '更新しました');
    }

    public function destroy(Request $request, NewInsertion $insertion): JsonResponse
    {
        $insertion->update(['status' => 'rejected']);
        return $this->noContent();
    }

    /**
     * POST /api/v1/admin/insertions/{insertion}/approve
     * 承認 → route_points に追加
     */
    public function approve(Request $request, NewInsertion $insertion): JsonResponse
    {
        if ($insertion->status !== 'pending') {
            return \App\Http\Responses\ApiResponse::error(
                'INVALID_STATUS',
                'この申請はすでに処理済みです',
                422
            );
        }

        $suggestedOrder = $insertion->suggested_order
            ?? $this->suggestOrderValue($insertion->route_id);

        DB::transaction(function () use ($insertion, $suggestedOrder, $request) {
            // 挿入位置以降の sequence_order をずらす
            RoutePoint::where('route_id', $insertion->route_id)
                ->where('sequence_order', '>=', $suggestedOrder)
                ->increment('sequence_order');

            // route_points に追加
            RoutePoint::create([
                'route_id'       => $insertion->route_id,
                'subscriber_id'  => $insertion->subscriber_id,
                'sequence_order' => $suggestedOrder,
            ]);

            // insertion を更新
            $insertion->update([
                'status'       => 'approved',
                'actual_order' => $suggestedOrder,
                'approved_by'  => $request->user()->id,
                'approved_at'  => now(),
            ]);

            // total_points を更新
            \App\Models\Route::where('id', $insertion->route_id)->increment('total_points');
        });

        return $this->success($insertion->fresh()->load('subscriber'), '承認しました');
    }

    /**
     * POST /api/v1/admin/insertions/{insertion}/reject
     */
    public function reject(Request $request, NewInsertion $insertion): JsonResponse
    {
        $insertion->update([
            'status'      => 'rejected',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ]);

        return $this->success(null, '却下しました');
    }

    /**
     * GET /api/v1/admin/insertions/{insertion}/suggest-position
     * 新規購読者のGPS座標から最近傍ルートポイントの次を提案
     */
    public function suggestPosition(Request $request, NewInsertion $insertion): JsonResponse
    {
        $subscriber = Subscriber::find($insertion->subscriber_id);
        $suggestedOrder = $this->suggestOrderValue($insertion->route_id, $subscriber);

        return $this->success([
            'suggested_order' => $suggestedOrder,
            'basis'           => 'GPS近傍ポイントの次',
        ]);
    }

    private function suggestOrderValue(int $routeId, ?Subscriber $newSubscriber = null): int
    {
        if ($newSubscriber && $newSubscriber->lat && $newSubscriber->lng) {
            // Haversine 近似で最近傍ポイントを探す
            $nearestPoint = RoutePoint::where('route_id', $routeId)
                ->join('subscribers as s', 'route_points.subscriber_id', '=', 's.id')
                ->select('route_points.*',
                    DB::raw("(
                        POW(s.lat - {$newSubscriber->lat}, 2) +
                        POW(s.lng - {$newSubscriber->lng}, 2)
                    ) as dist_sq")
                )
                ->whereNotNull('s.lat')
                ->whereNotNull('s.lng')
                ->orderBy('dist_sq')
                ->first();

            if ($nearestPoint) {
                return $nearestPoint->sequence_order + 1;
            }
        }

        // フォールバック: 末尾に追加
        $max = RoutePoint::where('route_id', $routeId)->max('sequence_order');
        return ($max ?? 0) + 1;
    }
}
