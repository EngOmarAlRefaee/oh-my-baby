<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'email', 'google_id', 'avatar_url', 'phone', 'password', 'role', 'is_primary_admin', 'permissions', 'permissions_updated_at', 'permissions_updated_by', 'account_status', 'last_login_at', 'suspended_at', 'suspended_by', 'suspension_reason', 'created_by'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function assignedOrders(): HasMany
    {
        return $this->hasMany(Order::class, 'assigned_delivery_id');
    }

    public function rewardCoupons(): HasMany
    {
        return $this->hasMany(RewardCoupon::class);
    }

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'last_login_at' => 'datetime',
            'is_primary_admin' => 'boolean',
            'permissions' => 'array',
            'permissions_updated_at' => 'datetime',
            'suspended_at' => 'datetime',
        ];
    }
}
