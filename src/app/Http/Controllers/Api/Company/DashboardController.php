<?php

namespace App\Http\Controllers\Api\Company;

use App\Http\Controllers\Api\ApiController;
use App\Models\Delivery;
use App\Models\Shop;
use App\Models\Subscriber;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends ApiController
{
    /** GET /company/dashboard — 会社全体のサマリー */
    public function summary(Request $request): JsonResponse
    {
        $companyId = $request->user()->company_id;

        $shopIds = Shop::where('company_id', $companyId)->pluck('id');

        $totalShops       = $shopIds->count();
        $totalAdmins      = User::whereIn('shop_id', $shopIds)->where('role', 'admin')->count();
        $totalDeliverers  = User::whereIn('shop_id', $shopIds)->where('role', 'deliverer')->count();
        $totalSubscribers = Subscriber::whereHas('area', fn ($q) => $q->whereIn('shop_id', $shopIds))->count();

        $today = now()->toDateString();
        $todayDeliveries = Delivery::whereIn('route_id', function ($q) use ($shopIds) {
            $q->select('routes.id')
              ->from('routes')
              ->join('areas', 'routes.area_id', '=', 'areas.id')
              ->whereIn('areas.shop_id', $shopIds);
        })->whereDate('delivery_date', $today)->count();

        $shopSummaries = Shop::where('company_id', $companyId)
            ->withCount(['users', 'areas'])
            ->get()
            ->map(fn ($shop) => [
                'id'          => $shop->id,
                'name'        => $shop->name,
                'code'        => $shop->code,
                'users_count' => $shop->users_count,
                'areas_count' => $shop->areas_count,
            ]);

        return $this->success([
            'total_shops'       => $totalShops,
            'total_admins'      => $totalAdmins,
            'total_deliverers'  => $totalDeliverers,
            'total_subscribers' => $totalSubscribers,
            'today_deliveries'  => $todayDeliveries,
            'shops'             => $shopSummaries,
        ]);
    }
}
