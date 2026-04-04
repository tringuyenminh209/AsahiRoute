<?php

namespace App\Services;

use App\Models\Route;
use App\Models\Suspension;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class DeliveryRouteService
{
    /**
     * 指定日・時間帯のルート一覧を組み立てる（留守止め反映済み）
     */
    public function buildRoutesForUser(int $userId, string $date, ?string $deliveryTime = null): Collection
    {
        $query = Route::with([
            'area',
            'assignedUser',
            'routePoints' => fn($q) => $q->orderBy('sequence_order'),
            'routePoints.subscriber.subscriberNewspapers.newspaperType',
        ])
        ->where('assigned_user_id', $userId)
        ->whereNull('deleted_at');

        if ($deliveryTime) {
            $query->where('delivery_time', $deliveryTime);
        }

        $routes = $query->get();

        // 配達対象日の留守止めを取得
        $carbonDate = Carbon::parse($date);
        $activeSuspensions = Suspension::where('status', 'active')
            ->whereDate('start_date', '<=', $carbonDate)
            ->whereDate('end_date', '>=', $carbonDate)
            ->pluck('subscriber_id')
            ->toArray();

        return $routes->map(fn($route) => $this->formatRoute($route, $activeSuspensions, $date));
    }

    /**
     * ルートデータをAPI用に整形する
     */
    public function formatRoute(Route $route, array $suspendedSubscriberIds = [], string $date = ''): array
    {
        $points = $route->routePoints->map(function ($point) use ($suspendedSubscriberIds) {
            $subscriber = $point->subscriber;
            $isSuspended = in_array($subscriber->id, $suspendedSubscriberIds);

            return [
                'id'             => $point->id,
                'sequence_order' => $point->sequence_order,
                'is_suspended'   => $isSuspended,
                'subscriber'     => [
                    'id'            => $subscriber->id,
                    'customer_code' => $subscriber->customer_code,
                    'name'          => $subscriber->name,
                    'address'       => $subscriber->address,
                    'address_detail'=> $subscriber->address_detail,
                    'lat'           => $subscriber->lat,
                    'lng'           => $subscriber->lng,
                    'delivery_note' => $subscriber->delivery_note,
                    'delivery_note_translations' => $subscriber->delivery_note_translations,
                    'newspapers'    => $subscriber->subscriberNewspapers->map(fn($sn) => [
                        'name'          => $sn->newspaperType->name,
                        'code'          => $sn->newspaperType->code,
                        'delivery_time' => $sn->newspaperType->delivery_time,
                        'quantity'      => $sn->quantity,
                    ]),
                ],
            ];
        });

        $activePoints = $points->where('is_suspended', false)->count();

        return [
            'id'                     => $route->id,
            'name'                   => $route->name,
            'delivery_time'          => $route->delivery_time,
            'area'                   => [
                'id'   => $route->area->id,
                'name' => $route->area->name,
                'code' => $route->area->code,
            ],
            'total_points'           => $route->total_points,
            'active_points'          => $activePoints,
            'suspended_count'        => $points->where('is_suspended', true)->count(),
            'estimated_duration_min' => $route->estimated_duration_min,
            'estimated_distance_m'   => $route->estimated_distance_m,
            'points'                 => $points->values(),
        ];
    }
}
