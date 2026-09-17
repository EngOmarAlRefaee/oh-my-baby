<?php

namespace App\Http\Controllers;

use App\Models\SiteVisit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class SiteVisitController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        // Keep the storefront usable even if a newly copied analytics migration
        // has not been applied yet. The launcher/migrate command will create it.
        if (! Schema::hasTable('site_visits')) {
            return response()->json(['tracked' => false, 'reason' => 'analytics_table_pending']);
        }

        $data = $request->validate([
            'path' => ['nullable', 'string', 'max:500'],
        ]);

        $path = $data['path'] ?? '/';
        if (preg_match('#^/(admin|owner|delivery)(/|$)#', $path)) {
            return response()->json(['tracked' => false]);
        }

        SiteVisit::create([
            'user_id' => $request->user()?->id,
            'session_key' => hash('sha256', $request->session()->getId()),
            'path' => $path,
            'visited_at' => now(),
        ]);

        return response()->json(['tracked' => true]);
    }
}
