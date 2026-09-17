<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Order extends Model
{
    protected $fillable = [
        'reference', 'user_id', 'assigned_delivery_id', 'return_delivery_id', 'status',
        'customer_name', 'customer_phone', 'delivery_address', 'customer_note',
        'admin_note', 'delivery_note', 'return_reason', 'return_admin_note',
        'subtotal_usd', 'discount_usd', 'total_usd',
        'exchange_rate', 'total_syp', 'exchange_source', 'coupon_code',
        'accepted_at', 'assigned_at', 'out_for_delivery_at', 'delivered_at', 'cancelled_at', 'rejected_at',
        'return_requested_at', 'return_approved_at', 'return_rejected_at', 'return_assigned_at',
        'return_started_at', 'returned_at',
    ];

    protected function casts(): array
    {
        return [
            'subtotal_usd' => 'decimal:2',
            'discount_usd' => 'decimal:2',
            'total_usd' => 'decimal:2',
            'exchange_rate' => 'decimal:4',
            'total_syp' => 'decimal:2',
            'accepted_at' => 'datetime',
            'assigned_at' => 'datetime',
            'out_for_delivery_at' => 'datetime',
            'delivered_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'rejected_at' => 'datetime',
            'return_requested_at' => 'datetime',
            'return_approved_at' => 'datetime',
            'return_rejected_at' => 'datetime',
            'return_assigned_at' => 'datetime',
            'return_started_at' => 'datetime',
            'returned_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function deliveryUser(): BelongsTo { return $this->belongsTo(User::class, 'assigned_delivery_id'); }
    public function returnDeliveryUser(): BelongsTo { return $this->belongsTo(User::class, 'return_delivery_id'); }
    public function items(): HasMany { return $this->hasMany(OrderItem::class); }
    public function commission(): HasOne { return $this->hasOne(CommissionTransfer::class); }
    public function events(): HasMany { return $this->hasMany(OrderEvent::class); }
}
