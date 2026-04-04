<?php

namespace App\Http\Controllers\Api\Delivery;

use App\Events\SosAlertCreated;
use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Delivery\SosRequest;
use App\Models\Notification;
use App\Models\SosAlert;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class SosController extends ApiController
{
    /**
     * POST /api/v1/delivery/sos
     * SOS緊急アラートを発火し、管理者へ通知する
     */
    public function trigger(SosRequest $request): JsonResponse
    {
        $user = $request->user();

        $alert = SosAlert::create([
            'user_id' => $user->id,
            'shop_id' => $user->shop_id,
            'lat'     => $request->lat,
            'lng'     => $request->lng,
            'status'  => 'sent',
            'notes'   => $request->notes,
        ]);

        // 同じ店の管理者に通知を作成
        $admins = User::where('shop_id', $user->shop_id)
            ->where('role', 'admin')
            ->whereNull('deleted_at')
            ->get();

        foreach ($admins as $admin) {
            Notification::create([
                'id'      => Str::uuid(),
                'user_id' => $admin->id,
                'type'    => 'sos_alert',
                'title'   => '🆘 SOSアラート',
                'body'    => "{$user->name} さんが緊急ヘルプを要請しました",
                'data'    => [
                    'sos_alert_id' => $alert->id,
                    'user_name'    => $user->name,
                    'lat'          => $request->lat,
                    'lng'          => $request->lng,
                ],
            ]);
        }

        broadcast(new SosAlertCreated(
            shopId:    $user->shop_id,
            alertId:   $alert->id,
            userId:    $user->id,
            userName:  $user->name,
            lat:       (float) $request->lat,
            lng:       (float) $request->lng,
            notes:     $request->notes ?? '',
            createdAt: $alert->created_at->toIso8601String(),
        ))->toOthers();

        return $this->created([
            'sos_alert_id' => $alert->id,
            'status'       => $alert->status,
        ], 'SOSアラートを送信しました。管理者に通知されます。');
    }
}
