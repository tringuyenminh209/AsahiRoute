<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DeliveryPointLogged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly int    $shopId,
        public readonly int    $deliveryId,
        public readonly int    $userId,
        public readonly int    $routePointId,
        public readonly string $status,
        public readonly int    $completedCount,
        public readonly int    $totalCount,
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel("shop.{$this->shopId}")];
    }

    public function broadcastAs(): string
    {
        return 'delivery.point_logged';
    }

    public function broadcastWith(): array
    {
        return [
            'delivery_id'      => $this->deliveryId,
            'user_id'          => $this->userId,
            'route_point_id'   => $this->routePointId,
            'status'           => $this->status,
            'completed_count'  => $this->completedCount,
            'total_count'      => $this->totalCount,
        ];
    }
}
