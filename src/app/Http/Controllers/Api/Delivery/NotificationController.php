<?php

namespace App\Http\Controllers\Api\Delivery;

use App\Http\Controllers\Api\ApiController;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends ApiController
{
    /**
     * GET /api/v1/delivery/notifications
     */
    public function index(Request $request): JsonResponse
    {
        $query = Notification::where('user_id', $request->user()->id)
            ->orderByDesc('created_at');

        if ($request->boolean('unread_only')) {
            $query->unread();
        }

        $limit = min((int) $request->query('limit', 20), 100);
        $notifications = $query->limit($limit)->get();

        return $this->success([
            'notifications' => $notifications->map(fn($n) => [
                'id'         => $n->id,
                'type'       => $n->type,
                'title'      => $n->title,
                'body'       => $n->body,
                'data'       => $n->data,
                'read_at'    => $n->read_at,
                'created_at' => $n->created_at,
            ]),
            'unread_count' => Notification::where('user_id', $request->user()->id)
                ->unread()->count(),
        ]);
    }

    /**
     * PUT /api/v1/delivery/notifications/{notification}/read
     */
    public function markRead(Request $request, string $notificationId): JsonResponse
    {
        $notification = Notification::where('id', $notificationId)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$notification) {
            return $this->notFound('通知が見つかりません');
        }

        if (!$notification->read_at) {
            $notification->update(['read_at' => now()]);
        }

        return $this->success(null, '既読にしました');
    }

    /**
     * PUT /api/v1/delivery/notifications/read-all
     */
    public function markAllRead(Request $request): JsonResponse
    {
        $count = Notification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return $this->success(['updated' => $count], "全{$count}件を既読にしました");
    }
}
