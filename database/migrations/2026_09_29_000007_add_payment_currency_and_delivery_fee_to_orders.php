<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->string('payment_currency', 8)->default('usd')->after('coupon_code');
            $table->decimal('delivery_fee_usd', 10, 2)->default(0)->after('payment_currency');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->dropColumn(['payment_currency', 'delivery_fee_usd']);
        });
    }
};
