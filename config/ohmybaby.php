<?php

return [
    'exchange' => [
        'provider' => env('OMB_EXCHANGE_PROVIDER', 'sp_today'),
        'url' => env('OMB_EXCHANGE_URL', 'https://sp-today.com/app_api/cur_damascus.json'),
        'html_fallback_url' => env('OMB_EXCHANGE_HTML_FALLBACK_URL', 'https://sp-today.com/en/currency/us-dollar'),
        'side' => env('OMB_EXCHANGE_SIDE', 'sell'),
        // SP-Today's legacy JSON feed has historically exposed old-SYP values.
        // Keep this configurable because the provider can change formats.
        'source_divisor' => (float) env('OMB_EXCHANGE_SOURCE_DIVISOR', 100),
        'fallback_rate' => env('OMB_EXCHANGE_FALLBACK_RATE'),
        'cache_minutes' => (int) env('OMB_EXCHANGE_CACHE_MINUTES', 5),
        'stale_hours' => (int) env('OMB_EXCHANGE_STALE_HOURS', 24),
        'round_to' => (float) env('OMB_SYP_ROUND_TO', 0.5),
    ],

    'rewards' => [
        // Threshold => discount %. Edit these values without touching app logic.
        'tiers' => [
            5 => 5,
            10 => 10,
            20 => 15,
            35 => 20,
        ],
    ],

    'commissions' => [
        'normal_order_usd' => (float) env('OMB_NORMAL_ORDER_COMMISSION_USD', 0.50),
        'decoration_usd' => (float) env('OMB_DECORATION_COMMISSION_USD', 2.50),
        // Conservative interpretation: any order containing an Offers item does not
        // generate the normal $0.50 commission. Decoration has its own $2.50 rule.
        'exclude_orders_with_offers' => filter_var(env('OMB_EXCLUDE_OFFERS_FROM_COMMISSION', true), FILTER_VALIDATE_BOOL),
    ],

    'sham_cash' => [
        'enabled' => filter_var(env('OMB_SHAM_ENABLED', false), FILTER_VALIDATE_BOOL),
        'auto_transfer' => filter_var(env('OMB_SHAM_AUTO_TRANSFER', false), FILTER_VALIDATE_BOOL),
        'base_url' => env('OMB_SHAM_API_BASE_URL', 'https://tsa-api.com/api/v1'),
        'api_key' => env('OMB_SHAM_API_KEY'),
        'company_account' => env('OMB_SHAM_COMPANY_ACCOUNT'),
        'commission_recipient' => env('OMB_SHAM_COMMISSION_RECIPIENT'),
    ],
];
