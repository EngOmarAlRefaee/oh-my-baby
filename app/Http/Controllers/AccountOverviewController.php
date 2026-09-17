<?php

namespace App\Http\Controllers;

use App\Services\RewardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccountOverviewController extends Controller
{
    public function __invoke(Request $request, RewardService $rewards): JsonResponse
    {
        $user = $request->user();
        $rewardData = $rewards->syncForUser($user);
        return response()->json([
            'user' => $user->only(['id', 'name', 'email', 'phone', 'role', 'avatar_url']),
            'rewards' => $rewardData,
            'orders' => $user->orders()
                ->with(['items', 'deliveryUser:id,name,phone', 'returnDeliveryUser:id,name,phone'])
                ->latest()
                ->limit(25)
                ->get(),
        ]);
    }
}
