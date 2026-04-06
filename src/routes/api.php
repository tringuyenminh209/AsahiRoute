<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — AsahiRoute v1
|--------------------------------------------------------------------------
| prefix: /api/v1
| auth:   Laravel Sanctum (Bearer token)
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    // ── Company Admin (会社管理者) ──────────────────────────────────────
    Route::middleware(['auth:sanctum', 'company_admin'])->prefix('company')->group(function () {
        Route::get('dashboard',                    [\App\Http\Controllers\Api\Company\DashboardController::class, 'summary']);

        Route::get('shops',                        [\App\Http\Controllers\Api\Company\ShopController::class, 'index']);
        Route::post('shops',                       [\App\Http\Controllers\Api\Company\ShopController::class, 'store']);
        Route::get('shops/{shop}',                 [\App\Http\Controllers\Api\Company\ShopController::class, 'show']);
        Route::put('shops/{shop}',                 [\App\Http\Controllers\Api\Company\ShopController::class, 'update']);
        Route::delete('shops/{shop}',              [\App\Http\Controllers\Api\Company\ShopController::class, 'destroy']);
        Route::get('shops/{shop}/users',           [\App\Http\Controllers\Api\Company\ShopController::class, 'users']);
        Route::post('shops/{shop}/users',          [\App\Http\Controllers\Api\Company\ShopController::class, 'addUser']);
    });

    // ── Auth (Phase 2) ─────────────────────────────────────────────────
    Route::prefix('auth')->group(function () {
        Route::post('login', [\App\Http\Controllers\Api\Auth\AuthController::class, 'login']);

        Route::middleware('auth:sanctum')->group(function () {
            Route::post('logout',          [\App\Http\Controllers\Api\Auth\AuthController::class, 'logout']);
            Route::get('me',               [\App\Http\Controllers\Api\Auth\AuthController::class, 'me']);
            Route::put('settings',         [\App\Http\Controllers\Api\Auth\AuthController::class, 'updateSettings']);
        });
    });

    // ── Delivery / Mobile (Phase 3) ────────────────────────────────────
    Route::middleware(['auth:sanctum', 'deliverer'])->prefix('delivery')->group(function () {
        Route::get('my-routes',                    [\App\Http\Controllers\Api\Delivery\DeliveryController::class, 'myRoutes']);
        Route::post('start',                       [\App\Http\Controllers\Api\Delivery\DeliveryController::class, 'start']);
        Route::post('log',                         [\App\Http\Controllers\Api\Delivery\DeliveryController::class, 'logPoint']);
        Route::get('{delivery}/logs',              [\App\Http\Controllers\Api\Delivery\DeliveryController::class, 'getLogs']);
        Route::post('{delivery}/complete',         [\App\Http\Controllers\Api\Delivery\DeliveryController::class, 'complete']);
        Route::post('sync',                        [\App\Http\Controllers\Api\Delivery\DeliveryController::class, 'sync']);
        Route::post('location',                    [\App\Http\Controllers\Api\Delivery\DeliveryController::class, 'location']);

        Route::get('notifications',                [\App\Http\Controllers\Api\Delivery\NotificationController::class, 'index']);
        Route::put('notifications/read-all',       [\App\Http\Controllers\Api\Delivery\NotificationController::class, 'markAllRead']);
        Route::put('notifications/{notification}/read', [\App\Http\Controllers\Api\Delivery\NotificationController::class, 'markRead']);

        Route::post('sos',                         [\App\Http\Controllers\Api\Delivery\SosController::class, 'trigger']);

        // Delivery worker: update newspaper delivery days for a subscriber
        Route::put('subscribers/{subscriber}/newspapers/{subscriberNewspaper}/delivery-days',
            [\App\Http\Controllers\Api\Delivery\DeliveryController::class, 'updateDeliveryDays']);

        // Delivery worker: newspaper types available for a route
        Route::get('routes/{route}/newspaper-types',
            [\App\Http\Controllers\Api\Delivery\DeliveryController::class, 'getRouteNewspaperTypes']);

        // Delivery worker: add a new subscriber to their own route
        Route::post('routes/{route}/subscribers',
            [\App\Http\Controllers\Api\Delivery\DeliveryController::class, 'addSubscriber']);
    });

    // ── Admin (Phase 4) ────────────────────────────────────────────────
    Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {

        // Dashboard
        Route::get('dashboard/summary',  [\App\Http\Controllers\Api\Admin\DashboardController::class, 'summary']);
        Route::get('dashboard/today',    [\App\Http\Controllers\Api\Admin\DashboardController::class, 'today']);
        Route::get('dashboard/alerts',   [\App\Http\Controllers\Api\Admin\DashboardController::class, 'alerts']);

        // Areas
        Route::apiResource('areas', \App\Http\Controllers\Api\Admin\AreaController::class);

        // Newspaper Types
        Route::apiResource('newspaper-types', \App\Http\Controllers\Api\Admin\NewspaperTypeController::class);

        // Subscribers
        Route::post('subscribers/import',          [\App\Http\Controllers\Api\Admin\SubscriberController::class, 'import']);
        Route::get('subscribers/export',           [\App\Http\Controllers\Api\Admin\SubscriberController::class, 'export']);
        Route::post('subscribers/{subscriber}/photos', [\App\Http\Controllers\Api\Admin\SubscriberController::class, 'uploadPhoto']);
        Route::apiResource('subscribers', \App\Http\Controllers\Api\Admin\SubscriberController::class);

        // Routes
        Route::put('routes/{route}/reorder',       [\App\Http\Controllers\Api\Admin\RouteController::class, 'reorder']);
        Route::post('routes/{route}/optimize',     [\App\Http\Controllers\Api\Admin\RouteController::class, 'optimize']);
        Route::get('routes/{route}/preview',       [\App\Http\Controllers\Api\Admin\RouteController::class, 'preview']);
        Route::get('routes/{route}/print',         [\App\Http\Controllers\Api\Admin\RouteController::class, 'print']);
        Route::post('routes/{route}/assign',       [\App\Http\Controllers\Api\Admin\RouteController::class, 'assign']);
        Route::apiResource('routes', \App\Http\Controllers\Api\Admin\RouteController::class);

        // Suspensions
        Route::get('suspensions/calendar',         [\App\Http\Controllers\Api\Admin\SuspensionController::class, 'calendar']);
        Route::apiResource('suspensions', \App\Http\Controllers\Api\Admin\SuspensionController::class);

        // New Insertions
        Route::post('insertions/{insertion}/approve',         [\App\Http\Controllers\Api\Admin\InsertionController::class, 'approve']);
        Route::post('insertions/{insertion}/reject',          [\App\Http\Controllers\Api\Admin\InsertionController::class, 'reject']);
        Route::get('insertions/{insertion}/suggest-position', [\App\Http\Controllers\Api\Admin\InsertionController::class, 'suggestPosition']);
        Route::apiResource('insertions', \App\Http\Controllers\Api\Admin\InsertionController::class);

        // Users
        Route::get('users/{user}/performance',     [\App\Http\Controllers\Api\Admin\UserController::class, 'performance']);
        Route::get('users/{user}/deliveries',      [\App\Http\Controllers\Api\Admin\UserController::class, 'deliveries']);
        Route::apiResource('users', \App\Http\Controllers\Api\Admin\UserController::class);

        // Shifts
        Route::get('shifts/calendar',              [\App\Http\Controllers\Api\Admin\ShiftController::class, 'calendar']);
        Route::apiResource('shifts', \App\Http\Controllers\Api\Admin\ShiftController::class);

        // Special days (holidays / special delivery days)
        Route::get('special-days',                 [\App\Http\Controllers\Api\Admin\SpecialDayController::class, 'index']);
        Route::post('special-days',                [\App\Http\Controllers\Api\Admin\SpecialDayController::class, 'store']);
        Route::delete('special-days/{specialDay}', [\App\Http\Controllers\Api\Admin\SpecialDayController::class, 'destroy']);

        // Update newspaper day_schedule for a subscriber
        Route::put('subscribers/{subscriber}/newspapers/{subscriberNewspaper}/schedule',
            [\App\Http\Controllers\Api\Admin\SubscriberController::class, 'updateNewspaperSchedule']);

        // SOS Alerts
        Route::put('sos-alerts/{sosAlert}/acknowledge', [\App\Http\Controllers\Api\Admin\SosAlertController::class, 'acknowledge']);
        Route::put('sos-alerts/{sosAlert}/resolve',     [\App\Http\Controllers\Api\Admin\SosAlertController::class, 'resolve']);
        Route::get('sos-alerts',                        [\App\Http\Controllers\Api\Admin\SosAlertController::class, 'index']);

        // Reports
        Route::prefix('reports')->group(function () {
            Route::get('daily',            [\App\Http\Controllers\Api\Admin\ReportController::class, 'daily']);
            Route::get('weekly',           [\App\Http\Controllers\Api\Admin\ReportController::class, 'weekly']);
            Route::get('monthly',          [\App\Http\Controllers\Api\Admin\ReportController::class, 'monthly']);
            Route::get('delivery-stats',   [\App\Http\Controllers\Api\Admin\ReportController::class, 'deliveryStats']);
            Route::get('area-stats',       [\App\Http\Controllers\Api\Admin\ReportController::class, 'areaStats']);
            Route::get('user-performance', [\App\Http\Controllers\Api\Admin\ReportController::class, 'userPerformance']);
            Route::get('hourly',           [\App\Http\Controllers\Api\Admin\ReportController::class, 'hourly']);
        });

        // Audit Logs
        Route::get('audit-logs',           [\App\Http\Controllers\Api\Admin\AuditLogController::class, 'index']);
        Route::get('audit-logs/export',    [\App\Http\Controllers\Api\Admin\AuditLogController::class, 'export']);

        // Global Search
        Route::get('search',               [\App\Http\Controllers\Api\Admin\SearchController::class, 'search']);
    });
});
