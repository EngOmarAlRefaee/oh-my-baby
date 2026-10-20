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
        $inventory = $this->normalizeInventory($product->inventory);
        $key = $this->resolveInventoryKey($inventory, $colorId, $size);
        $stock = max(0, (int) ($inventory[$key] ?? 0));

        if ($quantity > $stock) {
            throw ValidationException::withMessages([
                'items' => ["الكمية المتوفرة من {$product->name_ar} هي {$stock} فقط لهذا اللون والقياس."],
            ]);
        }

        $inventory[$key] = $stock - $quantity;
        $product->inventory = $inventory;
        // Reaching zero stock must keep the product visible. Never archive or hide it here.
        $product->save();
        $this->mirrorLegacyInventory((string) $product->external_id, $inventory);

        return ['key' => $key, 'remaining' => $inventory[$key]];
    }

    public function reserveLegacy(Product $product, ?string $colorId, ?string $size, int $quantity): array
    {
        $payload = $product->payload ?: [];
        $inventory = $this->normalizeInventory($payload['inventory'] ?? []);
        $key = $this->resolveInventoryKey($inventory, $colorId, $size);
        $stock = max(0, (int) ($inventory[$key] ?? 0));
        if ($quantity > $stock) {
            throw ValidationException::withMessages(['items' => ["Insufficient stock for product {$product->external_id}."]]);
        }
        $inventory[$key] = $stock - $quantity;
        $payload['inventory'] = $inventory;
        $product->payload = $payload;
        $product->out_of_stock_since = $this->totalStock($inventory) <= 0
            ? ($product->out_of_stock_since ?: now())
            : null;
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
                $inventory = $this->normalizeInventory($product->inventory);
                $inventory[$item->inventory_key] = max(0, (int) ($inventory[$item->inventory_key] ?? 0)) + (int) $item->quantity;
                $product->inventory = $inventory;
                $product->save();
                $this->mirrorLegacyInventory((string) $product->external_id, $inventory);
            } else {
                $product = Product::where('external_id', $item->product_external_id)->lockForUpdate()->first();
                if (! $product) {
                    continue;
                }
                $payload = $product->payload ?: [];
                $inventory = $this->normalizeInventory($payload['inventory'] ?? []);
                $inventory[$item->inventory_key] = max(0, (int) ($inventory[$item->inventory_key] ?? 0)) + (int) $item->quantity;
                $payload['inventory'] = $inventory;
                $product->payload = $payload;
                $product->out_of_stock_since = $this->totalStock($inventory) <= 0
                    ? ($product->out_of_stock_since ?: now())
                    : null;
                $product->save();
            }

            $item->stock_restored_at = now();
            $item->save();
        }
    }

    private function resolveInventoryKey(array $inventory, ?string $colorId, ?string $size): string
    {
        $preferred = $this->inventoryKey($colorId, $size);
        if (array_key_exists($preferred, $inventory)) {
            return $preferred;
        }

        foreach ([
            $this->inventoryKey($colorId, $size),
            $this->inventoryKey($colorId, null),
            $this->inventoryKey(null, $size),
            $this->inventoryKey(null, null),
        ] as $candidate) {
            if (array_key_exists($candidate, $inventory)) {
                return $candidate;
            }
        }

        return $preferred;
    }

    private function normalizeInventory(mixed $inventory): array
    {
        if (! is_array($inventory)) {
            return [];
        }

        $normalized = [];
        foreach ($inventory as $key => $value) {
            $normalized[(string) $key] = max(0, (int) $value);
        }

        return $normalized;
    }

    private function totalStock(array $inventory): int
    {
        return (int) collect($inventory)->sum();
    }

    private function mirrorLegacyInventory(string $externalId, array $inventory): void
    {
        $legacy = Product::where('external_id', $externalId)->lockForUpdate()->first();
        if (! $legacy) {
            return;
        }

        $payload = $legacy->payload ?: [];
        $payload['inventory'] = $inventory;
        $legacy->payload = $payload;
        $legacy->out_of_stock_since = $this->totalStock($inventory) <= 0
            ? ($legacy->out_of_stock_since ?: now())
            : null;
        $legacy->save();
    }
}
