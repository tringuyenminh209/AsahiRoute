<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DeliveryCompleted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly int    $shopId,
        public readonly int    $deliveryId,
        public readonly int    $userId,
        public readonly string $userName,
        public readonly int    $deliveredCount,
        public readonly int    $totalCount,
        public readonly float  $completionRate,
        public readonly int    $durationMinutes,
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel("shop.{$this->shopId}")];
    }

    public function broadcastAs(): string
    {
        return 'delivery.completed';
    }

    public function broadcastWith(): array
    {
        return [
            'delivery_id'      => $this->deliveryId,
            'user_id'          => $this->userId,
            'user_name'        => $this->userName,
            'delivered_count'  => $this->deliveredCount,
            'total_count'      => $this->totalCount,
            'completion_rate'  => $this->completionRate,
            'duration_minutes' => $this->durationMinutes,
        ];
    }
}
