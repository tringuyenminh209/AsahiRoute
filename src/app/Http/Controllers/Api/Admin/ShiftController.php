<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Models\Shift;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShiftController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = Shift::whereHas('user', fn($q) => $q->where('shop_id', $request->user()->shop_id))
            ->with(['user', 'route.area', 'substituteUser']);

        if ($from = $request->query('from')) {
            $query->whereDate('shift_date', '>=', $from);
        }

        if ($to = $request->query('to')) {
            $query->whereDate('shift_date', '<=', $to);
        }

        $paginator = $query->orderBy('shift_date')->paginate(30);

        return $this->paginated($paginator);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'user_id'    => ['required', 'integer', 'exists:users,id'],
            'route_id'   => ['required', 'integer', 'exists:routes,id'],
            'shift_date' => ['required', 'date_format:Y-m-d'],
            'shift_type' => ['required', 'in:morning,evening,both'],
        ]);

        $shift = Shift::create([...$data, 'status' => 'scheduled']);

        return $this->created($shift->load('user', 'route'), 'シフトを作成しました');
    }

    public function show(Request $request, Shift $shift): JsonResponse
    {
        return $this->success($shift->load('user', 'route', 'substituteUser'));
    }

    public function update(Request $request, Shift $shift): JsonResponse
    {
        $data = $request->validate([
            'shift_date'          => ['sometimes', 'date_format:Y-m-d'],
            'shift_type'          => ['sometimes', 'in:morning,evening,both'],
            'status'              => ['sometimes', 'in:scheduled,confirmed,completed,cancelled'],
            'substitute_user_id'  => ['sometimes', 'nullable', 'integer', 'exists:users,id'],
        ]);

        $shift->update($data);

        return $this->success($shift->fresh(), 'シフトを更新しました');
    }

    public function destroy(Request $request, Shift $shift): JsonResponse
    {
        $shift->update(['status' => 'cancelled']);
        return $this->noContent();
    }

    /**
     * GET /api/v1/admin/shifts/calendar?year=&month=
     */
    public function calendar(Request $request): JsonResponse
    {
        $request->validate([
            'year'  => ['required', 'integer'],
            'month' => ['required', 'integer', 'min:1', 'max:12'],
        ]);

        $shopId = $request->user()->shop_id;
        $year   = $request->integer('year');
        $month  = $request->integer('month');

        $from = sprintf('%04d-%02d-01', $year, $month);
        $to   = \Carbon\Carbon::createFromDate($year, $month, 1)->endOfMonth()->toDateString();

        $shifts = Shift::whereHas('user', fn($q) => $q->where('shop_id', $shopId))
            ->whereBetween('shift_date', [$from, $to])
            ->with(['user', 'route'])
            ->orderBy('shift_date')
            ->get()
            ->groupBy(fn($s) => $s->shift_date->toDateString());

        return $this->success([
            'year'     => $year,
            'month'    => $month,
            'calendar' => $shifts,
        ]);
    }
}
