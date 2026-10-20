<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('order_items', 'return_requested_quantity')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->unsignedInteger('return_requested_quantity')->default(0);
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('order_items', 'return_requested_quantity')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->dropColumn('return_requested_quantity');
            });
        }
    }
};
