<?php

namespace App\Services;

use App\Models\CommissionTransfer;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class ShamCashService
{
    public function configured(): bool
    {
        return (bool) config('ohmybaby.sham_cash.enabled')
            && filled(config('ohmybaby.sham_cash.api_key'))
            && filled(config('ohmybaby.sham_cash.company_account'))
            && filled(config('ohmybaby.sham_cash.commission_recipient'));
    }

    /** Real transfer of an arbitrary amount from the primary admin's linked account to the owner. */
    public function transferAmount(float $amountUsd, string $note, ?string $pin = null): array
    {
        if (! $this->configured()) {
            throw new RuntimeException('Sham Cash transfer is not configured.');
        }
        if ($amountUsd <= 0) {
            throw new RuntimeException('Invalid transfer amount.');
        }

        $query = http_build_query([
            'resource' => 'shamcash',
            'action' => 'transfer',
            'account_address' => config('ohmybaby.sham_cash.company_account'),
        ]);
        $body = [
            'to_address' => config('ohmybaby.sham_cash.commission_recipient'),
            'amount' => number_format($amountUsd, 2, '.', ''),
            'currency' => 'USD',
            'note' => $note,
        ];
        if (filled($pin)) $body['pin'] = $pin;

        $response = Http::acceptJson()
            ->withHeaders(['X-Api-Key' => config('ohmybaby.sham_cash.api_key')])
            ->timeout(15)
            ->post(rtrim((string) config('ohmybaby.sham_cash.base_url'), '/').'?'.$query, $body);

        $data = $response->json() ?: [];
        if (! $response->successful() || ! ($data['success'] ?? false)) {
            throw new RuntimeException($data['error'] ?? $data['message'] ?? 'Sham Cash transfer failed.');
        }

        return $data;
    }

    public function transfer(CommissionTransfer $commission, ?string $pin = null): array
    {
        if (! $this->configured()) {
            throw new RuntimeException('Sham Cash transfer is not configured.');
        }

        $query = http_build_query([
            'resource' => 'shamcash',
            'action' => 'transfer',
            'account_address' => config('ohmybaby.sham_cash.company_account'),
        ]);

        $body = [
            'to_address' => config('ohmybaby.sham_cash.commission_recipient'),
            'amount' => number_format((float) $commission->amount_usd, 2, '.', ''),
            'currency' => 'USD',
            'note' => "OH MY BABY commission {$commission->order->reference}",
        ];
        if (filled($pin)) $body['pin'] = $pin;

        $response = Http::acceptJson()
            ->withHeaders(['X-Api-Key' => config('ohmybaby.sham_cash.api_key')])
            ->timeout(12)
            ->post(rtrim((string) config('ohmybaby.sham_cash.base_url'), '/').'?'.$query, $body);

        $data = $response->json() ?: [];
        if (! $response->successful() || ! ($data['success'] ?? false)) {
            throw new RuntimeException($data['error'] ?? $data['message'] ?? 'Sham Cash transfer failed.');
        }

        return $data;
    }
}
