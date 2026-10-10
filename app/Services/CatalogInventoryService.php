<?php

namespace App\Services;

use App\Models\CatalogProduct;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Validation\ValidationException;

class CatalogInventoryService
{
    public function inventoryKey(?string $colorId, ?string $size): string
    {
        return ($colorId ?: 'default').'::'.($size ?: 'default');
    }

    public function reserve(CatalogProduct $product, ?string $colorId, ?string $size, int $quantity): array
    {
        $inventory = $product->inventory ?: [];
        $key = $this->inventoryKey($colorId, $size);
        $stock = max(0, (int) ($inventory[$key] ?? 0));

        if ($quantity > $stock) {
            throw ValidationException::withMessages([
                'items' => ["الكمية المتوفرة من {$product->name_ar} هي {$stock} فقط لهذا اللون والقياس."],
            ]);
        }

        $inventory[$key] = $stock - $quantity;
        $product->inventory = $inventory;
        $product->save();

        return ['key' => $key, 'remaining' => $inventory[$key]];
    }

    public function reserveLegacy(Product $product, ?string $colorId, ?string $size, int $quantity): array
    {
        $payload = $product->payload ?: [];
        $inventory = $payload['inventory'] ?? [];
        $key = $this->inventoryKey($colorId, $size);
        $stock = max(0, (int) ($inventory[$key] ?? 0));
        if ($quantity > $stock) {
            throw ValidationException::withMessages(['items' => ["Insufficient stock for product {$product->external_id}."]]);
        }
        $inventory[$key] = $stock - $quantity;
        $payload['inventory'] = $inventory;
        $product->payload = $payload;
        $product->save();
        return ['key' => $key, 'remaining' => $inventory[$key]];
    }

    public function restoreOrder(Order $order): void
    {
        $order->loadMissing('items');

        foreach ($order->items as $item) {
            if (! $item->inventory_key || $item->stock_restored_at) {
                continue;
            }
            if ($item->catalog_product_id) {
                $product = CatalogProduct::whereKey($item->catalog_product_id)->lockForUpdate()->first();
                if (! $product) {
                    continue;
                }
                $inventory = $product->inventory ?: [];
                $inventory[$item->inventory_key] = max(0, (int) ($inventory[$item->inventory_key] ?? 0)) + (int) $item->quantity;
                $product->inventory = $inventory;
                $product->save();
            } else {
                $product = Product::where('external_id', $item->product_external_id)->lockForUpdate()->first();
                if (! $product) {
                    continue;
                }
                $payload = $product->payload ?: [];
                $inventory = $payload['inventory'] ?? [];
                $inventory[$item->inventory_key] = max(0, (int) ($inventory[$item->inventory_key] ?? 0)) + (int) $item->quantity;
                $payload['inventory'] = $inventory;
                $product->payload = $payload;
                $product->save();
            }

            $item->stock_restored_at = now();
            $item->save();
        }
    }
}
