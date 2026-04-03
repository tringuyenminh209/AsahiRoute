<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Models\Delivery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends ApiController
{
    public function daily(Request $request): JsonResponse
    {
        $request->validate(['date' => ['sometimes', 'date_format:Y-m-d']]);

        $date   = $request->query('date', now()->toDateString());
        $shopId = $request->user()->shop_id;

        $deliveries = Delivery::whereHas('route.area', fn($q) => $q->where('shop_id', $shopId))
            ->where('delivery_date', $date)
            ->with('route.area', 'user')
            ->get();

        return $this->success([
            'date'       => $date,
            'summary'    => $this->buildSummary($deliveries),
            'deliveries' => $deliveries->map(fn($d) => $this->formatDelivery($d)),
        ]);
    }

    public function weekly(Request $request): JsonResponse
    {
        $from   = now()->startOfWeek()->toDateString();
        $to     = now()->endOfWeek()->toDateString();
        $shopId = $request->user()->shop_id;

        $daily = $this->getDailyBreakdown($shopId, $from, $to);

        return $this->success([
            'from'  => $from,
            'to'    => $to,
            'daily' => $daily,
        ]);
    }

    public function monthly(Request $request): JsonResponse
    {
        $request->validate([
            'year'  => ['sometimes', 'integer'],
            'month' => ['sometimes', 'integer', 'min:1', 'max:12'],
        ]);

        $year   = $request->integer('year', now()->year);
        $month  = $request->integer('month', now()->month);
        $shopId = $request->user()->shop_id;

        $from = sprintf('%04d-%02d-01', $year, $month);
        $to   = sprintf('%04d-%02d-%02d', $year, $month, cal_days_in_month(CAL_GREGORIAN, $month, $year));

        $daily = $this->getDailyBreakdown($shopId, $from, $to);

        return $this->success([
            'year'  => $year,
            'month' => $month,
            'from'  => $from,
            'to'    => $to,
            'daily' => $daily,
        ]);
    }

    public function deliveryStats(Request $request): JsonResponse
    {
        $request->validate([
            'from' => ['required', 'date_format:Y-m-d'],
            'to'   => ['required', 'date_format:Y-m-d'],
        ]);

        $shopId = $request->user()->shop_id;

        $stats = Delivery::whereHas('route.area', fn($q) => $q->where('shop_id', $shopId))
            ->whereBetween('delivery_date', [$request->from, $request->to])
            ->where('status', 'completed')
            ->selectRaw('
                COUNT(*) as total_sessions,
                SUM(delivered_count) as total_delivered,
                SUM(skipped_count) as total_skipped,
                SUM(failed_count) as total_failed,
                SUM(total_points) as total_points,
                AVG(TIMESTAMPDIFF(MINUTE, started_at, completed_at)) as avg_duration_min,
                AVG(total_distance_m) as avg_distance_m
            ')
            ->first();

        return $this->success($stats);
    }

    public function areaStats(Request $request): JsonResponse
    {
        $request->validate([
            'from' => ['required', 'date_format:Y-m-d'],
            'to'   => ['required', 'date_format:Y-m-d'],
        ]);

        $shopId = $request->user()->shop_id;

        $stats = DB::table('deliveries')
            ->join('routes', 'deliveries.route_id', '=', 'routes.id')
            ->join('areas', 'routes.area_id', '=', 'areas.id')
            ->where('areas.shop_id', $shopId)
            ->whereBetween('deliveries.delivery_date', [$request->from, $request->to])
            ->where('deliveries.status', 'completed')
            ->groupBy('areas.id', 'areas.name')
            ->selectRaw('
                areas.id,
                areas.name,
                COUNT(deliveries.id) as sessions,
                SUM(deliveries.delivered_count) as delivered,
                SUM(deliveries.total_points) as total_points
            ')
            ->get();

        return $this->success($stats);
    }

    public function userPerformance(Request $request): JsonResponse
    {
        $request->validate([
            'from' => ['required', 'date_format:Y-m-d'],
            'to'   => ['required', 'date_format:Y-m-d'],
        ]);

        $shopId = $request->user()->shop_id;

        $stats = DB::table('deliveries')
            ->join('users', 'deliveries.user_id', '=', 'users.id')
            ->where('users.shop_id', $shopId)
            ->whereBetween('deliveries.delivery_date', [$request->from, $request->to])
            ->where('deliveries.status', 'completed')
            ->groupBy('users.id', 'users.name')
            ->selectRaw('
                users.id,
                users.name,
                COUNT(deliveries.id) as sessions,
                SUM(deliveries.delivered_count) as delivered,
                SUM(deliveries.total_points) as total_points,
                AVG(TIMESTAMPDIFF(MINUTE, deliveries.started_at, deliveries.completed_at)) as avg_duration_min
            ')
            ->get()
            ->map(function ($row) {
                $row->completion_rate = $row->total_points > 0
                    ? round($row->delivered / $row->total_points * 100, 1)
                    : 0;
                return $row;
            });

        return $this->success($stats);
    }

    private function getDailyBreakdown(int $shopId, string $from, string $to): array
    {
        $rows = DB::table('deliveries')
            ->join('routes', 'deliveries.route_id', '=', 'routes.id')
            ->join('areas', 'routes.area_id', '=', 'areas.id')
            ->where('areas.shop_id', $shopId)
            ->whereBetween('deliveries.delivery_date', [$from, $to])
            ->groupBy('deliveries.delivery_date')
            ->selectRaw('
                deliveries.delivery_date as date,
                COUNT(*) as sessions,
                SUM(delivered_count) as delivered,
                SUM(total_points) as total
            ')
            ->orderBy('deliveries.delivery_date')
            ->get();

        return $rows->toArray();
    }

    private function buildSummary($deliveries): array
    {
        return [
            'total_sessions'  => $deliveries->count(),
            'completed'       => $deliveries->where('status', 'completed')->count(),
            'in_progress'     => $deliveries->where('status', 'in_progress')->count(),
            'total_delivered' => $deliveries->sum('delivered_count'),
            'total_points'    => $deliveries->sum('total_points'),
        ];
    }

    private function formatDelivery($delivery): array
    {
        return [
            'id'              => $delivery->id,
            'route_name'      => $delivery->route->name,
            'area_name'       => $delivery->route->area->name,
            'user_name'       => $delivery->user->name,
            'status'          => $delivery->status,
            'delivered_count' => $delivery->delivered_count,
            'total_points'    => $delivery->total_points,
            'started_at'      => $delivery->started_at,
            'completed_at'    => $delivery->completed_at,
        ];
    }
}
