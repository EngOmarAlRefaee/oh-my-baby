<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('marketing_contacts')) return;
        Schema::create('marketing_contacts', function (Blueprint $table) {
            $table->id();
            $table->string('phone', 30)->unique();
            $table->string('name', 140)->nullable();
            $table->string('source', 30)->default('order');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('marketing_contacts');
    }
};
