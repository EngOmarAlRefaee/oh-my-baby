<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class InterestPollVote extends Model
{
    protected $fillable = ['section','choice','user_id','session_key'];
}
