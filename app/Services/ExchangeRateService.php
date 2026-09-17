<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class ExchangeRateService
{
    public function current(): array
    {
        $minutes = max(1, (int) config('ohmybaby.exchange.cache_minutes', 5));

        return Cache::remember('omb.exchange.usd_syp.current', now()->addMinutes($minutes), function () {
            try {
                $rate = $this->fetchFromProvider();
                Cache::put('omb.exchange.usd_syp.last_good', $rate, now()->addHours(max(1, (int) config('ohmybaby.exchange.stale_hours', 24))));
                return $rate;
            } catch (\Throwable $error) {
                $stale = Cache::get('omb.exchange.usd_syp.last_good');
                if (is_array($stale) && isset($stale['usd_to_syp'])) {
                    return [...$stale, 'stale' => true, 'warning' => 'Live exchange source unavailable; using the latest cached rate.'];
                }

                $fallback = config('ohmybaby.exchange.fallback_rate');
                if (is_numeric($fallback) && (float) $fallback > 0) {
                    return [
                        'usd_to_syp' => (float) $fallback,
                        'source' => 'configured-fallback',
                        'fetched_at' => now()->toIso8601String(),
                        'stale' => true,
                        'warning' => 'Using configured emergency fallback rate.',
                    ];
                }

                throw $error;
            }
        });
    }

    public function convertUsdToSyp(float $usd, ?array $snapshot = null): float
    {
        $snapshot ??= $this->current();
        $amount = $usd * (float) $snapshot['usd_to_syp'];
        $roundTo = max(0.01, (float) config('ohmybaby.exchange.round_to', 0.5));

        return round($amount / $roundTo) * $roundTo;
    }

    private function fetchFromProvider(): array
    {
        $jsonUrl = (string) config('ohmybaby.exchange.url');
        if ($jsonUrl !== '') {
            try {
                $response = Http::timeout(7)->retry(2, 250)->withHeaders(['User-Agent' => 'OH-MY-BABY/1.0'])->get($jsonUrl);
                $response->throw();
                $payload = $response->json();
                if (is_array($payload)) {
                    $raw = $this->extractUsdRate($payload);
                    if ($raw && $raw > 0) {
                        $divisor = max(1, (float) config('ohmybaby.exchange.source_divisor', 1));
                        return $this->snapshot($raw / $divisor, 'sp_today_json');
                    }
                }
            } catch (\Throwable) {
                // Continue to the official public currency page fallback below.
            }
        }

        $htmlUrl = (string) config('ohmybaby.exchange.html_fallback_url');
        if ($htmlUrl !== '') {
            $response = Http::timeout(7)->retry(2, 250)->withHeaders([
                'User-Agent' => 'Mozilla/5.0 OH-MY-BABY/1.0',
                'Accept-Language' => 'en-US,en;q=0.9',
            ])->get($htmlUrl);
            $response->throw();
            $rate = $this->extractNewSypRateFromHtml($response->body());
            if ($rate && $rate > 0) return $this->snapshot($rate, 'sp_today_public_page');
        }

        throw new RuntimeException('USD/SYP rate was not found in SP Today sources.');
    }

    private function snapshot(float $rate, string $source): array
    {
        return [
            'usd_to_syp' => round($rate, 4),
            'source' => $source,
            'fetched_at' => now()->toIso8601String(),
            'stale' => false,
        ];
    }

    private function extractNewSypRateFromHtml(string $html): ?float
    {
        $plain = html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $plain = preg_replace('/\s+/u', ' ', $plain ?? '');

        // Prefer the SELL value because that is the safer retail conversion side.
        $patterns = [
            '/Sell\s+([0-9][0-9,.]*)\s*SYP\s*\(new\)/iu',
            '/USD.{0,140}?Sell.{0,40}?([0-9][0-9,.]*)\s*SYP/iu',
            '/دولار.{0,140}?مبيع.{0,40}?([0-9][0-9,.]*)/u',
        ];
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $plain, $matches)) {
                $value = $this->toFloat($matches[1] ?? null);
                if ($value && $value > 0) return $value;
            }
        }
        return null;
    }

    private function extractUsdRate(array $payload): ?float
    {
        $side = strtolower((string) config('ohmybaby.exchange.side', 'sell'));
        $preferred = $side === 'buy'
            ? ['buy', 'bid', 'purchase', 'buy_price', 'price_buy']
            : ['sell', 'ask', 'sale', 'sell_price', 'price_sell'];
        $fallbackKeys = ['price', 'rate', 'value'];

        foreach ($this->arrayNodes($payload) as $node) {
            $haystack = strtolower(json_encode($node, JSON_UNESCAPED_UNICODE) ?: '');
            $looksUsd = str_contains($haystack, 'usd') || str_contains($haystack, 'دولار') || str_contains($haystack, 'أمريكي') || str_contains($haystack, 'امريكي');
            if (! $looksUsd) continue;

            foreach ([...$preferred, ...$fallbackKeys] as $key) {
                if (array_key_exists($key, $node)) {
                    $number = $this->toFloat($node[$key]);
                    if ($number !== null && $number > 0) return $number;
                }
            }

            foreach ($node as $key => $value) {
                $keyText = strtolower((string) $key);
                if (in_array($keyText, $preferred, true) || str_contains($keyText, $side)) {
                    $number = $this->toFloat($value);
                    if ($number !== null && $number > 0) return $number;
                }
            }
        }

        return null;
    }

    private function arrayNodes(array $payload): array
    {
        $nodes = [$payload];
        foreach ($payload as $value) {
            if (is_array($value)) $nodes = [...$nodes, ...$this->arrayNodes($value)];
        }
        return $nodes;
    }

    private function toFloat(mixed $value): ?float
    {
        if (is_int($value) || is_float($value)) return (float) $value;
        if (! is_string($value)) return null;
        $normalized = str_replace([',', ' '], '', $value);
        $normalized = preg_replace('/[^0-9.\-]/u', '', $normalized ?? '');
        return is_numeric($normalized) ? (float) $normalized : null;
    }
}
