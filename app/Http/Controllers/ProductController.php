<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    public function index(): JsonResponse
    {
        $sales = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.status', 'delivered')
            ->select('order_items.product_external_id', DB::raw('SUM(order_items.quantity) as sold_count'))
            ->groupBy('order_items.product_external_id')
            ->pluck('sold_count', 'product_external_id');

        $rows = Product::query()
            ->whereNull('archived_at')
            ->where('status', '!=', 'inactive')
            ->get()
            ->map(function (Product $product) use ($sales) {
                $payload = $product->payload ?: [];
                $payload['id'] = $payload['id'] ?? $product->external_id;
                $payload['status'] = $product->status;
                $payload['isSummer'] = (bool) $product->is_summer;
                $payload['isWinter'] = (bool) $product->is_winter;
                $payload['soldCount'] = (int) ($sales[$product->external_id] ?? $product->sold_count ?? 0);
                $payload['outOfStockSince'] = $product->out_of_stock_since?->toIso8601String();
                return $payload;
            })
            ->values();

        return response()->json(['products' => $rows, 'total' => $rows->count(), 'catalog_ready' => Product::query()->exists()]);
    }

    public function show(string $externalId): JsonResponse
    {
        $product = Product::where('external_id', $externalId)->whereNull('archived_at')->firstOrFail();
        $payload = $product->payload ?: [];
        $payload['isSummer'] = (bool) $product->is_summer;
        $payload['isWinter'] = (bool) $product->is_winter;
        return response()->json(['product' => $payload]);
    }
}
