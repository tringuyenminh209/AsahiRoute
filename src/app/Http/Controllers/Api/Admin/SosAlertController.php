<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Models\SosAlert;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SosAlertController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = SosAlert::where('shop_id', $request->user()->shop_id)
            ->with(['user', 'acknowledgedBy']);

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $paginator = $query->orderByDesc('created_at')->paginate(20);

        return $this->paginated($paginator);
    }

    public function acknowledge(Request $request, SosAlert $sosAlert): JsonResponse
    {
        if ($sosAlert->shop_id !== $request->user()->shop_id) {
            abort(403);
        }

        $sosAlert->update([
            'status'          => 'acknowledged',
            'acknowledged_by' => $request->user()->id,
            'acknowledged_at' => now(),
        ]);

        return $this->success($sosAlert->fresh(), '対応中に更新しました');
    }

    public function resolve(Request $request, SosAlert $sosAlert): JsonResponse
    {
        if ($sosAlert->shop_id !== $request->user()->shop_id) {
            abort(403);
        }

        $sosAlert->update([
            'status'      => 'resolved',
            'resolved_at' => now(),
            'notes'       => $request->input('notes', $sosAlert->notes),
        ]);

        return $this->success($sosAlert->fresh(), '解決済みに更新しました');
    }
}
