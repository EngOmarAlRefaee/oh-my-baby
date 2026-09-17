<?php

namespace App\Http\Controllers;

use App\Models\CatalogProduct;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CatalogController extends Controller
{
    public function publicIndex(): JsonResponse
    {
        $products = CatalogProduct::query()
            ->where('status', 'active')
            ->latest('updated_at')
            ->get()
            ->map(fn (CatalogProduct $product) => $product->toStoreArray())
            ->values();

        return response()->json(['products' => $products]);
    }

    public function adminIndex(): JsonResponse
    {
        $products = CatalogProduct::query()
            ->latest('updated_at')
            ->get()
            ->map(fn (CatalogProduct $product) => $product->toStoreArray())
            ->values();

        return response()->json(['products' => $products]);
    }

    public function bootstrap(Request $request): JsonResponse
    {
        if (CatalogProduct::query()->exists()) {
            return $this->adminIndex();
        }

        $data = $request->validate([
            'products' => ['required', 'array', 'max:500'],
            'products.*' => ['required', 'array'],
        ]);

        DB::transaction(function () use ($data, $request) {
            foreach ($data['products'] as $raw) {
                $this->persist($raw, $request->user()?->id);
            }
        });

        return $this->adminIndex();
    }

    public function store(Request $request): JsonResponse
    {
        $raw = $request->validate(['product' => ['required', 'array']])['product'];
        $externalId = trim((string) ($raw['id'] ?? $raw['external_id'] ?? ''));
        if ($externalId !== '' && CatalogProduct::where('external_id', $externalId)->exists()) {
            throw ValidationException::withMessages([
                'product.id' => ['This product already exists. Use the edit action instead.'],
            ]);
        }

        $product = DB::transaction(fn () => $this->persist($raw, $request->user()?->id));
        return response()->json(['product' => $product->toStoreArray()]);
    }

    public function update(Request $request, string $externalId): JsonResponse
    {
        CatalogProduct::where('external_id', $externalId)->firstOrFail();
        $raw = $request->validate(['product' => ['required', 'array']])['product'];
        $raw['id'] = $externalId;
        $raw['external_id'] = $externalId;

        $product = DB::transaction(fn () => $this->persist($raw, $request->user()?->id));
        return response()->json(['product' => $product->toStoreArray()]);
    }

    public function archive(Request $request, string $externalId): JsonResponse
    {
        $product = CatalogProduct::where('external_id', $externalId)->firstOrFail();
        $product->update(['status' => 'inactive', 'updated_by' => $request->user()?->id]);

        return response()->json(['ok' => true]);
    }

    public function uploadImage(Request $request): JsonResponse
    {
        $data = $request->validate([
            'image' => ['required', 'image', 'max:8192'],
        ]);

        $file = $data['image'];
        $directory = public_path('uploads/products');
        if (! is_dir($directory)) {
            mkdir($directory, 0775, true);
        }

        $extension = strtolower($file->getClientOriginalExtension() ?: 'jpg');
        $filename = now()->format('YmdHis').'-'.Str::lower(Str::random(12)).'.'.$extension;
        $file->move($directory, $filename);

        return response()->json(['url' => '/uploads/products/'.$filename]);
    }

    private function persist(array $raw, ?int $actorId): CatalogProduct
    {
        $externalId = trim((string) ($raw['id'] ?? $raw['external_id'] ?? ''));
        if ($externalId === '') {
            throw ValidationException::withMessages(['product.id' => ['Product id is required.']]);
        }

        $nameAr = trim((string) ($raw['name'] ?? $raw['name_ar'] ?? ''));
        $nameEn = trim((string) ($raw['nameEn'] ?? $raw['name_en'] ?? ''));
        $world = (string) ($raw['world'] ?? '');
        $category = (string) ($raw['category'] ?? '');
        $colors = array_values(array_filter(is_array($raw['colors'] ?? null) ? $raw['colors'] : [], 'is_array'));
        $sizes = array_values(array_filter(is_array($raw['sizes'] ?? null) ? $raw['sizes'] : [], fn ($size) => is_scalar($size)));
        $sections = array_values(array_filter(is_array($raw['sections'] ?? null) ? $raw['sections'] : [], fn ($section) => is_scalar($section)));
        $inventoryRaw = is_array($raw['inventory'] ?? null) ? $raw['inventory'] : [];
        $inventory = [];
        foreach ($inventoryRaw as $key => $value) {
            $inventory[(string) $key] = max(0, (int) $value);
        }

        if ($nameAr === '' || $world === '' || $category === '') {
            throw ValidationException::withMessages(['product' => ['Name, world and category are required.']]);
        }

        foreach ($colors as $color) {
            if (empty($color['id']) || empty($color['image'])) {
                throw ValidationException::withMessages([
                    'product.colors' => ['كل لون لازم يكون مربوط بصورة للمنتج بهذا اللون.'],
                ]);
            }
        }
        if (! count($colors) && empty($raw['image'])) {
            throw ValidationException::withMessages(['product.image' => ['Product image is required.']]);
        }

        if ($world === 'fashion' && in_array($category, ['newborn', 'girls', 'boys', 'shoes'], true) && ! count($sizes)) {
            throw ValidationException::withMessages(['product.sizes' => ['Choose at least one size.']]);
        }

        $price = max(0, (float) ($raw['price'] ?? $raw['price_usd'] ?? 0));
        if ($price <= 0) {
            throw ValidationException::withMessages(['product.price' => ['Valid price is required.']]);
        }

        $offerPrice = $raw['offerPrice'] ?? $raw['offer_price_usd'] ?? null;
        $offerPrice = $offerPrice === '' || $offerPrice === null ? null : max(0, (float) $offerPrice);
        if (in_array('offers', $sections, true) && (! $offerPrice || $offerPrice >= $price)) {
            throw ValidationException::withMessages(['product.offerPrice' => ['Offer price must be lower than regular price.']]);
        }

        $product = CatalogProduct::firstOrNew(['external_id' => $externalId]);
        if (! $product->exists) {
            $product->created_by = $actorId;
        }

        $product->fill([
            'slug' => $raw['slug'] ?? null,
            'world' => $world,
            'category' => $category,
            'subcategory' => $raw['subcategory'] ?? 'all',
            'audience' => $raw['audience'] ?? 'all',
            'name_ar' => $nameAr,
            'name_en' => $nameEn ?: $nameAr,
            'description_ar' => $raw['descriptionAr'] ?? '',
            'description_en' => $raw['descriptionEn'] ?? '',
            'price_usd' => $price,
            'offer_price_usd' => $offerPrice,
            'image' => $raw['image'] ?? ($colors[0]['image'] ?? ''),
            'colors' => $colors,
            'sizes' => $sizes,
            'inventory' => $inventory,
            'sections' => $sections,
            'status' => ($raw['status'] ?? 'active') === 'inactive' ? 'inactive' : 'active',
            'low_stock_threshold' => max(0, (int) ($raw['lowStockThreshold'] ?? 2)),
            'updated_by' => $actorId,
        ]);
        $product->save();

        return $product->fresh();
    }
}
