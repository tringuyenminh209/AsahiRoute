<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Models\NewspaperType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NewspaperTypeController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $types = NewspaperType::where('shop_id', $request->user()->shop_id)
            ->orderBy('delivery_time')->orderBy('name')->get();

        return $this->success($types);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'          => ['required', 'string', 'max:100'],
            'code'          => ['required', 'string', 'max:20'],
            'delivery_time' => ['required', 'in:morning,evening'],
        ]);

        $type = NewspaperType::create([...$data, 'shop_id' => $request->user()->shop_id]);

        return $this->created($type, '新聞種別を作成しました');
    }

    public function show(Request $request, NewspaperType $newspaperType): JsonResponse
    {
        return $this->success($newspaperType);
    }

    public function update(Request $request, NewspaperType $newspaperType): JsonResponse
    {
        $data = $request->validate([
            'name'          => ['sometimes', 'string', 'max:100'],
            'code'          => ['sometimes', 'string', 'max:20'],
            'delivery_time' => ['sometimes', 'in:morning,evening'],
        ]);

        $newspaperType->update($data);

        return $this->success($newspaperType->fresh(), '更新しました');
    }

    public function destroy(Request $request, NewspaperType $newspaperType): JsonResponse
    {
        $newspaperType->delete();
        return $this->noContent();
    }
}
