<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeliveryLog extends Model
{
    protected $fillable = [
        'delivery_id', 'route_point_id', 'status',
        'delivered_at', 'lat', 'lng', 'failure_reason', 'photo', 'synced',
    ];

    protected function casts(): array
    {
        return [
            'delivered_at' => 'datetime',
            'lat'          => 'float',
            'lng'          => 'float',
            'synced'       => 'boolean',
        ];
    }

    public function delivery(): BelongsTo
    {
        return $this->belongsTo(Delivery::class);
    }

    public function routePoint(): BelongsTo
    {
        return $this->belongsTo(RoutePoint::class);
    }
}
