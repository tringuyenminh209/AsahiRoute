<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SosAlertCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly int    $shopId,
        public readonly int    $alertId,
        public readonly int    $userId,
        public readonly string $userName,
        public readonly float  $lat,
        public readonly float  $lng,
        public readonly string $notes,
        public readonly string $createdAt,
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel("shop.{$this->shopId}")];
    }

    public function broadcastAs(): string
    {
        return 'sos.created';
    }

    public function broadcastWith(): array
    {
        return [
            'alert_id'   => $this->alertId,
            'user_id'    => $this->userId,
            'user_name'  => $this->userName,
            'lat'        => $this->lat,
            'lng'        => $this->lng,
            'notes'      => $this->notes,
            'created_at' => $this->createdAt,
        ];
    }
}
