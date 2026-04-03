<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'lang'            => ['sometimes', Rule::in(['ja', 'en', 'vi', 'zh', 'ko', 'ne'])],
            'font_size'       => ['sometimes', Rule::in(['small', 'medium', 'large', 'extra_large'])],
            'voice_guide'     => ['sometimes', 'boolean'],
            'dark_mode'       => ['sometimes', Rule::in(['auto', 'on', 'off'])],
            'onboarding_done' => ['sometimes', 'boolean'],
        ];
    }
}
