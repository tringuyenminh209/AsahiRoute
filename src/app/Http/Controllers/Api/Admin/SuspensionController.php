<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Models\Suspension;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SuspensionController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $shopId = $request->user()->shop_id;

        $query = Suspension::whereHas('subscriber.area', fn($q) => $q->where('shop_id', $shopId))
            ->with(['subscriber.area', 'registeredBy']);

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($from = $request->query('from')) {
            $query->whereDate('start_date', '>=', $from);
        }

        if ($to = $request->query('to')) {
            $query->whereDate('end_date', '<=', $to);
        }

        $paginator = $query->orderByDesc('start_date')->paginate(20);

        return $this->paginated($paginator);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'subscriber_id' => ['required', 'integer', 'exists:subscribers,id'],
            'start_date'    => ['required', 'date_format:Y-m-d'],
            'end_date'      => ['required', 'date_format:Y-m-d', 'after_or_equal:start_date'],
            'reason'        => ['sometimes', 'nullable', 'string', 'max:255'],
            'newspapers'    => ['sometimes', 'nullable', 'array'],
        ]);

        $suspension = Suspension::create([
            ...$data,
            'registered_by' => $request->user()->id,
            'status'        => now()->toDateString() <= $data['start_date'] ? 'scheduled' : 'active',
        ]);

        return $this->created($suspension->load('subscriber', 'registeredBy'), '留守止めを登録しました');
    }

    public function show(Request $request, Suspension $suspension): JsonResponse
    {
        return $this->success($suspension->load('subscriber', 'registeredBy', 'cancelledBy'));
    }

    public function update(Request $request, Suspension $suspension): JsonResponse
    {
        $data = $request->validate([
            'start_date' => ['sometimes', 'date_format:Y-m-d'],
            'end_date'   => ['sometimes', 'date_format:Y-m-d'],
            'reason'     => ['sometimes', 'nullable', 'string'],
            'status'     => ['sometimes', 'in:scheduled,active,completed,cancelled'],
        ]);

        if (isset($data['status']) && $data['status'] === 'cancelled') {
            $data['cancelled_by'] = $request->user()->id;
            $data['cancelled_at'] = now();
        }

        $suspension->update($data);

        return $this->success($suspension->fresh(), '留守止めを更新しました');
    }

    public function destroy(Request $request, Suspension $suspension): JsonResponse
    {
        $suspension->update([
            'status'       => 'cancelled',
            'cancelled_by' => $request->user()->id,
            'cancelled_at' => now(),
        ]);

        return $this->noContent();
    }

    /**
     * GET /api/v1/admin/suspensions/calendar?year=2026&month=4
     */
    public function calendar(Request $request): JsonResponse
    {
        $request->validate([
            'year'  => ['required', 'integer', 'min:2020', 'max:2099'],
            'month' => ['required', 'integer', 'min:1', 'max:12'],
        ]);

        $shopId = $request->user()->shop_id;
        $year   = $request->integer('year');
        $month  = $request->integer('month');

        $from = sprintf('%04d-%02d-01', $year, $month);
        $to   = sprintf('%04d-%02d-%02d', $year, $month, cal_days_in_month(CAL_GREGORIAN, $month, $year));

        $suspensions = Suspension::whereHas('subscriber.area', fn($q) => $q->where('shop_id', $shopId))
            ->where('status', '!=', 'cancelled')
            ->where('start_date', '<=', $to)
            ->where('end_date', '>=', $from)
            ->with('subscriber')
            ->get();

        // 日付ごとにグループ化
        $calendar = [];
        foreach ($suspensions as $suspension) {
            $start = max($suspension->start_date->toDateString(), $from);
            $end   = min($suspension->end_date->toDateString(), $to);

            $current = $start;
            while ($current <= $end) {
                $calendar[$current][] = [
                    'id'              => $suspension->id,
                    'subscriber_name' => $suspension->subscriber->name,
                    'reason'          => $suspension->reason,
                ];
                $current = date('Y-m-d', strtotime($current . ' +1 day'));
            }
        }

        return $this->success([
            'year'     => $year,
            'month'    => $month,
            'calendar' => $calendar,
        ]);
    }
}
