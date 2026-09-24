<?php
namespace App\Http\Controllers;
use App\Models\WishlistItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WishlistController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $ids = WishlistItem::where('user_id', $request->user()->id)->pluck('product_external_id')->values();
        return response()->json(['product_ids' => $ids]);
    }

    public function sync(Request $request): JsonResponse
    {
        $data = $request->validate(['product_ids' => ['required','array','max:1000'], 'product_ids.*' => ['string','max:120']]);
        $ids = collect($data['product_ids'])->map(fn ($id) => (string) $id)->unique()->values();
        DB::transaction(function () use ($request, $ids) {
            WishlistItem::where('user_id', $request->user()->id)->whereNotIn('product_external_id', $ids)->delete();
            foreach ($ids as $id) WishlistItem::firstOrCreate(['user_id' => $request->user()->id, 'product_external_id' => $id]);
        });
        return response()->json(['product_ids' => $ids]);
    }
}
