<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SiteSection extends Model
{
    protected $fillable = ['key', 'content', 'updated_by'];

    protected function casts(): array
    {
        return ['content' => 'array'];
    }

    public function updatedBy(): BelongsTo { return $this->belongsTo(User::class, 'updated_by'); }
}
