<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('promo_codes')) {
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
        }

        DB::table('promo_codes')->updateOrInsert(
            ['code' => 'BABY10'],
            [
                'discount_percent' => 10,
                'active' => true,
                'first_order_only' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        if (! Schema::hasTable('newsletter_subscribers')) {
            Schema::create('newsletter_subscribers', function (Blueprint $table) {
                $table->id();
                $table->string('email')->unique();
                $table->boolean('active')->default(true)->index();
                $table->timestamp('subscribed_at')->nullable();
                $table->timestamp('unsubscribed_at')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('interest_poll_votes')) {
            Schema::create('interest_poll_votes', function (Blueprint $table) {
                $table->id();
                $table->string('section', 80)->index();
                $table->string('choice', 30)->index();
                $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
                $table->string('session_key', 120)->nullable()->index();
                $table->timestamps();
                $table->unique(['section', 'session_key']);
            });
        }

        if (! Schema::hasTable('customer_feedback')) {
            Schema::create('customer_feedback', function (Blueprint $table) {
                $table->id();
                $table->string('source', 80)->default('website')->index();
                $table->text('message');
                $table->unsignedBigInteger('user_id')->nullable()->index();
                $table->string('ip_address', 80)->nullable();
                $table->string('user_agent', 500)->nullable();
                $table->string('status', 30)->default('new')->index();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_feedback');
        Schema::dropIfExists('interest_poll_votes');
        Schema::dropIfExists('newsletter_subscribers');
    }
};
