<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\RewardCoupon;
use App\Models\PromoCode;
use App\Services\ExchangeRateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    public function store(Request $request, ExchangeRateService $rates): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401);

        $data = $request->validate([
            'customer_name' => ['required', 'string', 'max:140'],
            'customer_phone' => ['required', 'string', 'max:50'],
            'delivery_address' => ['required', 'string', 'max:1500'],
            'customer_note' => ['nullable', 'string', 'max:2000'],
            'coupon_code' => ['nullable', 'string', 'max:80'],
            'items' => ['required', 'array', 'min:1', 'max:80'],
            'items.*.product_id' => ['required'],
            'items.*.name_ar' => ['nullable', 'string', 'max:220'],
            'items.*.name_en' => ['nullable', 'string', 'max:220'],
            'items.*.image' => ['nullable', 'string'],
            'items.*.color_id' => ['nullable', 'string', 'max:120'],
            'items.*.color_name' => ['nullable', 'string', 'max:160'],
            'items.*.size' => ['nullable', 'string', 'max:80'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:50'],
            'items.*.unit_price_usd' => ['required', 'numeric', 'min:0', 'max:100000'],
            'items.*.category' => ['nullable', 'string', 'max:100'],
            'items.*.sections' => ['nullable', 'array'],
        ]);

        $subtotal = collect($data['items'])->sum(fn ($item) => round((float) $item['unit_price_usd'] * (int) $item['quantity'], 2));
        $rewardCoupon = null;
        $promoCoupon = null;
        $discount = 0.0;
        $couponCode = ! empty($data['coupon_code']) ? strtoupper(trim($data['coupon_code'])) : null;

        if ($couponCode) {
            $rewardCoupon = RewardCoupon::where('user_id', $user->id)
                ->where('code', $couponCode)
                ->where('status', 'available')
                ->first();

            if ($rewardCoupon) {
                $discount = round($subtotal * ((float) $rewardCoupon->discount_percent / 100), 2);
            } else {
                $promoCoupon = PromoCode::query()
                    ->where('code', $couponCode)
                    ->where('active', true)
                    ->where(fn ($query) => $query->whereNull('starts_at')->orWhere('starts_at', '<=', now()))
                    ->where(fn ($query) => $query->whereNull('ends_at')->orWhere('ends_at', '>=', now()))
                    ->first();

                if (! $promoCoupon) {
                    return response()->json(['message' => 'Coupon is invalid or inactive.'], 422);
                }

                if ($promoCoupon->first_order_only && $user->orders()->whereNotIn('status', ['rejected', 'cancelled'])->exists()) {
                    return response()->json(['message' => 'This promo code is available for the first order only.'], 422);
                }

                $discount = round($subtotal * ((float) $promoCoupon->discount_percent / 100), 2);
            }
        }

        $total = max(0, round($subtotal - $discount, 2));
        $rateSnapshot = $rates->current();
        $totalSyp = $rates->convertUsdToSyp($total, $rateSnapshot);

        $order = DB::transaction(function () use ($data, $user, $subtotal, $discount, $total, $rateSnapshot, $totalSyp, $rewardCoupon, $promoCoupon) {
            $order = Order::create([
                'reference' => 'OMB-'.now()->format('ymd').'-'.strtoupper(Str::random(6)),
                'user_id' => $user->id,
                'status' => 'pending_review',
                'customer_name' => $data['customer_name'],
                'customer_phone' => $data['customer_phone'],
                'delivery_address' => $data['delivery_address'],
                'customer_note' => $data['customer_note'] ?? null,
                'subtotal_usd' => $subtotal,
                'discount_usd' => $discount,
                'total_usd' => $total,
                'exchange_rate' => $rateSnapshot['usd_to_syp'],
                'total_syp' => $totalSyp,
                'exchange_source' => $rateSnapshot['source'] ?? null,
                'coupon_code' => $rewardCoupon?->code ?? $promoCoupon?->code,
            ]);

            foreach ($data['items'] as $item) {
                $sections = $item['sections'] ?? [];
                $order->items()->create([
                    'product_external_id' => (string) $item['product_id'],
                    'name_ar' => $item['name_ar'] ?? null,
                    'name_en' => $item['name_en'] ?? null,
                    'image' => $item['image'] ?? null,
                    'color_id' => $item['color_id'] ?? null,
                    'color_name' => $item['color_name'] ?? null,
                    'size' => $item['size'] ?? null,
                    'quantity' => (int) $item['quantity'],
                    'unit_price_usd' => (float) $item['unit_price_usd'],
                    'line_total_usd' => round((float) $item['unit_price_usd'] * (int) $item['quantity'], 2),
                    'category' => $item['category'] ?? null,
                    'sections' => $sections,
                    'is_offer' => in_array('offers', $sections, true),
                ]);
            }

            if ($rewardCoupon) {
                $rewardCoupon->update(['status' => 'used', 'used_on_order_id' => $order->id, 'used_at' => now()]);
            }

            $order->events()->create([
                'actor_user_id' => $user->id,
                'event' => 'order_submitted',
                'note' => $data['customer_note'] ?? null,
            ]);

            return $order;
        });

        return response()->json(['message' => 'Order submitted for review.', 'order' => $order->load('items')], 201);
    }

    public function mine(Request $request): JsonResponse
    {
        $orders = $request->user()->orders()
            ->with(['items', 'deliveryUser:id,name', 'returnDeliveryUser:id,name'])
            ->latest()
            ->get();
        return response()->json(['orders' => $orders]);
    }

    public function requestReturn(Request $request, Order $order): JsonResponse
    {
        abort_unless((int) $order->user_id === (int) $request->user()->id, 403);

        if ($order->status !== 'delivered') {
            return response()->json(['message' => 'Only delivered orders can be returned.'], 409);
        }
        if ($order->return_requested_at && ! $order->return_rejected_at) {
            return response()->json(['message' => 'A return request already exists for this order.'], 409);
        }

        $data = $request->validate([
            'reason' => ['required', 'string', 'min:3', 'max:2000'],
        ]);

        $order->update([
            'status' => 'return_requested',
            'return_reason' => $data['reason'],
            'return_admin_note' => null,
            'return_requested_at' => now(),
            'return_approved_at' => null,
            'return_rejected_at' => null,
            'return_assigned_at' => null,
            'return_started_at' => null,
            'returned_at' => null,
            'return_delivery_id' => null,
        ]);

        $order->events()->create([
            'actor_user_id' => $request->user()->id,
            'event' => 'return_requested',
            'note' => $data['reason'],
        ]);

        return response()->json([
            'order' => $order->fresh()->load(['items', 'deliveryUser:id,name', 'returnDeliveryUser:id,name']),
        ]);
    }
}
