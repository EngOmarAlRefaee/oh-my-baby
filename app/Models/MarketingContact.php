<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;

/** Phone numbers collected automatically from orders (guests included). */
class MarketingContact extends Model
{
    protected $fillable = ['phone', 'name', 'source'];

    public static function normalize(?string $phone): ?string
    {
        $digits = preg_replace('/\D+/', '', (string) $phone) ?: '';
        if (str_starts_with($digits, '00963')) $digits = substr($digits, 2);
        if (str_starts_with($digits, '963')) $local = substr($digits, 3);
        elseif (str_starts_with($digits, '09')) $local = substr($digits, 1);
        elseif (str_starts_with($digits, '9')) $local = $digits;
        else return null;
        return preg_match('/^9\d{8}$/', $local) ? '+963'.$local : null;
    }

    public static function capture(?string $phone, ?string $name = null): void
    {
        try {
            if (! Schema::hasTable('marketing_contacts')) return;
            $normalized = self::normalize($phone);
            if (! $normalized) return;
            $row = static::firstOrCreate(['phone' => $normalized], ['name' => $name, 'source' => 'order']);
            if (! $row->name && $name) $row->update(['name' => $name]);
        } catch (\Throwable $e) {
            report($e); // never block an order because of the contact list
        }
    }
}
