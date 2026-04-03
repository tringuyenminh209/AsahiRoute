<?php

namespace App\Http\Requests\Delivery;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SyncDeliveryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'logs'                 => ['required', 'array', 'min:1'],
            'logs.*.delivery_id'   => ['required', 'integer', 'exists:deliveries,id'],
            'logs.*.route_point_id'=> ['required', 'integer', 'exists:route_points,id'],
            'logs.*.status'        => ['required', Rule::in(['delivered', 'skipped', 'failed', 'absent'])],
            'logs.*.delivered_at'  => ['required', 'date'],
            'logs.*.lat'           => ['sometimes', 'nullable', 'numeric'],
            'logs.*.lng'           => ['sometimes', 'nullable', 'numeric'],
            'logs.*.failure_reason'=> ['sometimes', 'nullable', 'string'],
        ];
    }
}
