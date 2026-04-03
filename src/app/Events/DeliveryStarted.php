<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DeliveryStarted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly int $shopId,
        public readonly int $deliveryId,
        public readonly int $userId,
        public readonly string $userName,
        public readonly int $routeId,
        public readonly string $startedAt,
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel("shop.{$this->shopId}")];
    }

    public function broadcastAs(): string
    {
        return 'delivery.started';
    }

    public function broadcastWith(): array
    {
        return [
            'delivery_id' => $this->deliveryId,
            'user_id'     => $this->userId,
            'user_name'   => $this->userName,
            'route_id'    => $this->routeId,
            'started_at'  => $this->startedAt,
        ];
    }
}
