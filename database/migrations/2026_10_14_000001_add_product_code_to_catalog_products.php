<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('catalog_products', 'product_code')) {
            Schema::table('catalog_products', function (Blueprint $table) {
                $table->unsignedInteger('product_code')->nullable()->unique();
            });
        }

        // Give existing products a number, oldest first: OMB-10001, OMB-10002, ...
        $next = max(10000, (int) DB::table('catalog_products')->max('product_code')) + 1;
        foreach (DB::table('catalog_products')->whereNull('product_code')->orderBy('id')->pluck('id') as $id) {
            DB::table('catalog_products')->where('id', $id)->update(['product_code' => $next++]);
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('catalog_products', 'product_code')) {
            Schema::table('catalog_products', function (Blueprint $table) {
                $table->dropUnique(['product_code']);
                $table->dropColumn('product_code');
            });
        }
    }
};
