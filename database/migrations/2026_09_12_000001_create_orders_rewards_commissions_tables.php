<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('google_id')->nullable()->unique()->after('email');
            $table->string('avatar_url')->nullable()->after('google_id');
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('assigned_delivery_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 40)->default('pending_review')->index();
            $table->string('customer_name', 140);
            $table->string('customer_phone', 50);
            $table->text('delivery_address');
            $table->text('customer_note')->nullable();
            $table->text('admin_note')->nullable();
            $table->text('delivery_note')->nullable();
            $table->decimal('subtotal_usd', 12, 2)->default(0);
            $table->decimal('discount_usd', 12, 2)->default(0);
            $table->decimal('total_usd', 12, 2)->default(0);
            $table->decimal('exchange_rate', 14, 4)->nullable();
            $table->decimal('total_syp', 14, 2)->nullable();
            $table->string('exchange_source')->nullable();
            $table->string('coupon_code')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('out_for_delivery_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('product_external_id');
            $table->string('name_ar', 220)->nullable();
            $table->string('name_en', 220)->nullable();
            $table->text('image')->nullable();
            $table->string('color_id')->nullable();
            $table->string('color_name')->nullable();
            $table->string('size')->nullable();
            $table->unsignedInteger('quantity');
            $table->decimal('unit_price_usd', 12, 2);
            $table->decimal('line_total_usd', 12, 2);
            $table->string('category')->nullable()->index();
            $table->json('sections')->nullable();
            $table->boolean('is_offer')->default(false)->index();
            $table->timestamps();
        });

        Schema::create('reward_coupons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('code')->unique();
            $table->unsignedInteger('unlock_orders');
            $table->decimal('discount_percent', 5, 2);
            $table->string('status', 20)->default('available')->index();
            $table->foreignId('used_on_order_id')->nullable()->constrained('orders')->nullOnDelete();
            $table->timestamp('used_at')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'unlock_orders']);
        });

        Schema::create('commission_transfers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('type', 40);
            $table->decimal('amount_usd', 8, 2)->default(0);
            $table->string('status', 30)->default('pending')->index();
            $table->string('provider')->default('sham_cash');
            $table->string('provider_transaction_id')->nullable();
            $table->text('failure_reason')->nullable();
            $table->timestamp('transferred_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commission_transfers');
        Schema::dropIfExists('reward_coupons');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');

        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['google_id']);
            $table->dropColumn(['google_id', 'avatar_url']);
        });
    }
};
