<?php

namespace App\Http\Controllers;

use App\Models\CatalogProduct;
use App\Models\Order;
use App\Models\Product;
use App\Models\RewardCoupon;
use App\Models\PromoCode;
use App\Services\ExchangeRateService;
use App\Services\CommissionService;
use App\Services\CatalogInventoryService;
use Illuminate\Validation\ValidationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    public function store(Request $request, ExchangeRateService $rates, CatalogInventoryService $inventoryService): JsonResponse
    {
        $user = $request->user();

        if ($user && $user->role !== 'customer') {
            return response()->json([
                'message' => 'استخدم حساب Customer أو تابع كزائر بعد تسجيل الخروج لإرسال طلب متجر.',
            ], 403);
        }

$data = $request->validate([
            'customer_name' => ['nullable', 'string', 'max:140'],
            'customer_phone' => ['required_if:fulfillment_method,delivery', 'nullable', 'string', 'max:50'],
            'delivery_address' => ['required_if:fulfillment_method,delivery', 'nullable', 'string', 'max:1500'],
            'customer_note' => ['nullable', 'string', 'max:2000'],
            'coupon_code' => ['nullable', 'string', 'max:80'],
            'payment_currency' => ['required', 'string', 'in:usd,syp'],
            'fulfillment_method' => ['required', 'string', 'in:delivery,shipping'],
            'delivery_zone' => ['required_if:fulfillment_method,delivery', 'nullable', 'string', 'in:damascus,remote'],
            'shipping_full_name' => ['required_if:fulfillment_method,shipping', 'nullable', 'string', 'max:160'],
            'shipping_governorate' => ['required_if:fulfillment_method,shipping', 'nullable', 'string', 'max:120'],
            'shipping_company' => ['required_if:fulfillment_method,shipping', 'nullable', 'string', 'max:160'],
            'shipping_address' => ['required_if:fulfillment_method,shipping', 'nullable', 'string', 'max:1500'],
            'shipping_phone' => ['required_if:fulfillment_method,shipping', 'nullable', 'string', 'max:50'],
            'items' => ['required', 'array', 'min:1', 'max:80'],
            'items.*.product_id' => ['required'],
            'items.*.name_ar' => ['nullable', 'string', 'max:220'],
            'items.*.name_en' => ['nullable', 'string', 'max:220'],
            'items.*.image' => ['nullable', 'string'],
            'items.*.color_id' => ['nullable', 'string', 'max:120'],
            'items.*.color_name' => ['nullable', 'string', 'max:160'],
            'items.*.size' => ['nullable', 'string', 'max:80'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:50'],
            'items.*.unit_price_usd' => ['sometimes', 'numeric', 'min:0', 'max:100000'],
            'items.*.category' => ['nullable', 'string', 'max:100'],
            'items.*.sections' => ['nullable', 'array'],
        ]);

        $isShipping = $data['fulfillment_method'] === 'shipping';
        $orderCustomerName = $isShipping
            ? $data['shipping_full_name']
            : ($data['customer_name'] ?? $user?->name ?? 'Delivery customer');
        $orderCustomerPhone = $isShipping
            ? $data['shipping_phone']
            : $data['customer_phone'];
        $orderAddress = $isShipping
            ? $data['shipping_address']
            : $data['delivery_address'];

        // Resolve and lock all product rows before calculating any payment amount.
        // Client-supplied names, prices, categories and sections are not authoritative.
        $productIds = collect($data['items'])->pluck('product_id')->map(fn ($id) => (string) $id)->unique()->values();
        $order = DB::transaction(function () use ($data, $user, $orderCustomerName, $orderCustomerPhone, $orderAddress, $rates, $inventoryService, $productIds) {
            $catalogProducts = CatalogProduct::whereIn('external_id', $productIds)->orderBy('id')->lockForUpdate()->get()->keyBy(fn ($p) => (string) $p->external_id);
            $legacyProducts = Product::whereIn('external_id', $productIds)->orderBy('id')->lockForUpdate()->get()->keyBy(fn ($p) => (string) $p->external_id);
            $resolvedItems = [];
            foreach ($data['items'] as $item) {
                $id = (string) $item['product_id'];
                $catalog = $catalogProducts->get($id);
                $legacy = $legacyProducts->get($id);
                if ($catalog) {
                    if ($catalog->status !== 'active') {
                        throw ValidationException::withMessages(['items' => ["Product {$id} is unavailable."]]);
                    }
                    $price = (float) ($catalog->offer_price_usd !== null && (float) $catalog->offer_price_usd < (float) $catalog->price_usd ? $catalog->offer_price_usd : $catalog->price_usd);
                    $details = $catalog->toStoreArray();
                } elseif ($legacy) {
                    if ($legacy->status !== 'active' || $legacy->archived_at) {
                        throw ValidationException::withMessages(['items' => ["Product {$id} is unavailable."]]);
                    }
                    $details = $legacy->payload ?: [];
                    $regular = (float) ($details['price'] ?? 0);
                    $offer = isset($details['offerPrice']) ? (float) $details['offerPrice'] : null;
                    $price = $offer !== null && $offer > 0 && $offer < $regular ? $offer : $regular;
                } else {
                    throw ValidationException::withMessages(['items' => ["Product {$id} does not exist."]]);
                }
                if ($price <= 0) {
                    throw ValidationException::withMessages(['items' => ["Product {$id} has no valid price."]]);
                }
                $item['_catalog'] = $catalog;
                $item['_legacy'] = $legacy;
                $item['_details'] = $details;
                $item['_price'] = round($price, 2);
                $resolvedItems[] = $item;
            }
            $subtotal = round(collect($resolvedItems)->sum(fn ($item) => $item['_price'] * (int) $item['quantity']), 2);
        $rewardCoupon = null;
        $promoCoupon = null;
        $discount = 0.0;
        $couponCode = ! empty($data['coupon_code']) ? strtoupper(trim($data['coupon_code'])) : null;

        if ($couponCode) {
            if ($user) {
                $rewardCoupon = RewardCoupon::where('user_id', $user->id)
                    ->where('code', $couponCode)
                    ->where('status', 'available')
                    ->first();
            }

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
                    throw ValidationException::withMessages(['coupon_code' => ['Coupon is invalid or inactive.']]);
                }

                if ($promoCoupon->first_order_only) {
                    $hasPreviousOrder = $user
                        ? $user->orders()->whereNotIn('status', ['rejected', 'cancelled'])->exists()
                        : Order::query()
                            ->where('customer_phone', $orderCustomerPhone)
                            ->whereNotIn('status', ['rejected', 'cancelled'])
                            ->exists();

                    if ($hasPreviousOrder) {
                        throw ValidationException::withMessages(['coupon_code' => ['This promo code is available for the first order only.']]);
                    }
                }

                $discount = round($subtotal * ((float) $promoCoupon->discount_percent / 100), 2);
            }
        }

        $deliveryFeeUsd = match (true) {
            $data['fulfillment_method'] === 'shipping' => 0.00,
            ($data['delivery_zone'] ?? null) === 'remote' => 4.00,
            default => 2.50,
        };

        $merchandiseTotal = max(0, round($subtotal - $discount, 2));
        $total = round($merchandiseTotal + $deliveryFeeUsd, 2);
        $rateSnapshot = $rates->current();
        $totalSyp = $rates->convertUsdToSyp($total, $rateSnapshot);

            $order = Order::create([
                'reference' => 'OMB-'.now()->format('ymd').'-'.strtoupper(Str::random(6)),
                'user_id' => $user?->id,
                'status' => 'pending_review',
                'customer_name' => $orderCustomerName,
                'customer_phone' => $orderCustomerPhone,
                'delivery_address' => $orderAddress,
                'customer_note' => $data['customer_note'] ?? null,
                'subtotal_usd' => $subtotal,
                'discount_usd' => $discount,
                'total_usd' => $total,
                'exchange_rate' => $rateSnapshot['usd_to_syp'],
                'total_syp' => $totalSyp,
                'exchange_source' => $rateSnapshot['source'] ?? null,
                'coupon_code' => $rewardCoupon?->code ?? $promoCoupon?->code,
                'payment_currency' => $data['payment_currency'],
                'fulfillment_method' => $data['fulfillment_method'],
                'delivery_zone' => $data['fulfillment_method'] === 'delivery' ? $data['delivery_zone'] : null,
                'delivery_fee_usd' => $deliveryFeeUsd,
                'shipping_full_name' => $data['fulfillment_method'] === 'shipping' ? $data['shipping_full_name'] : null,
                'shipping_governorate' => $data['fulfillment_method'] === 'shipping' ? $data['shipping_governorate'] : null,
                'shipping_company' => $data['fulfillment_method'] === 'shipping' ? $data['shipping_company'] : null,
                'shipping_address' => $data['fulfillment_method'] === 'shipping' ? $data['shipping_address'] : null,
                'shipping_phone' => $data['fulfillment_method'] === 'shipping' ? $data['shipping_phone'] : null,
            ]);

            foreach ($resolvedItems as $item) {
                $sections = $item['_details']['sections'] ?? [];
                $externalId = (string) $item['product_id'];
                $catalogProduct = $item['_catalog'];
                $legacyProduct = $item['_legacy'];
                $key = $catalogProduct
                    ? $inventoryService->reserve($catalogProduct, $item['color_id'] ?? null, $item['size'] ?? null, (int) $item['quantity'])['key']
                    : $inventoryService->reserveLegacy($legacyProduct, $item['color_id'] ?? null, $item['size'] ?? null, (int) $item['quantity'])['key'];
                $sourceAdminId = $catalogProduct?->created_by ?: $legacyProduct?->created_by_user_id;

                $order->items()->create([
                    'product_external_id' => $externalId,
                    'source_admin_user_id' => $sourceAdminId,
                    'catalog_product_id' => $catalogProduct?->id,
                    'inventory_key' => $key,
                    'name_ar' => $item['_details']['name'] ?? $item['_details']['name_ar'] ?? null,
                    'name_en' => $item['_details']['nameEn'] ?? $item['_details']['name_en'] ?? null,
                    'image' => $item['_details']['image'] ?? null,
                    'color_id' => $item['color_id'] ?? null,
                    'color_name' => $item['color_name'] ?? null,
                    'size' => $item['size'] ?? null,
                    'quantity' => (int) $item['quantity'],
                    'unit_price_usd' => $item['_price'],
                    'line_total_usd' => round($item['_price'] * (int) $item['quantity'], 2),
                    'category' => $item['_details']['category'] ?? null,
                    'sections' => $sections,
                    'is_offer' => in_array('offers', $sections, true),
                ]);
            }

            if ($rewardCoupon) {
                $rewardCoupon->update(['status' => 'used', 'used_on_order_id' => $order->id, 'used_at' => now()]);
            }

            $order->events()->create([
                'actor_user_id' => $user?->id,
                'event' => 'order_submitted',
                'note' => $data['customer_note'] ?? null,
            ]);

            return $order;
        });

        return response()->json(['message' => 'Order submitted for review.', 'order' => $order->load('items')], 201);
    }

    public function confirmReceipt(Request $request, Order $order, CommissionService $commissions): JsonResponse
    {
        abort_unless((int) $order->user_id === (int) $request->user()->id, 403);

        if (! $order->delivered_at || $order->status !== 'delivered') {
            return response()->json(['message' => 'لا يمكن تأكيد الاستلام قبل تسجيل الطلب كمسلّم من السائق.'], 409);
        }

        if (! $order->customer_confirmed_at) {
            DB::transaction(function () use ($order, $request): void {
                $order->forceFill(['customer_confirmed_at' => now()])->save();
                $order->events()->create([
                    'actor_user_id' => $request->user()->id,
                    'event' => 'customer_receipt_confirmed',
                    'note' => null,
                ]);
            });
        }

        $commission = $commissions->ensureForDeliveredOrder($order->fresh());

        return response()->json([
            'message' => 'تم تأكيد استلام الطلب.',
            'order' => $order->fresh()->load(['items', 'deliveryUser:id,name,phone', 'commission']),
            'commission' => $commission,
        ]);
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


