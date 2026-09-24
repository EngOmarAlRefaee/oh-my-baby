<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'marketing_opt_in')) {
            Schema::table('users', function (Blueprint $table) {
                $table->boolean('marketing_opt_in')->default(false)->after('phone');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'marketing_opt_in')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('marketing_opt_in');
            });
        }
    }
};