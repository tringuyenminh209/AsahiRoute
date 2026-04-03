<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Route extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'area_id', 'assigned_user_id', 'name', 'delivery_time',
        'total_points', 'estimated_duration_min', 'estimated_distance_m', 'optimized_at',
    ];

    protected function casts(): array
    {
        return [
            'optimized_at' => 'datetime',
        ];
    }

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    public function routePoints(): HasMany
    {
        return $this->hasMany(RoutePoint::class)->orderBy('sequence_order');
    }

    public function deliveries(): HasMany
    {
        return $this->hasMany(Delivery::class);
    }

    public function shifts(): HasMany
    {
        return $this->hasMany(Shift::class);
    }

    public function newInsertions(): HasMany
    {
        return $this->hasMany(NewInsertion::class);
    }
}
