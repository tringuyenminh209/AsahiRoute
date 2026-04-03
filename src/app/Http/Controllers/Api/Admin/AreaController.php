<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Models\Area;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AreaController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $areas = Area::where('shop_id', $request->user()->shop_id)
            ->withCount('subscribers', 'routes')
            ->orderBy('code')
            ->get();

        return $this->success($areas);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'             => ['required', 'string', 'max:100'],
            'code'             => ['required', 'string', 'max:20'],
            'boundary_geojson' => ['sometimes', 'nullable', 'string'],
            'color'            => ['sometimes', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ]);

        $area = Area::create([...$data, 'shop_id' => $request->user()->shop_id]);

        return $this->created($area, 'エリアを作成しました');
    }

    public function show(Request $request, Area $area): JsonResponse
    {
        $this->authorizeShop($request, $area->shop_id);

        $area->loadCount('subscribers', 'routes');

        return $this->success($area);
    }

    public function update(Request $request, Area $area): JsonResponse
    {
        $this->authorizeShop($request, $area->shop_id);

        $data = $request->validate([
            'name'             => ['sometimes', 'string', 'max:100'],
            'code'             => ['sometimes', 'string', 'max:20'],
            'boundary_geojson' => ['sometimes', 'nullable', 'string'],
            'color'            => ['sometimes', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ]);

        $area->update($data);

        return $this->success($area, 'エリアを更新しました');
    }

    public function destroy(Request $request, Area $area): JsonResponse
    {
        $this->authorizeShop($request, $area->shop_id);
        $area->delete();

        return $this->noContent();
    }

    private function authorizeShop(Request $request, int $shopId): void
    {
        if ($request->user()->shop_id !== $shopId) {
            abort(403);
        }
    }
}
