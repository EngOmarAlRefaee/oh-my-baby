<?php

namespace App\Http\Controllers;

use App\Models\CatalogProduct;
use App\Models\Order;
use App\Models\RewardCoupon;
use App\Services\CatalogInventoryService;
use App\Services\ExchangeRateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function store(Request $request, ExchangeRateService $rates, CatalogInventoryService $inventoryService): JsonResponse
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

        $rateSnapshot = $rates->current();

        $order = DB::transaction(function () use ($data, $user, $rateSnapshot, $rates, $inventoryService) {
            $trustedItems = [];

            foreach ($data['items'] as $item) {
                $catalogProduct = CatalogProduct::where('external_id', (string) $item['product_id'])
                    ->lockForUpdate()
                    ->first();

                if ($catalogProduct) {
                    if ($catalogProduct->status !== 'active') {
                        throw ValidationException::withMessages(['items' => ["المنتج {$catalogProduct->name_ar} غير متاح حالياً."]]);
                    }

                    $colorId = ($item['color_id'] ?? null) ?: 'default';
                    $size = ($item['size'] ?? null) ?: 'default';
                    $colors = $catalogProduct->colors ?: [];
                    $sizes = $catalogProduct->sizes ?: [];

                    if (count($colors) && ! collect($colors)->contains(fn ($color) => ($color['id'] ?? null) === $colorId)) {
                        throw ValidationException::withMessages(['items' => ["اللون المختار غير متاح للمنتج {$catalogProduct->name_ar}."]]);
                    }
                    if (count($sizes) && ! in_array($size, $sizes, true)) {
                        throw ValidationException::withMessages(['items' => ["القياس المختار غير متاح للمنتج {$catalogProduct->name_ar}."]]);
                    }

                    $reservation = $inventoryService->reserve($catalogProduct, $colorId, $size, (int) $item['quantity']);
                    $selectedColor = collect($colors)->first(fn ($color) => ($color['id'] ?? null) === $colorId);
                    $sections = $catalogProduct->sections ?: [];
                    $unitPrice = $catalogProduct->offer_price_usd !== null
                        ? (float) $catalogProduct->offer_price_usd
                        : (float) $catalogProduct->price_usd;

                    $trustedItems[] = [
                        'product_external_id' => (string) $catalogProduct->external_id,
                        'catalog_product_id' => $catalogProduct->id,
                        'name_ar' => $catalogProduct->name_ar,
                        'name_en' => $catalogProduct->name_en,
                        'image' => $selectedColor['image'] ?? $catalogProduct->image,
                        'color_id' => $colorId === 'default' ? null : $colorId,
                        'color_name' => $selectedColor['nameAr'] ?? $selectedColor['nameEn'] ?? null,
                        'size' => $size === 'default' ? null : $size,
                        'inventory_key' => $reservation['key'],
                        'quantity' => (int) $item['quantity'],
                        'unit_price_usd' => $unitPrice,
                        'category' => $catalogProduct->category,
                        'sections' => $sections,
                        'is_offer' => in_array('offers', $sections, true),
                    ];
                    continue;
                }

                // Compatibility path for legacy/demo products that have not yet been synced by an admin.
                $sections = $item['sections'] ?? [];
                $trustedItems[] = [
                    'product_external_id' => (string) $item['product_id'],
                    'catalog_product_id' => null,
                    'name_ar' => $item['name_ar'] ?? null,
                    'name_en' => $item['name_en'] ?? null,
                    'image' => $item['image'] ?? null,
                    'color_id' => $item['color_id'] ?? null,
                    'color_name' => $item['color_name'] ?? null,
                    'size' => $item['size'] ?? null,
                    'inventory_key' => null,
                    'quantity' => (int) $item['quantity'],
                    'unit_price_usd' => (float) $item['unit_price_usd'],
                    'category' => $item['category'] ?? null,
                    'sections' => $sections,
                    'is_offer' => in_array('offers', $sections, true),
                ];
            }

            $subtotal = collect($trustedItems)->sum(fn ($item) => round((float) $item['unit_price_usd'] * (int) $item['quantity'], 2));
            $coupon = null;
            $discount = 0.0;

            if (! empty($data['coupon_code'])) {
                $coupon = RewardCoupon::where('user_id', $user->id)
                    ->where('code', $data['coupon_code'])
                    ->where('status', 'available')
                    ->lockForUpdate()
                    ->first();
                if (! $coupon) {
                    throw ValidationException::withMessages(['coupon_code' => ['Coupon is invalid or already used.']]);
                }
                $discount = round($subtotal * ((float) $coupon->discount_percent / 100), 2);
            }

            $total = max(0, round($subtotal - $discount, 2));
            $totalSyp = $rates->convertUsdToSyp($total, $rateSnapshot);

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
                'coupon_code' => $coupon?->code,
            ]);

            foreach ($trustedItems as $item) {
                $order->items()->create([
                    ...$item,
                    'line_total_usd' => round((float) $item['unit_price_usd'] * (int) $item['quantity'], 2),
                ]);
            }

            if ($coupon) {
                $coupon->update(['status' => 'used', 'used_on_order_id' => $order->id, 'used_at' => now()]);
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
