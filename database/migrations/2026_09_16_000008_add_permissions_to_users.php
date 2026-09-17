<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->json('permissions')->nullable()->after('is_primary_admin');
            $table->timestamp('permissions_updated_at')->nullable()->after('permissions');
            $table->unsignedBigInteger('permissions_updated_by')->nullable()->after('permissions_updated_at')->index();
        });

        // Existing delivery accounts were created before granular permissions
        // existed. Keep them operational after this migration; new accounts are
        // configured explicitly from the Accounts & Team screen.
        $deliveryPermissions = [
            'delivery.orders.view',
            'delivery.start',
            'delivery.complete',
            'delivery.return_at_door',
            'delivery.return_pickup',
            'delivery.return_complete',
            'delivery.customer_phone',
        ];

        DB::table('users')
            ->where('role', 'delivery')
            ->whereNull('permissions')
            ->update([
                'permissions' => json_encode($deliveryPermissions, JSON_UNESCAPED_UNICODE),
                'permissions_updated_at' => now(),
            ]);

        // Secondary Admins intentionally start with no delegated permissions.
        // The primary Admin/Owner can grant exactly what each one needs.
        DB::table('users')
            ->where('role', 'admin')
            ->where('is_primary_admin', false)
            ->whereNull('permissions')
            ->update([
                'permissions' => json_encode([]),
                'permissions_updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['permissions_updated_by']);
            $table->dropColumn(['permissions', 'permissions_updated_at', 'permissions_updated_by']);
        });
    }
};
