<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Delivery extends Model
{
    protected $fillable = [
        'route_id', 'user_id', 'delivery_date', 'delivery_time', 'is_learning',
        'started_at', 'completed_at', 'total_points',
        'delivered_count', 'skipped_count', 'failed_count',
        'total_distance_m', 'status',
    ];

    protected function casts(): array
    {
        return [
            'delivery_date' => 'date',
            'started_at'    => 'datetime',
            'completed_at'  => 'datetime',
            'is_learning'   => 'boolean',
        ];
    }

    public function route(): BelongsTo
    {
        return $this->belongsTo(Route::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function deliveryLogs(): HasMany
    {
        return $this->hasMany(DeliveryLog::class);
    }
}
