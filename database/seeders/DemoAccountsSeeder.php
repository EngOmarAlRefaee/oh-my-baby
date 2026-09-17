<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use RuntimeException;

class DemoAccountsSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->environment('production')) {
            throw new RuntimeException('DemoAccountsSeeder is intentionally disabled in production.');
        }

        $accounts = [
            [
                'name' => 'OH MY BABY Owner',
                'email' => env('OMB_DEMO_OWNER_EMAIL', 'owner@ohmybaby.local'),
                'phone' => '+00000000001',
                'role' => 'owner',
                'password' => env('OMB_DEMO_OWNER_PASSWORD', 'OMB-Owner-2026!'),
            ],
            [
                'name' => 'OH MY BABY Admin',
                'email' => env('OMB_DEMO_ADMIN_EMAIL', 'admin@ohmybaby.local'),
                'phone' => '+00000000002',
                'role' => 'admin',
                'password' => env('OMB_DEMO_ADMIN_PASSWORD', 'OMB-Admin-2026!'),
            ],
            [
                'name' => 'OH MY BABY Admin 2',
                'email' => env('OMB_DEMO_ADMIN2_EMAIL', 'admin2@ohmybaby.local'),
                'phone' => '+00000000005',
                'role' => 'admin',
                'password' => env('OMB_DEMO_ADMIN2_PASSWORD', 'OMB-Admin2-2026!'),
                'account_status' => 'active',
            ],
            [
                'name' => 'OH MY BABY Delivery',
                'email' => env('OMB_DEMO_DELIVERY_EMAIL', 'delivery@ohmybaby.local'),
                'phone' => '+00000000003',
                'role' => 'delivery',
                'password' => env('OMB_DEMO_DELIVERY_PASSWORD', 'OMB-Delivery-2026!'),
            ],
            [
                'name' => 'OH MY BABY Member',
                'email' => env('OMB_DEMO_MEMBER_EMAIL', 'member@ohmybaby.local'),
                'phone' => '+00000000004',
                'role' => 'customer',
                'password' => env('OMB_DEMO_MEMBER_PASSWORD', 'OMB-Member-2026!'),
            ],
        ];

        foreach ($accounts as $account) {
            User::updateOrCreate(
                ['email' => $account['email']],
                $account,
            );
        }
    }
}
