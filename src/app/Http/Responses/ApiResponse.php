<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;

class ApiResponse
{
    public static function success(
        mixed $data = null,
        string $message = 'OK',
        int $status = 200,
        array $meta = []
    ): JsonResponse {
        $payload = [
            'success' => true,
            'data'    => $data,
            'message' => $message,
        ];

        if (!empty($meta)) {
            $payload['meta'] = $meta;
        }

        return response()->json($payload, $status);
    }

    public static function created(mixed $data = null, string $message = '作成しました'): JsonResponse
    {
        return self::success($data, $message, 201);
    }

    public static function noContent(): JsonResponse
    {
        return response()->json(null, 204);
    }

    public static function error(
        string $code,
        string $message,
        int $status = 400,
        array $details = []
    ): JsonResponse {
        $payload = [
            'success' => false,
            'error'   => [
                'code'    => $code,
                'message' => $message,
            ],
        ];

        if (!empty($details)) {
            $payload['error']['details'] = $details;
        }

        return response()->json($payload, $status);
    }

    public static function validationError(array $errors): JsonResponse
    {
        return self::error('VALIDATION_ERROR', '入力内容を確認してください', 422, $errors);
    }

    public static function unauthorized(string $message = '認証が必要です'): JsonResponse
    {
        return self::error('UNAUTHORIZED', $message, 401);
    }

    public static function forbidden(string $message = 'アクセス権限がありません'): JsonResponse
    {
        return self::error('FORBIDDEN', $message, 403);
    }

    public static function notFound(string $message = 'データが見つかりません'): JsonResponse
    {
        return self::error('NOT_FOUND', $message, 404);
    }

    public static function conflict(string $message, array $conflictData = []): JsonResponse
    {
        return self::error('CONFLICT', $message, 409, $conflictData);
    }

    public static function serverError(string $message = 'サーバーエラーが発生しました'): JsonResponse
    {
        return self::error('SERVER_ERROR', $message, 500);
    }

    public static function paginated(
        mixed $data,
        int $currentPage,
        int $perPage,
        int $total,
        string $message = 'OK'
    ): JsonResponse {
        return self::success($data, $message, 200, [
            'current_page' => $currentPage,
            'per_page'     => $perPage,
            'total'        => $total,
            'last_page'    => (int) ceil($total / $perPage),
        ]);
    }
}
