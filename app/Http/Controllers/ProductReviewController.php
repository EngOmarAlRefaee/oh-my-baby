<?php

namespace App\Http\Controllers;

use App\Models\OrderItem;
use App\Models\ProductReview;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductReviewController extends Controller
{
    public function index(string $productId): JsonResponse
    {
        $reviews = ProductReview::where('product_external_id', $productId)
            ->where('status', 'published')
            ->latest()->get(['id','rating','comment','created_at']);
        return response()->json([
            'reviews' => $reviews,
            'average' => round((float) $reviews->avg('rating'), 1),
            'count' => $reviews->count(),
        ]);
    }

    public function store(Request $request, string $productId): JsonResponse
    {
        $data = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:2000'],
        ]);
        $item = OrderItem::query()
            ->where('product_external_id', $productId)
            ->whereHas('order', fn ($q) => $q->where('user_id', $request->user()->id)->where('status', 'delivered'))
            ->latest()->first();
        abort_unless($item, 403, 'Only customers who received this product can review it.');

        $review = ProductReview::updateOrCreate(
            ['user_id' => $request->user()->id, 'product_external_id' => $productId],
            ['order_id' => $item->order_id, 'rating' => $data['rating'], 'comment' => $data['comment'] ?? null, 'status' => 'published']
        );
        return response()->json(['review' => $review], 201);
    }
}
