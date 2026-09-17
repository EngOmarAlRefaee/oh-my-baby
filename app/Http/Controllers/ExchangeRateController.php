<?php

namespace App\Http\Controllers;

use App\Services\ExchangeRateService;
use Illuminate\Http\JsonResponse;

class ExchangeRateController extends Controller
{
    public function __invoke(ExchangeRateService $rates): JsonResponse
    {
        try {
            return response()->json(['ok' => true, ...$rates->current()]);
        } catch (\Throwable $error) {
            return response()->json([
                'ok' => false,
                'message' => 'Live Syrian-pound rate is temporarily unavailable.',
            ], 503);
        }
    }
}
