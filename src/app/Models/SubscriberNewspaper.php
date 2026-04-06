<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubscriberNewspaper extends Model
{
    protected $fillable = [
        'subscriber_id', 'newspaper_type_id', 'quantity',
        'day_schedule', 'delivery_days', 'start_date', 'end_date',
    ];

    protected function casts(): array
    {
        return [
            'start_date'    => 'date',
            'end_date'      => 'date',
            'day_schedule'  => 'array',
            'delivery_days' => 'array', // [1,2,3,4,5,6,7] — 1=Mon...7=Sun, null=every day
        ];
    }

    /**
     * Return the effective quantity for a given day type.
     * day_type: 'weekday' | 'saturday' | 'sunday' | 'holiday'
     */
    public function quantityForDayType(string $dayType): int
    {
        if ($this->day_schedule && isset($this->day_schedule[$dayType])) {
            return (int) $this->day_schedule[$dayType];
        }
        return $this->quantity;
    }

    /**
     * Check whether this newspaper is delivered on the given day-of-week.
     * @param int $dayOfWeek  1=Mon, 2=Tue, ..., 7=Sun
     */
    public function deliversOnDay(int $dayOfWeek): bool
    {
        if (empty($this->delivery_days)) {
            return true; // null = every day
        }
        return in_array($dayOfWeek, $this->delivery_days, true);
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
