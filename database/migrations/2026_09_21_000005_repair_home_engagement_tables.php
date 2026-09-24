<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('newsletter_subscribers')) {
            Schema::create('newsletter_subscribers', function (Blueprint $table) {
                $table->id();
                $table->string('email')->unique();
                $table->boolean('active')->default(true)->index();
                $table->timestamp('subscribed_at')->nullable();
                $table->timestamp('unsubscribed_at')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('interest_poll_votes')) {
            Schema::create('interest_poll_votes', function (Blueprint $table) {
                $table->id();
                $table->string('section', 80)->index();
                $table->string('choice', 30)->index();
                $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
                $table->string('session_key', 120)->nullable()->index();
                $table->timestamps();
                $table->unique(['section', 'session_key']);
            });
        }
    }

    public function down(): void
    {
        // This is a repair migration. Never drop existing marketing data on rollback.
    }
};
