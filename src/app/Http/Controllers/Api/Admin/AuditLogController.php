<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = AuditLog::where('shop_id', $request->user()->shop_id)
            ->with('user')
            ->orderByDesc('created_at');

        if ($action = $request->query('action')) {
            $query->where('action', $action);
        }

        if ($type = $request->query('type')) {
            $query->where('auditable_type', 'App\\Models\\' . $type);
        }

        if ($userId = $request->query('user_id')) {
            $query->where('user_id', $userId);
        }

        if ($from = $request->query('from')) {
            $query->where('created_at', '>=', $from);
        }

        if ($to = $request->query('to')) {
            $query->where('created_at', '<=', $to . ' 23:59:59');
        }

        $paginator = $query->paginate(50);

        return $this->paginated($paginator);
    }

    public function export(Request $request): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $shopId = $request->user()->shop_id;

        $logs = AuditLog::where('shop_id', $shopId)
            ->with('user')
            ->orderByDesc('created_at')
            ->limit(10000)
            ->get();

        return response()->streamDownload(function () use ($logs) {
            $handle = fopen('php://output', 'w');
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            fputcsv($handle, ['日時', 'ユーザー', '操作', '対象', '対象ID']);

            foreach ($logs as $log) {
                fputcsv($handle, [
                    $log->created_at->format('Y-m-d H:i:s'),
                    $log->user?->name ?? 'システム',
                    $log->action,
                    class_basename($log->auditable_type),
                    $log->auditable_id,
                ]);
            }

            fclose($handle);
        }, 'audit_logs_' . now()->format('Ymd') . '.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}
