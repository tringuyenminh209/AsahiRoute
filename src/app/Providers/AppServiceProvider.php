<?php

namespace App\Providers;

use App\Models\Subscriber;
use App\Models\Suspension;
use App\Models\NewInsertion;
use App\Models\Route;
use App\Models\RoutePoint;
use App\Models\User;
use App\Observers\AuditObserver;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        // Audit logging — 重要な操作を自動記録
        Subscriber::observe(AuditObserver::class);
        Suspension::observe(AuditObserver::class);
        NewInsertion::observe(AuditObserver::class);
        Route::observe(AuditObserver::class);
        RoutePoint::observe(AuditObserver::class);
        User::observe(AuditObserver::class);
    }
}
