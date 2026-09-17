<?php

namespace App\Http\Controllers;

use App\Models\StaffActionLog;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class GoogleAuthController extends Controller
{
    public function status()
    {
        return response()->json(['enabled' => filled(config('services.google.client_id')) && filled(config('services.google.client_secret'))]);
    }

    public function redirect(Request $request): RedirectResponse
    {
        $clientId = config('services.google.client_id');
        $redirect = config('services.google.redirect');
        if (! filled($clientId) || ! filled(config('services.google.client_secret'))) {
            return redirect('/account?google=not-configured');
        }

        $state = Str::random(40);
        $request->session()->put('google_oauth_state', $state);

        $query = http_build_query([
            'client_id' => $clientId,
            'redirect_uri' => $redirect,
            'response_type' => 'code',
            'scope' => 'openid email profile',
            'state' => $state,
            'prompt' => 'select_account',
        ]);

        return redirect()->away('https://accounts.google.com/o/oauth2/v2/auth?'.$query);
    }

    public function callback(Request $request): RedirectResponse
    {
        if (! hash_equals((string) $request->session()->pull('google_oauth_state'), (string) $request->query('state'))) {
            return redirect('/account?google=state-error');
        }

        $code = (string) $request->query('code');
        if ($code === '') return redirect('/account?google=cancelled');

        try {
            $token = Http::asForm()->post('https://oauth2.googleapis.com/token', [
                'code' => $code,
                'client_id' => config('services.google.client_id'),
                'client_secret' => config('services.google.client_secret'),
                'redirect_uri' => config('services.google.redirect'),
                'grant_type' => 'authorization_code',
            ])->throw()->json();

            $accessToken = $token['access_token'] ?? null;
            if (! $accessToken) throw new RuntimeException('Google did not return an access token.');

            $profile = Http::withToken($accessToken)->acceptJson()->get('https://openidconnect.googleapis.com/v1/userinfo')->throw()->json();
            if (! ($profile['email_verified'] ?? false) || empty($profile['email']) || empty($profile['sub'])) {
                throw new RuntimeException('Google account email is not verified.');
            }

            $existingByGoogle = User::where('google_id', $profile['sub'])->first();
            $existingByEmail = User::where('email', $profile['email'])->first();
            $user = $existingByGoogle ?: $existingByEmail;

            if ($user && $user->role !== 'customer') {
                throw new RuntimeException('Staff accounts cannot be converted into customer Google accounts.');
            }

            if ($user && ($user->account_status ?? 'active') !== 'active') {
                return redirect('/account?google=suspended');
            }

            $user ??= new User(['email' => $profile['email'], 'role' => 'customer', 'account_status' => 'active']);
            $user->fill([
                'name' => $profile['name'] ?? $profile['email'],
                'google_id' => $profile['sub'],
                'avatar_url' => $profile['picture'] ?? null,
            ]);
            if (! $user->exists) $user->password = Str::random(48);
            $user->save();

            Auth::login($user, true);
            $request->session()->regenerate();
            $user->forceFill(['last_login_at' => now()])->save();
            StaffActionLog::create([
                'actor_user_id' => $user->id,
                'target_user_id' => $user->id,
                'action' => 'login',
                'note' => 'Successful Google login.',
                'meta' => ['role' => $user->role, 'provider' => 'google'],
            ]);
            return redirect('/account?google=ok');
        } catch (\Throwable $error) {
            report($error);
            return redirect('/account?google=failed');
        }
    }
}
