<?php

namespace App\Services;

use App\Models\Delivery;
use App\Models\DeliveryLog;
use Illuminate\Support\Collection;

class OfflineSyncService
{
    /**
     * オフラインログを一括同期する。
     * すでに同期済みのポイントは conflict として返す。
     *
     * @return array{synced: int, conflicts: array, errors: array}
     */
    public function sync(array $logs): array
    {
        $synced    = 0;
        $conflicts = [];
        $errors    = [];

        foreach ($logs as $index => $log) {
            try {
                $existing = DeliveryLog::where('delivery_id', $log['delivery_id'])
                    ->where('route_point_id', $log['route_point_id'])
                    ->first();

                if ($existing) {
                    // すでに記録済み → conflict
                    $conflicts[] = [
                        'index'          => $index,
                        'delivery_id'    => $log['delivery_id'],
                        'route_point_id' => $log['route_point_id'],
                        'existing'       => [
                            'status'       => $existing->status,
                            'delivered_at' => $existing->delivered_at,
                            'synced'       => $existing->synced,
                        ],
                        'incoming' => [
                            'status'       => $log['status'],
                            'delivered_at' => $log['delivered_at'],
                        ],
                    ];
                    continue;
                }

                // 新規作成
                DeliveryLog::create([
                    'delivery_id'    => $log['delivery_id'],
                    'route_point_id' => $log['route_point_id'],
                    'status'         => $log['status'],
                    'delivered_at'   => $log['delivered_at'],
                    'lat'            => $log['lat'] ?? null,
                    'lng'            => $log['lng'] ?? null,
                    'failure_reason' => $log['failure_reason'] ?? null,
                    'synced'         => false, // オフライン起源
                ]);

                // Delivery カウントを更新
                $this->updateDeliveryCounts($log['delivery_id']);

                $synced++;
            } catch (\Exception $e) {
                $errors[] = [
                    'index'   => $index,
                    'message' => $e->getMessage(),
                ];
            }
        }

        return compact('synced', 'conflicts', 'errors');
    }

    private function updateDeliveryCounts(int $deliveryId): void
    {
        $delivery = Delivery::find($deliveryId);
        if (!$delivery) {
            return;
        }

        $logs = DeliveryLog::where('delivery_id', $deliveryId)->get();

        $delivery->update([
            'delivered_count' => $logs->where('status', 'delivered')->count(),
            'skipped_count'   => $logs->where('status', 'skipped')->count(),
            'failed_count'    => $logs->where('status', 'failed')->count(),
        ]);
    }
}
