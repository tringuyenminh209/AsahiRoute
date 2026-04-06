<?php

namespace App\Services;

use App\Models\Delivery;
use App\Models\Route;
use App\Models\SpecialDay;
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

        // 当日の日種別を判定（weekday / saturday / sunday / holiday）
        $dayType = $this->resolveDayType($carbonDate, $routes->first()?->area?->shop_id);

        // 曜日 (1=Mon...7=Sun) — Carbon: 0=Sun,1=Mon,...,6=Sat
        $dayOfWeek = $carbonDate->dayOfWeek === 0 ? 7 : $carbonDate->dayOfWeek;
        $activeSuspensions = Suspension::where('status', 'active')
            ->whereDate('start_date', '<=', $carbonDate)
            ->whereDate('end_date', '>=', $carbonDate)
            ->pluck('subscriber_id')
            ->toArray();

        // 当日の配達セッションをルートIDでインデックス
        $deliveries = Delivery::where('user_id', $userId)
            ->whereDate('delivery_date', $date)
            ->get()
            ->keyBy('route_id');

        return $routes->map(fn($route) => $this->formatRoute($route, $activeSuspensions, $date, $deliveries, $dayType, $dayOfWeek));
    }

    /**
     * ルートデータをAPI用に整形する
     */
    public function formatRoute(Route $route, array $suspendedSubscriberIds = [], string $date = '', \Illuminate\Support\Collection $deliveries = null, string $dayType = 'weekday', int $dayOfWeek = 1): array
    {
        $points = $route->routePoints->map(function ($point) use ($suspendedSubscriberIds, $dayType, $dayOfWeek) {
            $subscriber  = $point->subscriber;
            $isSuspended = in_array($subscriber->id, $suspendedSubscriberIds);

            // Mark each newspaper with whether it delivers today
            $newspapers = $subscriber->subscriberNewspapers->map(fn($sn) => [
                'id'               => $sn->id,
                'newspaper_type_id'=> $sn->newspaper_type_id,
                'name'             => $sn->newspaperType->name,
                'code'             => $sn->newspaperType->code,
                'delivery_time'    => $sn->newspaperType->delivery_time,
                'quantity'         => $sn->quantity,
                'today_quantity'   => $sn->quantityForDayType($dayType),
                'delivers_today'   => $sn->deliversOnDay($dayOfWeek),
                'delivery_days'    => $sn->delivery_days, // null = all days
                'day_schedule'     => $sn->day_schedule,
            ]);

            // Point is "schedule-skipped" if NO newspaper is scheduled for today
            // (and not already suspended — suspension takes priority)
            $isScheduleSkip = !$isSuspended && $newspapers->where('delivers_today', true)->isEmpty();

            return [
                'id'               => $point->id,
                'sequence_order'   => $point->sequence_order,
                'is_suspended'     => $isSuspended,
                'is_schedule_skip' => $isScheduleSkip, // no delivery today due to subscriber's schedule
                'subscriber'       => [
                    'id'            => $subscriber->id,
                    'customer_code' => $subscriber->customer_code,
                    'name'          => $subscriber->name,
                    'address'       => $subscriber->address,
                    'address_detail'=> $subscriber->address_detail,
                    'lat'           => $subscriber->lat,
                    'lng'           => $subscriber->lng,
                    'delivery_note' => $subscriber->delivery_note,
                    'delivery_note_translations' => $subscriber->delivery_note_translations,
                    'newspapers'    => $newspapers,
                ],
            ];
        });

        $activePoints = $points->where('is_suspended', false)->where('is_schedule_skip', false)->count();

        return [
            'id'                     => $route->id,
            'day_type'               => $dayType,
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
            'delivery'               => $this->formatDeliverySession($deliveries, $route->id),
        ];
    }

    /**
     * 日付と店舗IDから日種別を判定する
     * 優先順位: 特別日(holiday) > 土曜 > 日曜 > 平日
     */
    private function resolveDayType(Carbon $date, ?int $shopId): string
    {
        if ($shopId) {
            $isSpecial = SpecialDay::where('shop_id', $shopId)
                ->where('date', $date->toDateString())
                ->exists();
            if ($isSpecial) return 'holiday';
        }

        return match ($date->dayOfWeek) {
            Carbon::SATURDAY => 'saturday',
            Carbon::SUNDAY   => 'sunday',
            default          => 'weekday',
        };
    }

    private function formatDeliverySession(?\Illuminate\Support\Collection $deliveries, int $routeId): ?array
    {
        if (!$deliveries || !$deliveries->has($routeId)) {
            return null;
        }
        $d = $deliveries->get($routeId);
        return [
            'id'           => $d->id,
            'status'       => $d->status,
            'started_at'   => $d->started_at,
            'completed_at' => $d->completed_at,
        ];
    }
}
