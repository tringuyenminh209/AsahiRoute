<?php

namespace App\Http\Requests\Delivery;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StartDeliveryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'route_id'      => ['required', 'integer', 'exists:routes,id'],
            'delivery_date' => ['required', 'date_format:Y-m-d'],
            'delivery_time' => ['required', Rule::in(['morning', 'evening'])],
            'is_learning'   => ['sometimes', 'boolean'],
        ];
    }
}
