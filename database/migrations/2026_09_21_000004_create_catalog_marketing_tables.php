<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('external_id')->unique();
            $table->json('payload');
            $table->string('status', 30)->default('active')->index();
            $table->boolean('is_summer')->default(false)->index();
            $table->boolean('is_winter')->default(false)->index();
            $table->unsignedBigInteger('sold_count')->default(0)->index();
            $table->timestamp('out_of_stock_since')->nullable()->index();
            $table->timestamp('archived_at')->nullable()->index();
            $table->timestamps();
        });

        Schema::create('promo_codes', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->decimal('discount_percent', 5, 2);
            $table->boolean('active')->default(true)->index();
            $table->boolean('first_order_only')->default(false);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamps();
        });

        DB::table('promo_codes')->insert([
            'code' => 'BABY10',
            'discount_percent' => 10,
            'active' => true,
            'first_order_only' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Schema::create('newsletter_subscribers', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->boolean('active')->default(true)->index();
            $table->timestamp('subscribed_at')->nullable();
            $table->timestamp('unsubscribed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('interest_poll_votes', function (Blueprint $table) {
            $table->id();
            $table->string('section', 80)->index();
            $table->string('choice', 30)->index();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('session_key', 120)->nullable()->index();
            $table->timestamps();
            $table->unique(['section', 'session_key']);
        });

        Schema::create('wishlist_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('product_external_id')->index();
            $table->timestamps();
            $table->unique(['user_id', 'product_external_id']);
        });

        Schema::create('product_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('product_external_id')->index();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedTinyInteger('rating');
            $table->text('comment')->nullable();
            $table->string('status', 20)->default('published')->index();
            $table->timestamps();
            $table->unique(['user_id', 'product_external_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_reviews');
        Schema::dropIfExists('wishlist_items');
        Schema::dropIfExists('interest_poll_votes');
        Schema::dropIfExists('newsletter_subscribers');
        Schema::dropIfExists('promo_codes');
        Schema::dropIfExists('products');
    }
};
