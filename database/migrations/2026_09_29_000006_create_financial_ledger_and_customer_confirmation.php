<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->foreignId('accepted_by_user_id')->nullable()->after('accepted_at')->constrained('users')->nullOnDelete();
            $table->timestamp('customer_confirmed_at')->nullable()->after('delivered_at')->index();
        });

        Schema::table('commission_transfers', function (Blueprint $table): void {
            $table->foreignId('debtor_user_id')->nullable()->after('order_id')->constrained('users')->nullOnDelete();
        });

        Schema::create('financial_settlements', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('account_user_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('confirmed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('amount_usd', 12, 2);
            $table->string('currency', 10)->default('USD');
            $table->decimal('amount_currency', 16, 2)->nullable();
            $table->decimal('exchange_rate', 16, 4)->nullable();
            $table->string('provider', 40)->default('manual');
            $table->string('provider_transaction_id', 190)->nullable()->index();
            $table->string('status', 30)->default('confirmed')->index();
            $table->unsignedInteger('orders_count')->default(0);
            $table->text('note')->nullable();
            $table->timestamp('confirmed_at')->nullable()->index();
            $table->timestamps();
        });

        Schema::create('financial_ledger_entries', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('account_user_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('commission_transfer_id')->nullable()->constrained('commission_transfers')->nullOnDelete();
            $table->foreignId('settlement_id')->nullable()->constrained('financial_settlements')->nullOnDelete();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('type', 40)->index();
            // Account perspective: commission debt is negative, payment/reversal is positive.
            $table->decimal('amount_usd', 12, 2);
            $table->string('idempotency_key', 190)->unique();
            $table->string('description', 255)->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();
            $table->index(['account_user_id', 'created_at']);
        });

        Schema::create('financial_settlement_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('settlement_id')->constrained('financial_settlements')->cascadeOnDelete();
            $table->foreignId('ledger_entry_id')->constrained('financial_ledger_entries')->restrictOnDelete();
            $table->decimal('amount_usd', 12, 2);
            $table->timestamps();
            $table->unique(['settlement_id', 'ledger_entry_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('financial_settlement_items');
        Schema::dropIfExists('financial_ledger_entries');
        Schema::dropIfExists('financial_settlements');

        Schema::table('commission_transfers', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('debtor_user_id');
        });

        Schema::table('orders', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('accepted_by_user_id');
            $table->dropIndex(['customer_confirmed_at']);
            $table->dropColumn('customer_confirmed_at');
        });
    }
};
