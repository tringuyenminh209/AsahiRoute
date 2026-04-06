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
use App\Models\NewspaperType;
use App\Models\Route;
use App\Models\RoutePoint;
use App\Models\Subscriber;
use App\Models\SubscriberNewspaper;
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
     * GET /api/v1/delivery/{delivery}/logs
     * セッションの記録済みポイント一覧を返す（再開時の状態復元用）
     */
    public function getLogs(Request $request, Delivery $delivery): JsonResponse
    {
        if ($delivery->user_id !== $request->user()->id) {
            return $this->forbidden();
        }

        $logs = DeliveryLog::where('delivery_id', $delivery->id)
            ->select(['route_point_id', 'status'])
            ->get();

        return $this->success($logs, '配達記録を取得しました');
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

    /**
     * GET /api/v1/delivery/routes/{route}/newspaper-types
     * ルートが属する店舗の新聞種別一覧を返す
     */
    public function getRouteNewspaperTypes(Request $request, Route $route): JsonResponse
    {
        // Only the assigned deliverer (or admin) can access
        if ($route->assigned_user_id !== $request->user()->id
            && $request->user()->role !== 'admin') {
            return $this->forbidden();
        }

        $shopId = $route->area->shop_id;
        $types = NewspaperType::where('shop_id', $shopId)
            ->orderBy('delivery_time')
            ->orderBy('name')
            ->get()
            ->map(fn($t) => [
                'id'            => $t->id,
                'name'          => $t->name,
                'code'          => $t->code,
                'delivery_time' => $t->delivery_time,
            ]);

        return $this->ok($types);
    }

    /**
     * POST /api/v1/delivery/routes/{route}/subscribers
     * 配達員が自分のルートに新規購読者を追加する
     */
    public function addSubscriber(Request $request, Route $route): JsonResponse
    {
        // Only the assigned deliverer (or admin) can add to this route
        if ($route->assigned_user_id !== $request->user()->id
            && $request->user()->role !== 'admin') {
            return $this->forbidden();
        }

        $data = $request->validate([
            'name'               => 'required|string|max:100',
            'address'            => 'required|string|max:255',
            'address_detail'     => 'nullable|string|max:100',
            'lat'                => 'nullable|numeric|between:-90,90',
            'lng'                => 'nullable|numeric|between:-180,180',
            'delivery_note'      => 'nullable|string|max:500',
            'sequence_order'     => 'nullable|integer|min:1',
            'newspapers'         => 'required|array|min:1',
            'newspapers.*.newspaper_type_id' => 'required|integer|exists:newspaper_types,id',
            'newspapers.*.quantity'          => 'integer|min:1|max:99',
            'newspapers.*.delivery_days'     => 'nullable|array',
            'newspapers.*.delivery_days.*'   => 'integer|between:1,7',
        ]);

        // Generate next customer code (NZ1-xxx style from area code)
        $area = $route->area;
        $lastCode = Subscriber::where('area_id', $area->id)
            ->where('customer_code', 'like', $area->code . '-%')
            ->orderByDesc('customer_code')
            ->value('customer_code');
        $nextNum = $lastCode
            ? (int) substr($lastCode, strlen($area->code) + 1) + 1
            : 1;
        $customerCode = $area->code . '-' . str_pad($nextNum, 3, '0', STR_PAD_LEFT);

        // Determine sequence order — default: append at end
        $maxSeq = RoutePoint::where('route_id', $route->id)->max('sequence_order') ?? 0;
        $seqOrder = isset($data['sequence_order'])
            ? min((int) $data['sequence_order'], $maxSeq + 1)
            : $maxSeq + 1;

        // Shift existing points down to make room
        if ($seqOrder <= $maxSeq) {
            RoutePoint::where('route_id', $route->id)
                ->where('sequence_order', '>=', $seqOrder)
                ->increment('sequence_order');
        }

        // Create subscriber
        $subscriber = Subscriber::create([
            'area_id'        => $area->id,
            'customer_code'  => $customerCode,
            'name'           => $data['name'],
            'address'        => $data['address'],
            'address_detail' => $data['address_detail'] ?? null,
            'lat'            => $data['lat'] ?? null,
            'lng'            => $data['lng'] ?? null,
            'delivery_note'  => $data['delivery_note'] ?? null,
        ]);

        // Create newspaper subscriptions
        foreach ($data['newspapers'] as $np) {
            $days = $np['delivery_days'] ?? null;
            if (is_array($days)) {
                $days = array_values(array_unique(array_map('intval', $days)));
                sort($days);
                if (count($days) === 7) $days = null; // all days = null
            }
            SubscriberNewspaper::create([
                'subscriber_id'     => $subscriber->id,
                'newspaper_type_id' => $np['newspaper_type_id'],
                'quantity'          => $np['quantity'] ?? 1,
                'delivery_days'     => $days,
                'start_date'        => now()->toDateString(),
            ]);
        }

        // Create route point
        $point = RoutePoint::create([
            'route_id'       => $route->id,
            'subscriber_id'  => $subscriber->id,
            'sequence_order' => $seqOrder,
        ]);

        // Update route total_points
        $route->increment('total_points');

        return $this->created([
            'route_point_id' => $point->id,
            'subscriber_id'  => $subscriber->id,
            'customer_code'  => $customerCode,
            'sequence_order' => $seqOrder,
        ], '購読者をルートに追加しました');
    }

    /**
     * PUT /api/v1/delivery/subscribers/{subscriber}/newspapers/{subscriberNewspaper}/delivery-days
     * 配達員が購読者の配達曜日を更新する
     */
    public function updateDeliveryDays(
        Request $request,
        Subscriber $subscriber,
        SubscriberNewspaper $subscriberNewspaper
    ): JsonResponse {
        // Deliverer must belong to the same shop as the subscriber's area
        if ($subscriber->area->shop_id !== $request->user()->shop_id) {
            return $this->forbidden();
        }

        $data = $request->validate([
            'delivery_days'   => 'nullable|array',
            'delivery_days.*' => 'integer|min:1|max:7',
        ]);

        $deliveryDays = isset($data['delivery_days'])
            ? (count($data['delivery_days']) === 7 ? null : array_values(array_unique($data['delivery_days'])))
            : null;

        $subscriberNewspaper->update(['delivery_days' => $deliveryDays]);

        return $this->success([
            'delivery_days' => $subscriberNewspaper->fresh()->delivery_days,
        ], '配達曜日を更新しました');
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
