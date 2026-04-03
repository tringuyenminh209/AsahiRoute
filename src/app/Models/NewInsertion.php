<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NewInsertion extends Model
{
    protected $fillable = [
        'subscriber_id', 'route_id', 'registered_by', 'approved_by',
        'suggested_order', 'actual_order', 'status', 'effective_date', 'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'effective_date' => 'date',
            'approved_at'    => 'datetime',
        ];
    }

    public function subscriber(): BelongsTo
    {
        return $this->belongsTo(Subscriber::class);
    }

    public function route(): BelongsTo
    {
        return $this->belongsTo(Route::class);
    }

    public function registeredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registered_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
