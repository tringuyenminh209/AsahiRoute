<?php

namespace App\Http\Controllers\Api\Delivery;

use App\Events\DelivererStatusChanged;
use App\Events\DeliveryCompleted;
use App\Events\DeliveryPointLogged;
use App\Events\DeliveryStarted;
use App\Events\LocationUpdated;
use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Delivery\LocationRequest;
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

        $user = $request->user();
        broadcast(new DeliveryStarted(
            shopId:     $user->shop_id,
            deliveryId: $delivery->id,
            userId:     $user->id,
            userName:   $user->name,
            routeId:    $delivery->route_id,
            startedAt:  $delivery->started_at->toIso8601String(),
        ))->toOthers();

        broadcast(new DelivererStatusChanged(
            shopId:    $user->shop_id,
            userId:    $user->id,
            userName:  $user->name,
            status:    'delivering',
            updatedAt: now()->toIso8601String(),
        ))->toOthers();

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

        $delivery = Delivery::find($data['delivery_id']);
        $user     = $request->user();
        broadcast(new DeliveryPointLogged(
            shopId:         $user->shop_id,
            deliveryId:     $delivery->id,
            userId:         $user->id,
            routePointId:   $data['route_point_id'],
            status:         $data['status'],
            completedCount: $delivery->delivered_count + $delivery->failed_count,
            totalCount:     $delivery->total_points,
        ))->toOthers();

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

        $fresh   = $delivery->fresh();
        $summary = $this->summaryService->calculate($fresh);
        $user    = $request->user();

        broadcast(new DeliveryCompleted(
            shopId:          $user->shop_id,
            deliveryId:      $fresh->id,
            userId:          $user->id,
            userName:        $user->name,
            deliveredCount:  $fresh->delivered_count,
            totalCount:      $fresh->total_points,
            completionRate:  $fresh->total_points > 0
                                 ? round($fresh->delivered_count / $fresh->total_points * 100, 1)
                                 : 0.0,
            durationMinutes: (int) $fresh->started_at->diffInMinutes($fresh->completed_at),
        ))->toOthers();

        broadcast(new DelivererStatusChanged(
            shopId:    $user->shop_id,
            userId:    $user->id,
            userName:  $user->name,
            status:    'online',
            updatedAt: now()->toIso8601String(),
        ))->toOthers();

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

    /**
     * POST /api/v1/delivery/location
     * GPS座標を受信し、ライブ追跡用にbroadcast
     */
    public function location(LocationRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = $request->user();

        broadcast(new LocationUpdated(
            shopId:    $user->shop_id,
            userId:    $user->id,
            userName:  $user->name,
            lat:       (float) $data['lat'],
            lng:       (float) $data['lng'],
            speed:     (float) ($data['speed'] ?? 0.0),
            updatedAt: now()->toIso8601String(),
        ))->toOthers();

        return $this->success(null, '位置情報を送信しました');
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
