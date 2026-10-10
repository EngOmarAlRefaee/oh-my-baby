<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('marketing_broadcasts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('sent_by')->nullable()->index();
            $table->string('channel', 20)->index();
            $table->string('subject')->nullable();
            $table->text('message');
            $table->unsignedInteger('recipients_count')->default(0);
            $table->unsignedInteger('success_count')->default(0);
            $table->unsignedInteger('failed_count')->default(0);
            $table->string('status', 30)->default('completed')->index();
            $table->json('meta')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('marketing_broadcasts');
    }
};
