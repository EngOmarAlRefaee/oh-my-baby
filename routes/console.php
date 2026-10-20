<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\Schema;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');




Artisan::command('omb:auto-confirm-receipts {--hours= : Override the configured number of hours}', function (\App\Services\CommissionService $commissions) {
    $hours = $this->option('hours') !== null ? (int) $this->option('hours') : null;
    $count = $commissions->autoConfirmDeliveredOrders($hours);
    $this->info("Auto-confirmed receipt for {$count} order(s).");
})->purpose('Auto-confirm receipt (and accrue Admin commission) for delivered orders nobody confirmed.');

// Requires the standard Laravel cron entry: * * * * * php artisan schedule:run
Schedule::command('omb:auto-confirm-receipts')->everyTenMinutes()->withoutOverlapping();

Artisan::command('omb:reset-commerce {--force : Actually delete commercial demo/test data}', function () {
    if (! $this->option('force')) {
        $this->warn('DRY RUN ONLY — nothing was deleted.');
        $this->line('Run again with: php artisan omb:reset-commerce --force');
        $this->newLine();
    }

    $tables = [
        'commission_settlement_requests',
        'financial_settlement_items',
        'financial_ledger_entries',
        'financial_settlements',
        'commission_shares',
        'commission_transfers',
        'order_events',
        'product_reviews',
        'reward_coupons',
        'order_items',
        'orders',
        'wishlist_items',
        'catalog_products',
        'products',
    ];

    $counts = [];
    foreach ($tables as $table) {
        if (Schema::hasTable($table)) {
            $counts[$table] = DB::table($table)->count();
        }
    }

    $this->table(['Table', 'Rows to remove'], collect($counts)->map(fn ($count, $table) => [$table, $count])->values()->all());

    $imageDirectories = [
        public_path('images/products'),
        public_path('uploads/products'),
        storage_path('app/public/products'),
    ];

    foreach ($imageDirectories as $directory) {
        if (is_dir($directory)) {
            $this->line('Product images: '.$directory);
        }
    }

    if (! $this->option('force')) {
        return self::SUCCESS;
    }

    $stamp = now()->format('Ymd_His');
    $backupRoot = storage_path('app/omb-reset-backups/'.$stamp);
    File::ensureDirectoryExists($backupRoot);

    // Small JSON backup of exactly the business rows being cleared.
    foreach ($tables as $table) {
        if (! Schema::hasTable($table)) {
            continue;
        }
        $rows = DB::table($table)->get();
        File::put($backupRoot.'/'.$table.'.json', $rows->toJson(JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }

    // Keep a copy of uploaded/catalog product images before deleting them.
    foreach ($imageDirectories as $directory) {
        if (! is_dir($directory)) {
            continue;
        }
        $name = str_replace(['/', '\\', ':'], '_', trim(str_replace(base_path(), '', $directory), '/\\'));
        File::copyDirectory($directory, $backupRoot.'/images/'.$name);
    }

    DB::transaction(function () use ($tables): void {
        // Delete children first so this works with SQLite/MySQL foreign keys enabled.
        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                DB::table($table)->delete();
            }
        }
    });

    foreach ($imageDirectories as $directory) {
        if (is_dir($directory)) {
            File::deleteDirectory($directory);
        }
    }

    $this->info('Commercial demo/test data cleared successfully.');
    $this->line('Users, roles/permissions, settings, support chats and customer accounts were NOT deleted.');
    $this->line('Backup saved to: '.$backupRoot);
    $this->warn('Open the site once in each browser; the frontend will clear old demo product/cart cache automatically.');

    return self::SUCCESS;
})->purpose('Clear demo products, orders, commissions and product images while preserving accounts and permissions.');
