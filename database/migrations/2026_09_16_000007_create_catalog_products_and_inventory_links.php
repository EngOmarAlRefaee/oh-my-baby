<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('catalog_products', function (Blueprint $table) {
            $table->id();
            $table->string('external_id')->unique();
            $table->string('slug')->nullable()->index();
            $table->string('world', 60)->nullable()->index();
            $table->string('category', 80)->nullable()->index();
            $table->string('subcategory', 100)->nullable()->index();
            $table->string('audience', 40)->default('all')->index();
            $table->string('name_ar', 220);
            $table->string('name_en', 220)->nullable();
            $table->text('description_ar')->nullable();
            $table->text('description_en')->nullable();
            $table->decimal('price_usd', 12, 2)->default(0);
            $table->decimal('offer_price_usd', 12, 2)->nullable();
            $table->text('image')->nullable();
            $table->json('colors')->nullable();
            $table->json('sizes')->nullable();
            $table->json('inventory')->nullable();
            $table->json('sections')->nullable();
            $table->string('status', 30)->default('active')->index();
            $table->unsignedInteger('low_stock_threshold')->default(2);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->foreignId('catalog_product_id')->nullable()->after('product_external_id')->constrained('catalog_products')->nullOnDelete();
            $table->string('inventory_key', 220)->nullable()->after('size');
            $table->timestamp('stock_restored_at')->nullable()->after('inventory_key');
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropForeign(['catalog_product_id']);
            $table->dropColumn(['catalog_product_id', 'inventory_key', 'stock_restored_at']);
        });
        Schema::dropIfExists('catalog_products');
    }
};
