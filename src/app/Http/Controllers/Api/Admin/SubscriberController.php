<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Models\Area;
use App\Models\Subscriber;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriberController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $shopId = $request->user()->shop_id;

        $query = Subscriber::whereHas('area', fn($q) => $q->where('shop_id', $shopId))
            ->with(['area', 'subscriberNewspapers.newspaperType'])
            ->withCount([
                'suspensions as active_suspension_count' => fn($q) => $q->where('status', 'active'),
            ]);

        // フィルター
        if ($areaId = $request->query('area_id')) {
            $query->where('area_id', $areaId);
        }

        if ($keyword = $request->query('q')) {
            $query->where(function ($q) use ($keyword) {
                $q->where('name', 'like', "%{$keyword}%")
                    ->orWhere('customer_code', 'like', "%{$keyword}%")
                    ->orWhere('address', 'like', "%{$keyword}%")
                    ->orWhere('name_kana', 'like', "%{$keyword}%");
            });
        }

        if ($request->query('suspended') === 'true') {
            $query->whereHas('suspensions', fn($q) => $q->where('status', 'active'));
        }

        $perPage = min((int) $request->query('per_page', 20), 100);
        $paginator = $query->orderBy('customer_code')->paginate($perPage);

        return $this->paginated($paginator);
    }

    public function show(Request $request, Subscriber $subscriber): JsonResponse
    {
        $this->authorizeShopForSubscriber($request, $subscriber);

        $subscriber->load([
            'area',
            'subscriberNewspapers.newspaperType',
            'suspensions' => fn($q) => $q->orderByDesc('start_date')->limit(10),
            'routePoints.route',
        ]);

        return $this->success($subscriber);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateSubscriber($request);
        $data['area_id'] = $this->resolveAreaId($request, $data['area_id']);

        $subscriber = Subscriber::create($data);

        return $this->created($subscriber, '購読者を登録しました');
    }

    public function update(Request $request, Subscriber $subscriber): JsonResponse
    {
        $this->authorizeShopForSubscriber($request, $subscriber);

        $data = $this->validateSubscriber($request, partial: true);
        $subscriber->update($data);

        return $this->success($subscriber->fresh(), '購読者情報を更新しました');
    }

    public function destroy(Request $request, Subscriber $subscriber): JsonResponse
    {
        $this->authorizeShopForSubscriber($request, $subscriber);
        $subscriber->delete();

        return $this->noContent();
    }

    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:5120'],
        ]);

        $shopId    = $request->user()->shop_id;
        $path      = $request->file('file')->getRealPath();
        $handle    = fopen($path, 'r');

        // Strip UTF-8 BOM if present
        $bom = fread($handle, 3);
        if ($bom !== "\xEF\xBB\xBF") {
            rewind($handle);
        }

        // Skip header row
        fgetcsv($handle);

        // Pre-load areas for this shop (name → id map)
        $areas = \App\Models\Area::where('shop_id', $shopId)
            ->pluck('id', 'name')
            ->toArray();

        $imported = 0;
        $skipped  = 0;
        $errors   = [];
        $row      = 1;

        while (($cols = fgetcsv($handle)) !== false) {
            $row++;

            // Expect: 顧客コード, 名前, 名前（カナ）, 住所, 郵便番号, 電話, エリア, 備考
            if (count($cols) < 4) {
                $errors[] = "行{$row}: 列数が不足しています";
                $skipped++;
                continue;
            }

            [$customerCode, $name, $nameKana, $address, $postalCode, $phone, $areaName, $note]
                = array_pad($cols, 8, '');

            $customerCode = trim($customerCode);
            $name         = trim($name);
            $areaName     = trim($areaName);

            if ($customerCode === '' || $name === '') {
                $errors[] = "行{$row}: 顧客コードまたは名前が空です";
                $skipped++;
                continue;
            }

            // Skip if already exists in this shop
            $exists = Subscriber::whereHas('area', fn($q) => $q->where('shop_id', $shopId))
                ->where('customer_code', $customerCode)
                ->exists();

            if ($exists) {
                $skipped++;
                continue;
            }

            // Resolve area
            $areaId = $areas[$areaName] ?? null;
            if (!$areaId) {
                $errors[] = "行{$row}: エリア「{$areaName}」が見つかりません";
                $skipped++;
                continue;
            }

            try {
                Subscriber::create([
                    'area_id'       => $areaId,
                    'customer_code' => $customerCode,
                    'name'          => $name,
                    'name_kana'     => trim($nameKana) ?: null,
                    'address'       => trim($address),
                    'postal_code'   => trim($postalCode) ?: null,
                    'phone'         => trim($phone) ?: null,
                    'delivery_note' => trim($note) ?: null,
                ]);
                $imported++;
            } catch (\Exception $e) {
                $errors[] = "行{$row}: {$e->getMessage()}";
                $skipped++;
            }
        }

        fclose($handle);

        return $this->success(
            compact('imported', 'skipped', 'errors'),
            "{$imported}件をインポートしました"
        );
    }

    public function export(Request $request): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $shopId = $request->user()->shop_id;

        $subscribers = Subscriber::whereHas('area', fn($q) => $q->where('shop_id', $shopId))
            ->with('area', 'subscriberNewspapers.newspaperType')
            ->orderBy('customer_code')
            ->get();

        $filename = 'subscribers_' . now()->format('Ymd_His') . '.csv';

        return response()->streamDownload(function () use ($subscribers) {
            $handle = fopen('php://output', 'w');
            // BOM for Excel
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            fputcsv($handle, ['顧客コード', '名前', '名前（カナ）', '住所', '郵便番号', '電話', 'エリア', '備考']);

            foreach ($subscribers as $s) {
                fputcsv($handle, [
                    $s->customer_code,
                    $s->name,
                    $s->name_kana,
                    $s->address . ($s->address_detail ? ' ' . $s->address_detail : ''),
                    $s->postal_code,
                    $s->phone,
                    $s->area->name ?? '',
                    $s->delivery_note,
                ]);
            }

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    public function uploadPhoto(Request $request, Subscriber $subscriber): JsonResponse
    {
        $this->authorizeShopForSubscriber($request, $subscriber);

        $request->validate([
            'photo' => ['required', 'image', 'mimes:jpeg,png,webp', 'max:5120'],
        ]);

        // TODO Phase 5: PhotoUploadService でリサイズ → S3
        $path = $request->file('photo')->store("subscribers/{$subscriber->id}", 'public');
        $url  = asset("storage/{$path}");

        $photos = $subscriber->photos ?? [];
        $photos[] = $url;
        $subscriber->update(['photos' => $photos]);

        return $this->success(['url' => $url], '写真をアップロードしました');
    }

    private function validateSubscriber(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'area_id'        => [$required, 'integer', 'exists:areas,id'],
            'customer_code'  => [$required, 'string', 'max:50'],
            'name'           => [$required, 'string', 'max:100'],
            'name_kana'      => ['sometimes', 'nullable', 'string', 'max:100'],
            'address'        => [$required, 'string', 'max:255'],
            'address_kana'   => ['sometimes', 'nullable', 'string'],
            'address_detail' => ['sometimes', 'nullable', 'string', 'max:100'],
            'postal_code'    => ['sometimes', 'nullable', 'string', 'max:10'],
            'phone'          => ['sometimes', 'nullable', 'string', 'max:20'],
            'delivery_note'  => ['sometimes', 'nullable', 'string'],
            'lat'            => ['sometimes', 'nullable', 'numeric'],
            'lng'            => ['sometimes', 'nullable', 'numeric'],
        ]);
    }

    private function resolveAreaId(Request $request, int $areaId): int
    {
        $area = Area::findOrFail($areaId);
        if ($area->shop_id !== $request->user()->shop_id) {
            abort(403);
        }
        return $areaId;
    }

    /**
     * PUT /api/v1/admin/subscribers/{subscriber}/newspapers/{subscriberNewspaper}/schedule
     * 配達スケジュール（曜日別部数）を更新する
     */
    public function updateNewspaperSchedule(
        Request $request,
        Subscriber $subscriber,
        \App\Models\SubscriberNewspaper $subscriberNewspaper
    ): JsonResponse {
        $this->authorizeShopForSubscriber($request, $subscriber);

        $data = $request->validate([
            'day_schedule'            => 'nullable|array',
            'day_schedule.weekday'    => 'nullable|integer|min:0|max:99',
            'day_schedule.saturday'   => 'nullable|integer|min:0|max:99',
            'day_schedule.sunday'     => 'nullable|integer|min:0|max:99',
            'day_schedule.holiday'    => 'nullable|integer|min:0|max:99',
            'delivery_days'           => 'nullable|array',
            'delivery_days.*'         => 'integer|min:1|max:7',
        ]);

        // Remove null values from schedule — null key means "use base quantity"
        $schedule = collect($data['day_schedule'] ?? [])->filter(fn($v) => $v !== null)->all();

        // delivery_days: null = every day, array of 1-7 = specific days
        $deliveryDays = isset($data['delivery_days'])
            ? (count($data['delivery_days']) === 7 ? null : array_values(array_unique($data['delivery_days'])))
            : $subscriberNewspaper->delivery_days; // unchanged if not sent

        $subscriberNewspaper->update([
            'day_schedule'  => empty($schedule) ? null : $schedule,
            'delivery_days' => $deliveryDays,
        ]);

        return $this->success($subscriberNewspaper->fresh(), '配達スケジュールを更新しました');
    }

    private function authorizeShopForSubscriber(Request $request, Subscriber $subscriber): void
    {
        if ($subscriber->area->shop_id !== $request->user()->shop_id) {
            abort(403);
        }
    }
}
