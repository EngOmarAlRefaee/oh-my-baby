<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // Production and local development now use real accounts managed by the Owner UI.
        // Intentionally empty: demo accounts are permanently retired.
    }
}
