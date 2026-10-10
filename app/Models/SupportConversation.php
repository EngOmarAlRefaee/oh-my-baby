<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class SupportConversation extends Model
{
    protected $fillable = [
        'public_token',
        'user_id',
        'order_id',
        'assigned_to_user_id',
        'guest_name',
        'guest_phone',
        'subject',
        'status',
        'unread_for_staff',
        'unread_for_customer',
        'last_message_at',
        'closed_at',
    ];

    protected function casts(): array
    {
        return [
            'last_message_at' => 'datetime',
            'closed_at' => 'datetime',
            'unread_for_staff' => 'integer',
            'unread_for_customer' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to_user_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(SupportMessage::class);
    }

    public function lastMessage(): HasOne
    {
        return $this->hasOne(SupportMessage::class)->latestOfMany();
    }
}
