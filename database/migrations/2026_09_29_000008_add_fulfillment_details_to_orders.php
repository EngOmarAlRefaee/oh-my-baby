<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->string('fulfillment_method', 20)->default('delivery')->after('payment_currency');
            $table->string('delivery_zone', 20)->nullable()->after('fulfillment_method');

            $table->string('shipping_full_name', 160)->nullable()->after('delivery_zone');
            $table->string('shipping_governorate', 120)->nullable()->after('shipping_full_name');
            $table->string('shipping_company', 160)->nullable()->after('shipping_governorate');
            $table->text('shipping_address')->nullable()->after('shipping_company');
            $table->string('shipping_phone', 50)->nullable()->after('shipping_address');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->dropColumn([
                'fulfillment_method',
                'delivery_zone',
                'shipping_full_name',
                'shipping_governorate',
                'shipping_company',
                'shipping_address',
                'shipping_phone',
            ]);
        });
    }
};
