<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SpecialDay extends Model
{
    protected $fillable = ['shop_id', 'date', 'name', 'day_type', 'note'];

    protected function casts(): array
    {
        return ['date' => 'date'];
    }

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }
}
