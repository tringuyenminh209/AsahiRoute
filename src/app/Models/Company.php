<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Company extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name', 'code', 'address', 'phone', 'email', 'website',
    ];

    public function shops(): HasMany
    {
        return $this->hasMany(Shop::class);
    }

    /** 会社直属の管理者 (company_admin) */
    public function companyAdmins(): HasMany
    {
        return $this->hasMany(User::class)->where('role', 'company_admin');
    }

    /** 傘下全店舗のユーザー */
    public function shopUsers(): HasManyThrough
    {
        return $this->hasManyThrough(User::class, Shop::class);
    }
}
