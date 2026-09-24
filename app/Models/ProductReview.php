<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class ProductReview extends Model
{
    protected $fillable = ['user_id','product_external_id','order_id','rating','comment','status'];
    protected function casts(): array { return ['rating'=>'integer']; }
}
