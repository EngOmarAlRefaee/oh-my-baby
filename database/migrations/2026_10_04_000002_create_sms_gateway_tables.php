<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sms_gateway_devices', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120)->default('Android SMS Gateway');
            $table->string('token_hash', 64)->unique();
            $table->foreignId('paired_by')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('active')->default(true)->index();
            $table->timestamp('last_seen_at')->nullable()->index();
            $table->string('last_ip', 64)->nullable();
            $table->timestamps();
        });

        Schema::create('sms_gateway_pairings', function (Blueprint $table) {
            $table->id();
            $table->string('code_hash', 64)->unique();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('expires_at')->index();
            $table->timestamp('consumed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('sms_campaigns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('device_id')->nullable()->constrained('sms_gateway_devices')->nullOnDelete();
            $table->text('message');
            $table->string('status', 40)->default('pending_confirmation')->index();
            $table->unsignedInteger('recipients_count')->default(0);
            $table->unsignedInteger('sent_count')->default(0);
            $table->unsignedInteger('failed_count')->default(0);
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('sms_campaign_recipients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campaign_id')->constrained('sms_campaigns')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('phone', 24);
            $table->string('status', 30)->default('queued')->index();
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->text('error')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
            $table->unique(['campaign_id', 'phone']);
            $table->index(['campaign_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sms_campaign_recipients');
        Schema::dropIfExists('sms_campaigns');
        Schema::dropIfExists('sms_gateway_pairings');
        Schema::dropIfExists('sms_gateway_devices');
    }
};
