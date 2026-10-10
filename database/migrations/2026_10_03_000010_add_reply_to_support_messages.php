<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('support_messages', function (Blueprint $table): void {
            $table->foreignId('reply_to_message_id')
                ->nullable()
                ->constrained('support_messages')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('support_messages', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('reply_to_message_id');
        });
    }
};
