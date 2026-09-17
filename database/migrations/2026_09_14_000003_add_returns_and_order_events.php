<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('return_delivery_id')->nullable()->after('assigned_delivery_id')->constrained('users')->nullOnDelete();
            $table->text('return_reason')->nullable()->after('delivery_note');
            $table->text('return_admin_note')->nullable()->after('return_reason');
            $table->timestamp('return_requested_at')->nullable()->after('rejected_at');
            $table->timestamp('return_approved_at')->nullable()->after('return_requested_at');
            $table->timestamp('return_rejected_at')->nullable()->after('return_approved_at');
            $table->timestamp('return_assigned_at')->nullable()->after('return_rejected_at');
            $table->timestamp('return_started_at')->nullable()->after('return_assigned_at');
            $table->timestamp('returned_at')->nullable()->after('return_started_at');
        });

        Schema::table('commission_transfers', function (Blueprint $table) {
            $table->timestamp('reversed_at')->nullable()->after('transferred_at');
            $table->text('reversal_reason')->nullable()->after('reversed_at');
        });

        Schema::create('order_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('event', 80)->index();
            $table->text('note')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_events');

        Schema::table('commission_transfers', function (Blueprint $table) {
            $table->dropColumn(['reversed_at', 'reversal_reason']);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('return_delivery_id');
            $table->dropColumn([
                'return_reason', 'return_admin_note', 'return_requested_at', 'return_approved_at',
                'return_rejected_at', 'return_assigned_at', 'return_started_at', 'returned_at',
            ]);
        });
    }
};
