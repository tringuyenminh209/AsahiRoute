<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DelivererStatusChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly int    $shopId,
        public readonly int    $userId,
        public readonly string $userName,
        public readonly string $status, // 'online' | 'offline' | 'delivering' | 'break'
        public readonly string $updatedAt,
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel("shop.{$this->shopId}")];
    }

    public function broadcastAs(): string
    {
        return 'deliverer.status_changed';
    }

    public function broadcastWith(): array
    {
        return [
            'user_id'    => $this->userId,
            'user_name'  => $this->userName,
            'status'     => $this->status,
            'updated_at' => $this->updatedAt,
        ];
    }
}
