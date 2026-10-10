<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Legacy product storage: keep an owner snapshot there too so old API paths
        // cannot create owner-less products.
        if (Schema::hasTable('products') && ! Schema::hasColumn('products', 'created_by_user_id')) {
            Schema::table('products', function (Blueprint $table): void {
                $table->foreignId('created_by_user_id')
                    ->nullable()
                    ->after('external_id')
                    ->constrained('users')
                    ->nullOnDelete();
            });
        }

        if (! Schema::hasColumn('order_items', 'source_admin_user_id')) {
            Schema::table('order_items', function (Blueprint $table): void {
                // Immutable attribution snapshot copied from the product owner when
                // the order is submitted. Later product edits never change history.
                $table->foreignId('source_admin_user_id')
                    ->nullable()
                    ->after('product_external_id')
                    ->constrained('users')
                    ->nullOnDelete();
                $table->index(['order_id', 'source_admin_user_id']);
            });
        }


        // Commission shares may be fractions of one cent (e.g. $0.50 / 4 = $0.1250).
        // Keep four decimals internally so the approved split is exact.
        if (Schema::hasTable('financial_ledger_entries')) {
            Schema::table('financial_ledger_entries', function (Blueprint $table): void {
                $table->decimal('amount_usd', 12, 4)->change();
            });
        }
        if (Schema::hasTable('financial_settlements')) {
            Schema::table('financial_settlements', function (Blueprint $table): void {
                $table->decimal('amount_usd', 12, 4)->change();
                $table->decimal('amount_currency', 16, 4)->nullable()->change();
            });
        }
        if (Schema::hasTable('financial_settlement_items')) {
            Schema::table('financial_settlement_items', function (Blueprint $table): void {
                $table->decimal('amount_usd', 12, 4)->change();
            });
        }

        if (! Schema::hasTable('commission_shares')) {
            Schema::create('commission_shares', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('commission_transfer_id')->constrained('commission_transfers')->cascadeOnDelete();
                $table->foreignId('order_id')->constrained()->cascadeOnDelete();
                $table->foreignId('admin_user_id')->constrained('users')->restrictOnDelete();
                $table->decimal('amount_usd', 12, 4);
                $table->decimal('paid_usd', 12, 4)->default(0);
                $table->string('status', 30)->default('pending')->index();
                $table->timestamp('reversed_at')->nullable();
                $table->timestamps();

                $table->unique(['commission_transfer_id', 'admin_user_id']);
                $table->index(['admin_user_id', 'status']);
                $table->index(['order_id', 'admin_user_id']);
            });
        }

        if (Schema::hasTable('financial_ledger_entries') && ! Schema::hasColumn('financial_ledger_entries', 'commission_share_id')) {
            Schema::table('financial_ledger_entries', function (Blueprint $table): void {
                $table->foreignId('commission_share_id')
                    ->nullable()
                    ->after('commission_transfer_id')
                    ->constrained('commission_shares')
                    ->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('financial_ledger_entries') && Schema::hasColumn('financial_ledger_entries', 'commission_share_id')) {
            Schema::table('financial_ledger_entries', function (Blueprint $table): void {
                $table->dropConstrainedForeignId('commission_share_id');
            });
        }

        Schema::dropIfExists('commission_shares');

        if (Schema::hasColumn('order_items', 'source_admin_user_id')) {
            Schema::table('order_items', function (Blueprint $table): void {
                $table->dropIndex(['order_id', 'source_admin_user_id']);
                $table->dropConstrainedForeignId('source_admin_user_id');
            });
        }


        if (Schema::hasTable('financial_settlement_items')) {
            Schema::table('financial_settlement_items', function (Blueprint $table): void {
                $table->decimal('amount_usd', 12, 2)->change();
            });
        }
        if (Schema::hasTable('financial_settlements')) {
            Schema::table('financial_settlements', function (Blueprint $table): void {
                $table->decimal('amount_usd', 12, 2)->change();
                $table->decimal('amount_currency', 16, 2)->nullable()->change();
            });
        }
        if (Schema::hasTable('financial_ledger_entries')) {
            Schema::table('financial_ledger_entries', function (Blueprint $table): void {
                $table->decimal('amount_usd', 12, 2)->change();
            });
        }

        if (Schema::hasTable('products') && Schema::hasColumn('products', 'created_by_user_id')) {
            Schema::table('products', function (Blueprint $table): void {
                $table->dropConstrainedForeignId('created_by_user_id');
            });
        }
    }
};
