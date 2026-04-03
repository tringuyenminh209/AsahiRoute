<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SosAlert extends Model
{
    protected $fillable = [
        'user_id', 'shop_id', 'acknowledged_by', 'lat', 'lng',
        'status', 'notes', 'acknowledged_at', 'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'lat'             => 'float',
            'lng'             => 'float',
            'acknowledged_at' => 'datetime',
            'resolved_at'     => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function acknowledgedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'acknowledged_by');
    }
}
