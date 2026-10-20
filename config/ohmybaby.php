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

    'returns' => [
        // Days after delivery during which the customer can request a return.
        'window_days' => (int) env('OMB_RETURN_WINDOW_DAYS', 3),
    ],

    // Sham Cash account of the primary admin (the account the weekly transfer to the owner is sent from).
    'shamcash' => [
        'name' => env('OMB_SHAMCASH_NAME', 'صفا محمد نضال الداودي'),
        'address' => env('OMB_SHAMCASH_ADDRESS', 'd5a79488551602257bc448ada6deff03'),
        'qr' => '/images/shamcash/primary-admin.png',
    ],

    // Sham Cash account of the owner: the destination of the weekly transfer from each admin.
    'owner_shamcash' => [
        'name' => env('OMB_OWNER_SHAMCASH_NAME', 'عمر محمد الرفاعي'),
        'address' => env('OMB_OWNER_SHAMCASH_ADDRESS', '7cdca81a107991bf4c2d27f5002716dd'),
        'qr' => '/images/shamcash/owner.png',
    ],

    'commissions' => [
        // Lock Admins out (except the dues page) while last week's commission is unpaid.
        'lock_on_overdue' => filter_var(env('OMB_COMMISSION_LOCK', true), FILTER_VALIDATE_BOOL),
        'single_piece_usd' => (float) env('OMB_SINGLE_PIECE_COMMISSION_USD', 0.25),
        'normal_order_usd' => (float) env('OMB_NORMAL_ORDER_COMMISSION_USD', 0.50),
        // Receipt is confirmed automatically this many hours after delivery when the
        // customer (or a guest) did not confirm it.
        'auto_confirm_hours' => (int) env('OMB_AUTO_CONFIRM_HOURS', 12),
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
