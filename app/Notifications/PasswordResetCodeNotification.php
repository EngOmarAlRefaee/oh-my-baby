<?php

namespace App\Notifications;

use App\Services\AuthCodeService;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PasswordResetCodeNotification extends Notification
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
            ->subject('OH MY BABY — استرجاع كلمة المرور')
            ->greeting('OH MY BABY')
            ->line('استخدم الرمز التالي لإعادة تعيين كلمة المرور:')
            ->line($this->code)
            ->line('صلاحية الرمز '.AuthCodeService::TTL_MINUTES.' دقائق.')
            ->line('إذا لم تطلب تغيير كلمة المرور، تجاهل الرسالة ولا تشارك الرمز مع أحد.');
    }
}
