<?php

namespace App\Http\Controllers;

use App\Models\SiteSection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Editable storefront sections (seasonal / trend blocks) managed from the
 * Admin workspace. The storefront falls back to its built-in defaults whenever
 * nothing was saved, so an empty table never breaks the homepage.
 */
class SiteContentController extends Controller
{
    private const FEATURED_KEY = 'featured-collection';
    private const TEXT_FIELDS = ['eyebrow', 'sectionTitle', 'sectionSubtitle', 'badge', 'headline', 'description', 'cta', 'secondary', 'imageAlt'];

    public function featuredCollection(): JsonResponse
    {
        return response()->json(['content' => SiteSection::where('key', self::FEATURED_KEY)->value('content')]);
    }

    public function saveFeaturedCollection(Request $request): JsonResponse
    {
        $data = $request->validate([
            'content' => ['required', 'array'],
            'content.image' => ['nullable', 'string', 'max:500'],
            'content.ctaHref' => ['nullable', 'string', 'max:300'],
            'content.secondaryHref' => ['nullable', 'string', 'max:300'],
            'content.seasonTag' => ['nullable', 'string', 'max:40'],
            'content.watermark' => ['nullable', 'string', 'max:12'],
            'content.imageX' => ['nullable', 'numeric', 'between:0,100'],
            'content.imageY' => ['nullable', 'numeric', 'between:0,100'],
            'content.imageZoom' => ['nullable', 'numeric', 'between:1,2.5'],
            'content.ar' => ['required', 'array'],
            'content.en' => ['nullable', 'array'],
        ]);

        $raw = $data['content'];
        $clean = [
            'image' => $this->safeUrl($raw['image'] ?? null, 'content.image'),
            'ctaHref' => $this->safeUrl($raw['ctaHref'] ?? null, 'content.ctaHref'),
            'secondaryHref' => $this->safeUrl($raw['secondaryHref'] ?? null, 'content.secondaryHref'),
            'seasonTag' => $this->text($raw['seasonTag'] ?? '', 40),
            'watermark' => $this->text($raw['watermark'] ?? '', 12),
            'imageX' => isset($raw['imageX']) ? round((float) $raw['imageX'], 1) : 100.0,
            'imageY' => isset($raw['imageY']) ? round((float) $raw['imageY'], 1) : 28.0,
            'imageZoom' => isset($raw['imageZoom']) ? round((float) $raw['imageZoom'], 2) : 1.0,
            'ar' => $this->localeBlock($raw['ar'] ?? []),
            'en' => $this->localeBlock($raw['en'] ?? []),
        ];

        if (($clean['ar']['headline'] ?? '') === '' || ($clean['ar']['sectionTitle'] ?? '') === '') {
            throw ValidationException::withMessages(['content.ar' => ['عنوان القسم والعنوان الرئيسي مطلوبان.']]);
        }

        $section = SiteSection::updateOrCreate(
            ['key' => self::FEATURED_KEY],
            ['content' => $clean, 'updated_by' => $request->user()?->id],
        );

        return response()->json(['content' => $section->content]);
    }

    public function uploadImage(Request $request): JsonResponse
    {
        $data = $request->validate([
            'image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:8192'],
        ]);

        $directory = public_path('uploads/site');
        if (! is_dir($directory)) {
            mkdir($directory, 0775, true);
        }

        $file = $data['image'];
        $extension = strtolower($file->getClientOriginalExtension() ?: 'jpg');
        $filename = now()->format('YmdHis').'-'.Str::lower(Str::random(12)).'.'.$extension;
        $file->move($directory, $filename);

        return response()->json(['url' => '/uploads/site/'.$filename]);
    }

    private function localeBlock(mixed $block): array
    {
        $block = is_array($block) ? $block : [];
        $out = [];
        foreach (self::TEXT_FIELDS as $field) {
            $out[$field] = $this->text($block[$field] ?? '', $field === 'description' ? 600 : 200);
        }
        $tags = is_array($block['tags'] ?? null) ? $block['tags'] : [];
        $out['tags'] = array_values(array_filter(array_map(
            fn ($tag) => $this->text($tag, 40),
            array_slice($tags, 0, 6),
        ), fn ($tag) => $tag !== ''));

        return $out;
    }

    private function text(mixed $value, int $max): string
    {
        return Str::limit(trim(strip_tags((string) $value)), $max, '');
    }

    /** Only same-site paths or http(s) URLs are accepted (blocks javascript:/data: links). */
    private function safeUrl(mixed $value, string $field): ?string
    {
        $url = trim((string) $value);
        if ($url === '') {
            return null;
        }
        $ok = (str_starts_with($url, '/') && ! str_starts_with($url, '//')) || preg_match('#^https?://#i', $url);
        if (! $ok) {
            throw ValidationException::withMessages([$field => ['الرابط لازم يبدأ بـ / أو http(s)://']]);
        }

        return $url;
    }
}
