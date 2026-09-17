<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteVisit extends Model
{
    protected $fillable = ['user_id', 'session_key', 'path', 'visited_at'];

    protected function casts(): array
    {
        return ['visited_at' => 'datetime'];
    }
}
