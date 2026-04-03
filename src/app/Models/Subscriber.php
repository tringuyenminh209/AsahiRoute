<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Subscriber extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'area_id', 'customer_code', 'name', 'name_kana',
        'address', 'address_kana', 'address_detail', 'postal_code',
        'lat', 'lng', 'phone', 'delivery_note', 'delivery_note_translations', 'photos',
    ];

    protected function casts(): array
    {
        return [
            'lat'                        => 'float',
            'lng'                        => 'float',
            'delivery_note_translations' => 'array',
            'photos'                     => 'array',
        ];
    }

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }

    public function subscriberNewspapers(): HasMany
    {
        return $this->hasMany(SubscriberNewspaper::class);
    }

    public function newspaperTypes(): BelongsToMany
    {
        return $this->belongsToMany(NewspaperType::class, 'subscriber_newspapers')
            ->withPivot('quantity', 'start_date', 'end_date')
            ->withTimestamps();
    }

    public function routePoints(): HasMany
    {
        return $this->hasMany(RoutePoint::class);
    }

    public function suspensions(): HasMany
    {
        return $this->hasMany(Suspension::class);
    }

    public function activeSuspensions(): HasMany
    {
        return $this->hasMany(Suspension::class)
            ->where('status', 'active')
            ->whereDate('start_date', '<=', now())
            ->whereDate('end_date', '>=', now());
    }
}
