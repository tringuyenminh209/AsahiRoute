<?php

namespace App\Http\Middleware;

use App\Http\Responses\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureIsDeliverer
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->user()) {
            return ApiResponse::unauthorized();
        }

        // Admin も配達 API にアクセス可能（テスト目的）
        if (!$request->user()->isDeliverer() && !$request->user()->isAdmin()) {
            return ApiResponse::forbidden('配達員権限が必要です');
        }

        return $next($request);
    }
}
