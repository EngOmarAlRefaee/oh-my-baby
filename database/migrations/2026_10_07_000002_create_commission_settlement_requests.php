<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commission_settlement_requests', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('account_user_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('resolved_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('financial_settlement_id')->nullable()->constrained('financial_settlements')->nullOnDelete();
            $table->decimal('amount_usd', 12, 4);
            $table->string('week_key', 20)->index();
            $table->string('status', 24)->default('pending')->index();
            $table->text('admin_note')->nullable();
            $table->text('owner_note')->nullable();
            $table->timestamp('submitted_at')->nullable()->index();
            $table->timestamp('resolved_at')->nullable()->index();
            $table->timestamps();

            $table->index(['account_user_id', 'status']);
            $table->index(['account_user_id', 'week_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commission_settlement_requests');
    }
};
