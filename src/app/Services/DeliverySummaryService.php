<?php

namespace App\Services;

use App\Models\Delivery;
use Carbon\Carbon;

class DeliverySummaryService
{
    /**
     * 配達完了時のサマリーを計算する
     */
    public function calculate(Delivery $delivery): array
    {
        $delivery->load('deliveryLogs', 'route');

        $delivered = $delivery->deliveryLogs->where('status', 'delivered')->count();
        $skipped   = $delivery->deliveryLogs->where('status', 'skipped')->count();
        $failed    = $delivery->deliveryLogs->where('status', 'failed')->count();
        $absent    = $delivery->deliveryLogs->where('status', 'absent')->count();

        $durationMinutes = null;
        if ($delivery->started_at && $delivery->completed_at) {
            $durationMinutes = (int) Carbon::parse($delivery->started_at)
                ->diffInMinutes($delivery->completed_at);
        }

        // 昨日の同ルートと比較
        $yesterday = Carbon::parse($delivery->delivery_date)->subDay()->toDateString();
        $yesterday_delivery = Delivery::where('route_id', $delivery->route_id)
            ->where('delivery_date', $yesterday)
            ->where('status', 'completed')
            ->first();

        $timeImprovement = null;
        if ($yesterday_delivery && $durationMinutes !== null) {
            $yDuration = $yesterday_delivery->started_at && $yesterday_delivery->completed_at
                ? (int) Carbon::parse($yesterday_delivery->started_at)
                    ->diffInMinutes($yesterday_delivery->completed_at)
                : null;

            if ($yDuration !== null) {
                $timeImprovement = $yDuration - $durationMinutes; // 正 = 改善
            }
        }

        return [
            'delivery_id'      => $delivery->id,
            'route_name'       => $delivery->route->name,
            'delivery_date'    => $delivery->delivery_date,
            'delivery_time'    => $delivery->delivery_time,
            'started_at'       => $delivery->started_at,
            'completed_at'     => $delivery->completed_at,
            'duration_minutes' => $durationMinutes,
            'counts'           => [
                'total'     => $delivery->total_points,
                'delivered' => $delivered,
                'skipped'   => $skipped,
                'failed'    => $failed,
                'absent'    => $absent,
            ],
            'total_distance_m'       => $delivery->total_distance_m,
            'time_improvement_min'   => $timeImprovement,
            'completion_rate'        => $delivery->total_points > 0
                ? round($delivered / $delivery->total_points * 100, 1)
                : 0,
        ];
    }
}
