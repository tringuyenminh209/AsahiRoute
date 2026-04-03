<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Models\Route;
use App\Models\Subscriber;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends ApiController
{
    /**
     * GET /api/v1/admin/search?q=keyword&type=subscribers,routes,users
     */
    public function search(Request $request): JsonResponse
    {
        $request->validate([
            'q'    => ['required', 'string', 'min:2', 'max:100'],
            'type' => ['sometimes', 'string'],
        ]);

        $q      = $request->q;
        $shopId = $request->user()->shop_id;
        $types  = $request->query('type')
            ? explode(',', $request->query('type'))
            : ['subscribers', 'routes', 'users'];

        $results = [];

        if (in_array('subscribers', $types)) {
            $results['subscribers'] = Subscriber::whereHas('area', fn($qu) => $qu->where('shop_id', $shopId))
                ->where(fn($qu) => $qu
                    ->where('name', 'like', "%{$q}%")
                    ->orWhere('customer_code', 'like', "%{$q}%")
                    ->orWhere('address', 'like', "%{$q}%")
                    ->orWhere('name_kana', 'like', "%{$q}%")
                )
                ->select('id', 'customer_code', 'name', 'address')
                ->limit(10)
                ->get();
        }

        if (in_array('routes', $types)) {
            $results['routes'] = Route::whereHas('area', fn($qu) => $qu->where('shop_id', $shopId))
                ->where('name', 'like', "%{$q}%")
                ->with('area')
                ->select('id', 'name', 'delivery_time', 'area_id')
                ->limit(10)
                ->get();
        }

        if (in_array('users', $types)) {
            $results['users'] = User::where('shop_id', $shopId)
                ->where(fn($qu) => $qu
                    ->where('name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%")
                )
                ->select('id', 'name', 'email', 'role')
                ->limit(10)
                ->get();
        }

        return $this->success($results);
    }
}
