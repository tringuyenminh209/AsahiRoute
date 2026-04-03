<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubscriberNewspaper extends Model
{
    protected $fillable = [
        'subscriber_id', 'newspaper_type_id', 'quantity', 'start_date', 'end_date',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date'   => 'date',
        ];
    }

    public function subscriber(): BelongsTo
    {
        return $this->belongsTo(Subscriber::class);
    }

    public function newspaperType(): BelongsTo
    {
        return $this->belongsTo(NewspaperType::class);
    }
}
