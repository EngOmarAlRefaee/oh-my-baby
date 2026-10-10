<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->boolean('storefront_access')->default(true);
        });

        // Existing staff accounts keep the workspace-only behaviour introduced in step 1.
        DB::table('users')->whereIn('role', ['admin', 'delivery'])->update(['storefront_access' => false]);
        DB::table('users')->whereIn('role', ['owner', 'customer'])->update(['storefront_access' => true]);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn('storefront_access');
        });
    }
};
