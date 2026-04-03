<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LocationUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly int    $shopId,
        public readonly int    $userId,
        public readonly string $userName,
        public readonly float  $lat,
        public readonly float  $lng,
        public readonly float  $speed,
        public readonly string $updatedAt,
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel("shop.{$this->shopId}")];
    }

    public function broadcastAs(): string
    {
        return 'location.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'user_id'    => $this->userId,
            'user_name'  => $this->userName,
            'lat'        => $this->lat,
            'lng'        => $this->lng,
            'speed'      => $this->speed,
            'updated_at' => $this->updatedAt,
        ];
    }
}
