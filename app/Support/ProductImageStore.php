<?php

namespace App\Support;

/**
 * Saves product photos as real files (public/uploads/products) instead of
 * huge base64 text inside the database/JSON. The browser can then cache them
 * and the catalog API stays tiny.
 */
class ProductImageStore
{
    public static function externalize(?string $value): ?string
    {
        if (! is_string($value) || ! str_starts_with($value, 'data:image/')) {
            return $value;
        }
        if (! preg_match('#^data:image/(png|jpe?g|webp|gif);base64,(.+)$#s', $value, $m)) {
            return $value;
        }
        $binary = base64_decode($m[2], true);
        if ($binary === false || $binary === '') {
            return $value;
        }
        $ext = $m[1] === 'jpeg' ? 'jpg' : $m[1];
        $dir = public_path('uploads/products');
        if (! is_dir($dir) && ! @mkdir($dir, 0775, true) && ! is_dir($dir)) {
            return $value; // cannot write: keep the old behaviour instead of losing the image
        }
        $name = substr(hash('sha256', $binary), 0, 40).'.'.$ext;
        $path = $dir.DIRECTORY_SEPARATOR.$name;
        if (! is_file($path) && @file_put_contents($path, $binary) === false) {
            return $value;
        }

        return '/uploads/products/'.$name;
    }

    /** @param array<int,array<string,mixed>> $colors */
    public static function externalizeColors(array $colors): array
    {
        foreach ($colors as $i => $color) {
            if (isset($color['image'])) {
                $colors[$i]['image'] = self::externalize($color['image']);
            }
            if (isset($color['images']) && is_array($color['images'])) {
                $colors[$i]['images'] = array_values(array_map(fn ($img) => self::externalize($img), $color['images']));
            }
        }

        return $colors;
    }
}
