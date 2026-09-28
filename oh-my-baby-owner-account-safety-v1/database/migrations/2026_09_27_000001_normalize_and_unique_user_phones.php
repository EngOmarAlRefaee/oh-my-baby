<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('users') || ! Schema::hasColumn('users', 'phone')) {
            return;
        }

        $rows = DB::table('users')
            ->whereNotNull('phone')
            ->where('phone', '!=', '')
            ->orderBy('id')
            ->get(['id', 'phone']);

        $normalizedById = [];
        $owners = [];
        foreach ($rows as $row) {
            $normalized = str_replace([' ', '-', '(', ')'], '', trim((string) $row->phone));
            if ($normalized === '') {
                continue;
            }

            if (isset($owners[$normalized])) {
                throw new \RuntimeException(
                    'Cannot add a unique phone constraint because users '.$owners[$normalized].' and '.$row->id.' normalize to the same phone: '.$normalized
                );
            }

            $owners[$normalized] = $row->id;
            $normalizedById[$row->id] = $normalized;
        }

        foreach ($normalizedById as $id => $normalized) {
            DB::table('users')->where('id', $id)->update(['phone' => $normalized]);
        }

        Schema::table('users', function (Blueprint $table): void {
            $table->unique('phone', 'users_phone_unique');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('users') || ! Schema::hasColumn('users', 'phone')) {
            return;
        }

        Schema::table('users', function (Blueprint $table): void {
            $table->dropUnique('users_phone_unique');
        });
    }
};
