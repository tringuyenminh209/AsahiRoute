<?php

namespace App\Http\Requests\Delivery;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LogDeliveryPointRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'delivery_id'    => ['required', 'integer', 'exists:deliveries,id'],
            'route_point_id' => ['required', 'integer', 'exists:route_points,id'],
            'status'         => ['required', Rule::in(['delivered', 'skipped', 'failed', 'absent'])],
            'delivered_at'   => ['required', 'date'],
            'lat'            => ['sometimes', 'numeric', 'between:-90,90'],
            'lng'            => ['sometimes', 'numeric', 'between:-180,180'],
            'failure_reason' => ['required_if:status,failed', 'nullable', 'string', 'max:255'],
            'photo'          => ['sometimes', 'nullable', 'string'],
            'synced'         => ['sometimes', 'boolean'],
        ];
    }
}
