<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('account_status', 20)->default('active')->after('role')->index();
            $table->timestamp('last_login_at')->nullable()->after('account_status');
            $table->timestamp('suspended_at')->nullable()->after('last_login_at');
            $table->unsignedBigInteger('suspended_by')->nullable()->after('suspended_at')->index();
            $table->text('suspension_reason')->nullable()->after('suspended_by');
            $table->unsignedBigInteger('created_by')->nullable()->after('suspension_reason')->index();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['account_status']);
            $table->dropIndex(['suspended_by']);
            $table->dropIndex(['created_by']);
            $table->dropColumn([
                'account_status', 'last_login_at', 'suspended_at', 'suspended_by',
                'suspension_reason', 'created_by',
            ]);
        });
    }
};
