<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NewspaperType extends Model
{
    protected $fillable = [
        'shop_id', 'name', 'code', 'delivery_time',
    ];

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function subscriberNewspapers(): HasMany
    {
        return $this->hasMany(SubscriberNewspaper::class);
    }
}
