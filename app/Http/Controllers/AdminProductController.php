<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AdminProductController extends Controller
{
    public function bulkSync(Request $request): JsonResponse
    {
        $data = $request->validate([
            'products' => ['required', 'array', 'max:1000'],
            'products.*.id' => ['required'],
        ]);

        foreach ($data['products'] as $payload) {
            $this->storePayload($payload);
        }

        return response()->json(['ok' => true, 'count' => count($data['products'])]);
    }

    public function upsert(Request $request, string $externalId): JsonResponse
    {
        $payload = $request->validate([
            'id' => ['required'],
            'name' => ['nullable', 'string', 'max:220'],
            'nameEn' => ['nullable', 'string', 'max:220'],
            'category' => ['nullable', 'string', 'max:120'],
            'price' => ['required', 'numeric', 'min:0'],
            'offerPrice' => ['nullable', 'numeric', 'min:0'],
            'inventory' => ['nullable', 'array'],
            'colors' => ['nullable', 'array'],
            'sizes' => ['nullable', 'array'],
            'sections' => ['nullable', 'array'],
            'isSummer' => ['nullable', 'boolean'],
            'isWinter' => ['nullable', 'boolean'],
            '*' => ['nullable'],
        ]);
        $payload = array_merge($request->all(), $payload);
        $payload['id'] = $externalId;
        $product = $this->storePayload($payload);
        return response()->json(['product' => $product->payload]);
    }

    public function uploadImage(Request $request): JsonResponse
    {
        $data = $request->validate(['image' => ['required', 'image', 'max:8192']]);
        $path = $data['image']->store('products/'.now()->format('Y/m'), 'public');
        return response()->json(['url' => Storage::disk('public')->url($path)], 201);
    }

    public function archive(string $externalId): JsonResponse
    {
        $product = Product::where('external_id', $externalId)->firstOrFail();
        $product->update(['archived_at' => now(), 'status' => 'archived']);
        return response()->json(['ok' => true]);
    }

    private function storePayload(array $payload): Product
    {
        $inventory = collect($payload['inventory'] ?? [])->map(fn ($v) => max(0, (int) $v));
        $totalStock = $inventory->sum();
        $existing = Product::where('external_id', (string) $payload['id'])->first();
        $outSince = $totalStock <= 0
            ? ($existing?->out_of_stock_since ?: now())
            : null;

        return Product::updateOrCreate(
            ['external_id' => (string) $payload['id']],
            [
                'payload' => $payload,
                'status' => $payload['status'] ?? 'active',
                'is_summer' => (bool) ($payload['isSummer'] ?? false),
                'is_winter' => (bool) ($payload['isWinter'] ?? false),
                'out_of_stock_since' => $outSince,
                'archived_at' => null,
            ]
        );
    }
}
