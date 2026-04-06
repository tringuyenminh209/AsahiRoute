<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Models\SpecialDay;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SpecialDayController extends ApiController
{
    /** GET /api/v1/admin/special-days?year=2026&month=4 */
    public function index(Request $request): JsonResponse
    {
        $shopId = $request->user()->shop_id;
        $query  = SpecialDay::where('shop_id', $shopId)->orderBy('date');

        if ($year = $request->query('year')) {
            $query->whereYear('date', $year);
        }
        if ($month = $request->query('month')) {
            $query->whereMonth('date', $month);
        }

        return $this->success($query->get());
    }

    /** POST /api/v1/admin/special-days */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'date'     => 'required|date',
            'name'     => 'required|string|max:100',
            'day_type' => 'in:holiday,special',
            'note'     => 'nullable|string|max:500',
        ]);

        $day = SpecialDay::updateOrCreate(
            ['shop_id' => $request->user()->shop_id, 'date' => $data['date']],
            ['name' => $data['name'], 'day_type' => $data['day_type'] ?? 'holiday', 'note' => $data['note'] ?? null]
        );

        return $this->created($day, '特別日を登録しました');
    }

    /** DELETE /api/v1/admin/special-days/{specialDay} */
    public function destroy(Request $request, SpecialDay $specialDay): JsonResponse
    {
        if ($specialDay->shop_id !== $request->user()->shop_id) {
            return $this->forbidden();
        }
        $specialDay->delete();
        return $this->success(null, '特別日を削除しました');
    }
}
