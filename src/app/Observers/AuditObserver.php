<?php

namespace App\Observers;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditObserver
{
    public function created(Model $model): void
    {
        $this->log('create', $model, null, $model->getAttributes());
    }

    public function updated(Model $model): void
    {
        $dirty = $model->getDirty();
        if (empty($dirty)) {
            return;
        }

        $oldValues = array_intersect_key($model->getOriginal(), $dirty);
        $this->log('update', $model, $oldValues, $dirty);
    }

    public function deleted(Model $model): void
    {
        $this->log('delete', $model, $model->getOriginal(), null);
    }

    private function log(string $action, Model $model, ?array $oldValues, ?array $newValues): void
    {
        $user   = Auth::user();
        $shopId = $user?->shop_id ?? ($model->shop_id ?? null);

        if (!$shopId) {
            return; // shop_id が特定できない場合はスキップ
        }

        // パスワードやトークンは記録しない
        $exclude = ['password', 'remember_token', 'settings'];
        if ($oldValues) {
            $oldValues = array_diff_key($oldValues, array_flip($exclude));
        }
        if ($newValues) {
            $newValues = array_diff_key($newValues, array_flip($exclude));
        }

        AuditLog::create([
            'user_id'        => $user?->id,
            'shop_id'        => $shopId,
            'action'         => $action,
            'auditable_type' => get_class($model),
            'auditable_id'   => $model->getKey(),
            'old_values'     => $oldValues ?: null,
            'new_values'     => $newValues ?: null,
            'ip_address'     => Request::ip(),
            'user_agent'     => Request::userAgent(),
            'created_at'     => now(),
        ]);
    }
}
