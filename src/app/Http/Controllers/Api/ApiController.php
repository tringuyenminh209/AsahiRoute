<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;

abstract class ApiController extends Controller
{
    protected function success(mixed $data = null, string $message = 'OK', int $status = 200): JsonResponse
    {
        return ApiResponse::success($data, $message, $status);
    }

    protected function created(mixed $data = null, string $message = '作成しました'): JsonResponse
    {
        return ApiResponse::created($data, $message);
    }

    protected function noContent(): JsonResponse
    {
        return ApiResponse::noContent();
    }

    protected function notFound(string $message = 'データが見つかりません'): JsonResponse
    {
        return ApiResponse::notFound($message);
    }

    protected function forbidden(string $message = 'アクセス権限がありません'): JsonResponse
    {
        return ApiResponse::forbidden($message);
    }

    protected function conflict(string $message, array $data = []): JsonResponse
    {
        return ApiResponse::conflict($message, $data);
    }

    protected function paginated($paginator, string $message = 'OK'): JsonResponse
    {
        return ApiResponse::paginated(
            $paginator->items(),
            $paginator->currentPage(),
            $paginator->perPage(),
            $paginator->total(),
            $message
        );
    }
}
