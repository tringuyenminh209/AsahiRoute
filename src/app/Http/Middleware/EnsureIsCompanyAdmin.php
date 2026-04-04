<?php

namespace App\Http\Middleware;

use App\Http\Responses\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureIsCompanyAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || !$user->isCompanyAdmin()) {
            return ApiResponse::forbidden('会社管理者権限が必要です');
        }

        if (!$user->company_id) {
            return ApiResponse::forbidden('会社情報が設定されていません');
        }

        return $next($request);
    }
}
