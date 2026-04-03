<?php

namespace App\Http\Controllers\Api\Delivery;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Delivery\LogDeliveryPointRequest;
use App\Http\Requests\Delivery\StartDeliveryRequest;
use App\Http\Requests\Delivery\SyncDeliveryRequest;
use App\Http\Responses\ApiResponse;
use App\Models\Delivery;
use App\Models\DeliveryLog;
use App\Services\DeliveryRouteService;
use App\Services\DeliverySummaryService;
use App\Services\OfflineSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeliveryController extends ApiController
{
    public function __construct(
        private readonly DeliveryRouteService  $routeService,
        private readonly DeliverySummaryService $summaryService,
        private readonly OfflineSyncService     $syncService,
    ) {}

    /**
     * GET /api/v1/delivery/my-routes
     * 今日の担当ルートを留守止め反映済みで返す
     */
    public function myRoutes(Request $request): JsonResponse
    {
        $date         = $request->query('date', now()->toDateString());
        $deliveryTime = $request->query('time'); // 'morning' | 'evening' | null

        $routes = $this->routeService->buildRoutesForUser(
            $request->user()->id,
            $date,
            $deliveryTime
        );

        return $this->success($routes, 'ルート一覧を取得しました');
    }

    /**
     * POST /api/v1/delivery/start
     * 配達セッション開始
     */
    public function start(StartDeliveryRequest $request): JsonResponse
    {
        $data = $request->validated();

        // 同日・同ルートで既に開始済みか確認
        $existing = Delivery::where('route_id', $data['route_id'])
            ->where('delivery_date', $data['delivery_date'])
            ->where('delivery_time', $data['delivery_time'])
            ->first();

        if ($existing) {
            // 再開の場合はそのまま返す
            return $this->success(
                $this->formatDelivery($existing),
                '配達を再開します'
            );
        }

        // ルートのポイント数を取得
        $totalPoints = \App\Models\RoutePoint::where('route_id', $data['route_id'])
            ->where('is_skipped', false)
            ->count();

        $delivery = Delivery::create([
            'route_id'      => $data['route_id'],
            'user_id'       => $request->user()->id,
            'delivery_date' => $data['delivery_date'],
            'delivery_time' => $data['delivery_time'],
            'is_learning'   => $data['is_learning'] ?? false,
            'started_at'    => now(),
            'total_points'  => $totalPoints,
            'status'        => 'in_progress',
        ]);

        return $this->created($this->formatDelivery($delivery), '配達を開始しました');
    }

    /**
     * POST /api/v1/delivery/log
     * 個別ポイントの配達結果を記録
     */
    public function logPoint(LogDeliveryPointRequest $request): JsonResponse
    {
        $data = $request->validated();

        // 重複チェック
        $existing = DeliveryLog::where('delivery_id', $data['delivery_id'])
            ->where('route_point_id', $data['route_point_id'])
            ->first();

        if ($existing) {
            return $this->conflict('このポイントはすでに記録済みです', [
                'existing_status' => $existing->status,
                'delivered_at'    => $existing->delivered_at,
            ]);
        }

        $log = DeliveryLog::create([
            'delivery_id'    => $data['delivery_id'],
            'route_point_id' => $data['route_point_id'],
            'status'         => $data['status'],
            'delivered_at'   => $data['delivered_at'],
            'lat'            => $data['lat'] ?? null,
            'lng'            => $data['lng'] ?? null,
            'failure_reason' => $data['failure_reason'] ?? null,
            'photo'          => $data['photo'] ?? null,
            'synced'         => $data['synced'] ?? true,
        ]);

        // Delivery のカウントをインクリメント
        $this->incrementDeliveryCount($data['delivery_id'], $data['status']);

        return $this->created([
            'log_id'  => $log->id,
            'status'  => $log->status,
        ], '配達記録を保存しました');
    }

    /**
     * POST /api/v1/delivery/{delivery}/complete
     * 配達セッション完了 → サマリーを返す
     */
    public function complete(Request $request, Delivery $delivery): JsonResponse
    {
        if ($delivery->user_id !== $request->user()->id) {
            return $this->forbidden();
        }

        if ($delivery->status === 'completed') {
            $summary = $this->summaryService->calculate($delivery);
            return $this->success($summary, 'すでに完了済みです');
        }

        $delivery->update([
            'status'       => 'completed',
            'completed_at' => now(),
        ]);

        $summary = $this->summaryService->calculate($delivery->fresh());

        return $this->success($summary, '配達が完了しました');
    }

    /**
     * POST /api/v1/delivery/sync
     * オフライン記録を一括同期
     */
    public function sync(SyncDeliveryRequest $request): JsonResponse
    {
        $result = $this->syncService->sync($request->validated('logs'));

        if (!empty($result['conflicts'])) {
            return ApiResponse::conflict(
                '一部のポイントで競合が発生しました',
                $result
            );
        }

        return $this->success($result, "{$result['synced']}件を同期しました");
    }

    private function formatDelivery(Delivery $delivery): array
    {
        return [
            'id'            => $delivery->id,
            'route_id'      => $delivery->route_id,
            'delivery_date' => $delivery->delivery_date,
            'delivery_time' => $delivery->delivery_time,
            'is_learning'   => $delivery->is_learning,
            'started_at'    => $delivery->started_at,
            'total_points'  => $delivery->total_points,
            'status'        => $delivery->status,
        ];
    }

    private function incrementDeliveryCount(int $deliveryId, string $status): void
    {
        $column = match ($status) {
            'delivered' => 'delivered_count',
            'skipped'   => 'skipped_count',
            'failed'    => 'failed_count',
            default     => null,
        };

        if ($column) {
            Delivery::where('id', $deliveryId)->increment($column);
        }
    }
}
