<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_primary_admin')->default(false)->after('role')->index();
        });

        $firstAdminId = \Illuminate\Support\Facades\DB::table('users')
            ->where('role', 'admin')
            ->orderBy('id')
            ->value('id');
        if ($firstAdminId) {
            \Illuminate\Support\Facades\DB::table('users')->where('id', $firstAdminId)->update(['is_primary_admin' => true]);
        }

        Schema::create('owner_requests' , function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_id')->constrained('users')->cascadeOnDelete();
            $table->string('type', 60)->default('general')->index();
            $table->string('title', 180);
            $table->text('message');
            $table->string('status', 30)->default('pending')->index();
            $table->text('owner_response')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('site_visits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('session_key', 64)->index();
            $table->string('path', 500)->default('/');
            $table->timestamp('visited_at')->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_visits');
        Schema::dropIfExists('owner_requests');
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('is_primary_admin');
        });
    }
};
