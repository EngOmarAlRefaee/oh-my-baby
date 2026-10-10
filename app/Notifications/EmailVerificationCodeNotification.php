<?php

namespace App\Notifications;

use App\Services\AuthCodeService;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EmailVerificationCodeNotification extends Notification
{
    use Queueable;

    public function __construct(public string $code)
    {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('OH MY BABY — رمز التحقق من البريد')
            ->greeting('أهلاً بك في OH MY BABY')
            ->line('رمز التحقق من بريدك الإلكتروني هو:')
            ->line($this->code)
            ->line('صلاحية الرمز '.AuthCodeService::TTL_MINUTES.' دقائق.')
            ->line('إذا لم تطلب هذا الرمز، تجاهل الرسالة.');
    }
}
