<?php

namespace App\Http\Controllers;

use App\Models\CommissionTransfer;
use App\Services\CommissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommissionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $rows = CommissionTransfer::with(['order:id,reference,status,total_usd,total_syp,delivered_at'])->latest()->limit(300)->get();
        return response()->json([
            'commissions' => $rows,
            'summary' => [
                'paid_usd' => (float) CommissionTransfer::where('status', 'paid')->sum('amount_usd'),
                'pending_usd' => (float) CommissionTransfer::where('status', 'pending')->sum('amount_usd'),
                'paid_count' => CommissionTransfer::where('status', 'paid')->count(),
                'pending_count' => CommissionTransfer::where('status', 'pending')->count(),
            ],
            'can_transfer' => in_array($request->user()?->role, ['owner', 'admin'], true),
            'sham_cash' => [
                'enabled' => (bool) config('ohmybaby.sham_cash.enabled'),
                'auto_transfer' => (bool) config('ohmybaby.sham_cash.auto_transfer'),
            ],
        ]);
    }

    public function transfer(Request $request, CommissionTransfer $commission, CommissionService $service): JsonResponse
    {
        $data = $request->validate(['pin' => ['nullable', 'string', 'max:80']]);
        $updated = $service->attemptTransfer($commission, $data['pin'] ?? null);
        return response()->json(['commission' => $updated, 'ok' => $updated->status === 'paid']);
    }
}
