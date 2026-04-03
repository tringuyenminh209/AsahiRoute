<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Models\Delivery;
use App\Models\NewInsertion;
use App\Models\Route;
use App\Models\SosAlert;
use App\Models\Suspension;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends ApiController
{
    /**
     * GET /api/v1/admin/dashboard/summary
     * KPIカード用サマリー
     */
    public function summary(Request $request): JsonResponse
    {
        $shopId = $request->user()->shop_id;
        $today  = now()->toDateString();

        $deliveries = Delivery::whereHas('route.area', fn($q) => $q->where('shop_id', $shopId))
            ->where('delivery_date', $today)
            ->get();

        $completed   = $deliveries->where('status', 'completed')->count();
        $inProgress  = $deliveries->where('status', 'in_progress')->count();
        $notStarted  = $deliveries->where('status', 'not_started')->count();

        $totalDelivered = $deliveries->sum('delivered_count');
        $totalPoints    = $deliveries->sum('total_points');

        $activeSuspensions = Suspension::whereHas('subscriber.area', fn($q) => $q->where('shop_id', $shopId))
            ->where('status', 'active')
            ->whereDate('start_date', '<=', $today)
            ->whereDate('end_date', '>=', $today)
            ->count();

        $pendingInsertions = NewInsertion::whereHas('route.area', fn($q) => $q->where('shop_id', $shopId))
            ->where('status', 'pending')
            ->count();

        return $this->success([
            'date'               => $today,
            'deliveries'         => [
                'completed'    => $completed,
                'in_progress'  => $inProgress,
                'not_started'  => $notStarted,
                'total_routes' => $deliveries->count(),
            ],
            'points'             => [
                'delivered'       => $totalDelivered,
                'total'           => $totalPoints,
                'completion_rate' => $totalPoints > 0 ? round($totalDelivered / $totalPoints * 100, 1) : 0,
            ],
            'active_suspensions' => $activeSuspensions,
            'pending_insertions' => $pendingInsertions,
        ]);
    }

    /**
     * GET /api/v1/admin/dashboard/today
     * 全配達員のリアルタイム状態
     */
    public function today(Request $request): JsonResponse
    {
        $shopId = $request->user()->shop_id;
        $today  = now()->toDateString();

        $deliverers = User::where('shop_id', $shopId)
            ->where('role', 'deliverer')
            ->whereNull('deleted_at')
            ->with([
                'deliveries' => fn($q) => $q
                    ->where('delivery_date', $today)
                    ->with('route.area'),
            ])
            ->get();

        $status = $deliverers->map(function ($user) {
            $delivery = $user->deliveries->first();

            return [
                'user_id'   => $user->id,
                'user_name' => $user->name,
                'delivery'  => $delivery ? [
                    'id'              => $delivery->id,
                    'route_name'      => $delivery->route->name,
                    'area_name'       => $delivery->route->area->name,
                    'status'          => $delivery->status,
                    'delivered_count' => $delivery->delivered_count,
                    'total_points'    => $delivery->total_points,
                    'completion_rate' => $delivery->total_points > 0
                        ? round($delivery->delivered_count / $delivery->total_points * 100, 1)
                        : 0,
                    'started_at'      => $delivery->started_at,
                ] : null,
            ];
        });

        return $this->success([
            'updated_at' => now()->toIso8601String(),
            'deliverers' => $status,
        ]);
    }

    /**
     * GET /api/v1/admin/dashboard/alerts
     */
    public function alerts(Request $request): JsonResponse
    {
        $shopId = $request->user()->shop_id;

        $sosAlerts = SosAlert::where('shop_id', $shopId)
            ->whereIn('status', ['sent', 'acknowledged'])
            ->with('user')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(fn($a) => [
                'id'        => $a->id,
                'type'      => 'sos',
                'user_name' => $a->user->name,
                'status'    => $a->status,
                'lat'       => $a->lat,
                'lng'       => $a->lng,
                'created_at'=> $a->created_at,
            ]);

        return $this->success([
            'sos_alerts' => $sosAlerts,
            'total'      => $sosAlerts->count(),
        ]);
    }
}
