<?php

use App\Http\Controllers\AccountOverviewController;
use App\Http\Controllers\AdminOrderController;
use App\Http\Controllers\AdminProductController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\CommissionController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeliveryOrderController;
use App\Http\Controllers\ExchangeRateController;
use App\Http\Controllers\GoogleAuthController;
use App\Http\Controllers\MarketingController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\OwnerRequestController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProductReviewController;
use App\Http\Controllers\SiteVisitController;
use App\Http\Controllers\SupportConversationController;
use App\Http\Controllers\SmsGatewayController;
use App\Http\Controllers\TeamManagementController;
use App\Http\Controllers\WishlistController;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Support\Facades\Route;

Route::get('/auth/session', [AuthController::class, 'session']);
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:20,1');
Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:60,1');
Route::post('/auth/email-verification/send', [AuthController::class, 'sendEmailVerification'])->middleware(['auth', 'throttle:5,1']);
Route::post('/auth/email-verification/verify', [AuthController::class, 'verifyEmail'])->middleware(['auth', 'throttle:10,1']);
Route::post('/auth/password/forgot', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
Route::post('/auth/password/reset', [AuthController::class, 'resetPassword'])->middleware('throttle:10,1');
Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('auth');

Route::get('/auth/google/status', [GoogleAuthController::class, 'status']);
Route::get('/auth/google/redirect', [GoogleAuthController::class, 'redirect']);
Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback']);

Route::get('/api/exchange-rate', ExchangeRateController::class)->middleware('throttle:90,1');
Route::get('/api/promo/current', [MarketingController::class, 'publicPromo'])->middleware('throttle:60,1');
Route::get('/api/best-sellers', [MarketingController::class, 'bestSellers'])->middleware('throttle:60,1');
Route::get('/api/products', [ProductController::class, 'index'])->middleware('throttle:90,1');
Route::get('/api/products/{externalId}', [ProductController::class, 'show'])->middleware('throttle:90,1');
Route::get('/api/catalog/products', [CatalogController::class, 'publicIndex'])->middleware('throttle:90,1');
Route::get('/api/products/{productId}/reviews', [ProductReviewController::class, 'index'])->middleware('throttle:90,1');

// Public engagement endpoints are intentionally CSRF-exempt so static/SPA forms can post safely.
// They remain rate-limited and validated server-side.
Route::post('/api/newsletter/subscribe', [MarketingController::class, 'subscribe'])
    ->middleware('throttle:8,1')
    ->withoutMiddleware(ValidateCsrfToken::class);
Route::post('/api/interest-polls/vote', [MarketingController::class, 'vote'])
    ->middleware('throttle:60,1')
    ->withoutMiddleware(ValidateCsrfToken::class);
Route::get('/api/interest-polls/results', [MarketingController::class, 'pollResults'])->middleware('throttle:60,1');
Route::post('/api/customer-feedback', [MarketingController::class, 'submitFeedback'])
    ->middleware('throttle:12,1')
    ->withoutMiddleware(ValidateCsrfToken::class);
Route::post('/api/site-visits', [SiteVisitController::class, 'store'])
    ->middleware('throttle:30,1')
    ->withoutMiddleware(ValidateCsrfToken::class);

// Android SMS Gateway endpoints use a one-time pairing code and then a Bearer device token.
Route::post('/api/sms-gateway/pair', [SmsGatewayController::class, 'pair'])
    ->middleware('throttle:10,1')
    ->withoutMiddleware(ValidateCsrfToken::class);
Route::get('/api/sms-gateway/pending', [SmsGatewayController::class, 'pending'])->middleware('throttle:120,1');
Route::post('/api/sms-gateway/campaigns/{campaign}/confirm', [SmsGatewayController::class, 'confirm'])
    ->middleware('throttle:60,1')
    ->withoutMiddleware(ValidateCsrfToken::class);
Route::get('/api/sms-gateway/campaigns/{campaign}/next', [SmsGatewayController::class, 'nextBatch'])->middleware('throttle:240,1');
Route::post('/api/sms-gateway/campaigns/{campaign}/recipients/{recipient}/result', [SmsGatewayController::class, 'recipientResult'])
    ->middleware('throttle:300,1')
    ->withoutMiddleware(ValidateCsrfToken::class);

Route::post('/api/orders', [OrderController::class, 'store'])->middleware('throttle:20,1');

Route::post('/api/support/conversations', [SupportConversationController::class, 'create'])->middleware('throttle:8,1');
Route::get('/api/support/conversations/{conversation}', [SupportConversationController::class, 'showParticipant'])->middleware('throttle:60,1');
Route::post('/api/support/conversations/{conversation}/messages', [SupportConversationController::class, 'replyParticipant'])->middleware('throttle:30,1');

Route::middleware(['auth', 'active'])->group(function () {
    Route::get('/api/account/overview', AccountOverviewController::class);
    Route::get('/api/orders/mine', [OrderController::class, 'mine']);
    Route::get('/api/support/mine', [SupportConversationController::class, 'mine']);
    Route::post('/api/support/conversations/{conversation}/claim', [SupportConversationController::class, 'claimGuest'])->middleware('throttle:20,1');
    Route::post('/api/orders/{order}/confirm-receipt', [OrderController::class, 'confirmReceipt'])->middleware('throttle:30,1');
Route::post('/api/orders/{order}/return-request', [OrderController::class, 'requestReturn'])->middleware('throttle:60,1');
    Route::get('/api/wishlist', [WishlistController::class, 'index']);
    Route::post('/api/wishlist', [WishlistController::class, 'sync'])->middleware('throttle:30,1');
    Route::post('/api/products/{productId}/reviews', [ProductReviewController::class, 'store'])->middleware('throttle:60,1');
});

Route::middleware(['auth', 'active', 'role:owner,admin', 'permission:analytics.view'])->group(function () {
    Route::get('/api/dashboard', DashboardController::class);
});

Route::middleware(['auth', 'active', 'role:owner,admin'])->prefix('api/admin')->group(function () {
    Route::get('/orders', [AdminOrderController::class, 'index'])->middleware('permission:orders.view');
    Route::post('/orders/{order}/accept', [AdminOrderController::class, 'accept'])->middleware('permission:orders.accept');
    Route::post('/orders/{order}/reject', [AdminOrderController::class, 'reject'])->middleware('permission:orders.reject');
    Route::post('/orders/{order}/dispatch', [AdminOrderController::class, 'dispatch'])->middleware('permission:orders.dispatch');
    Route::post('/orders/{order}/return-approve', [AdminOrderController::class, 'approveReturn'])->middleware('permission:orders.returns');
    Route::post('/orders/{order}/return-reject', [AdminOrderController::class, 'rejectReturn'])->middleware('permission:orders.returns');
    Route::post('/orders/{order}/return-dispatch', [AdminOrderController::class, 'dispatchReturn'])->middleware('permission:orders.returns');

    Route::get('/marketing', [MarketingController::class, 'adminIndex'])->middleware('permission:marketing.view');
    Route::post('/marketing/promo', [MarketingController::class, 'savePromo'])->middleware('permission:marketing.manage');
    Route::get('/marketing/contacts', [MarketingController::class, 'contacts'])->middleware('permission:marketing.contacts.view');
    Route::post('/marketing/broadcast/email', [MarketingController::class, 'sendEmailBroadcast'])->middleware('permission:marketing.email.send');
    Route::post('/marketing/broadcast/whatsapp', [MarketingController::class, 'sendWhatsappBroadcast'])->middleware('permission:marketing.whatsapp.send');
    Route::get('/marketing/sms-gateway', [SmsGatewayController::class, 'adminStatus']);
    Route::post('/marketing/sms-gateway/pairing-code', [SmsGatewayController::class, 'createPairingCode'])->middleware('permission:marketing.sms.gateway.manage');
    Route::post('/marketing/broadcast/sms', [SmsGatewayController::class, 'createCampaign'])->middleware('permission:marketing.sms.send');

    Route::get('/my-commissions', [CommissionController::class, 'myCommissions'])->middleware('permission:commissions.self.view');
    Route::post('/my-commissions/claim-transfer', [CommissionController::class, 'submitSettlementClaim'])->middleware('permission:commissions.self.claim');

    Route::get('/products', [CatalogController::class, 'adminIndex'])->middleware('permission:products.view');
    Route::post('/products/bootstrap', [CatalogController::class, 'bootstrap'])->middleware('permission:products.create');
    Route::post('/products', [CatalogController::class, 'store'])->middleware('permission:products.create');
    Route::put('/products/{externalId}', [CatalogController::class, 'update'])->middleware('permission:products.edit');
    Route::delete('/products/{externalId}', [CatalogController::class, 'archive'])->middleware('permission:products.archive');
    Route::post('/products/upload-image', [CatalogController::class, 'uploadImage'])->middleware('permission:products.edit');

    Route::post('/legacy-products/bulk-sync', [AdminProductController::class, 'bulkSync'])->middleware('permission:products.edit');
    Route::put('/legacy-products/{externalId}', [AdminProductController::class, 'upsert'])->middleware('permission:products.edit');
    Route::delete('/legacy-products/{externalId}', [AdminProductController::class, 'archive'])->middleware('permission:products.archive');
    Route::post('/legacy-products/upload-image', [AdminProductController::class, 'uploadImage'])->middleware('permission:products.edit');

    Route::get('/owner-requests', [OwnerRequestController::class, 'adminIndex'])->middleware('permission:owner_requests.manage');
    Route::post('/owner-requests', [OwnerRequestController::class, 'store'])->middleware('permission:owner_requests.manage');
});

Route::middleware(['auth', 'active', 'role:owner,admin'])->prefix('api/support/staff')->group(function () {
    Route::get('/', [SupportConversationController::class, 'staffIndex'])->middleware('permission:support.view');
    Route::get('/summary', [SupportConversationController::class, 'staffSummary'])->middleware('permission:support.view');
    Route::get('/assignees', [SupportConversationController::class, 'staffAssignees'])->middleware('permission:support.assign');
    Route::get('/{conversation}', [SupportConversationController::class, 'staffShow'])->middleware('permission:support.view');
    Route::post('/{conversation}/messages', [SupportConversationController::class, 'staffReply'])->middleware('permission:support.reply');
    Route::post('/{conversation}/assign', [SupportConversationController::class, 'assign'])->middleware('permission:support.assign');
    Route::post('/{conversation}/close', [SupportConversationController::class, 'close'])->middleware('permission:support.close');
    Route::post('/{conversation}/reopen', [SupportConversationController::class, 'reopen'])->middleware('permission:support.close');
});

Route::middleware(['auth', 'active', 'role:owner,admin'])->prefix('api/team')->group(function () {
    Route::get('/', [TeamManagementController::class, 'index'])->middleware('permission:team.view');
    Route::post('/', [TeamManagementController::class, 'store'])->middleware('permission:team.create_admin,team.create_delivery,team.create_customer');
    Route::put('/{user}', [TeamManagementController::class, 'update'])->middleware('permission:team.edit_accounts,team.manage_permissions');
    Route::post('/{user}/suspend', [TeamManagementController::class, 'suspend'])->middleware('permission:team.suspend_accounts');
    Route::post('/{user}/reactivate', [TeamManagementController::class, 'reactivate'])->middleware('permission:team.suspend_accounts');
    Route::post('/{user}/make-primary-admin', [TeamManagementController::class, 'makePrimaryAdmin'])->middleware('role:owner');
    Route::delete('/{user}', [TeamManagementController::class, 'destroy'])->middleware('role:owner');
});

Route::middleware(['auth', 'active', 'role:owner'])->prefix('api/owner')->group(function () {
    Route::get('/requests', [OwnerRequestController::class, 'ownerIndex']);
    Route::post('/requests/{ownerRequest}/resolve', [OwnerRequestController::class, 'resolve']);
});

Route::middleware(['auth', 'active', 'role:owner,admin,delivery'])->prefix('api/delivery')->group(function () {
    Route::get('/orders', [DeliveryOrderController::class, 'index'])->middleware('permission:delivery.orders.view,delivery.view,delivery.act_as');
    Route::post('/orders/{order}/start', [DeliveryOrderController::class, 'startDelivery'])->middleware('permission:delivery.start,delivery.act_as');
    Route::post('/orders/{order}/deliver', [DeliveryOrderController::class, 'markDelivered'])->middleware('permission:delivery.complete,delivery.act_as');
    Route::post('/orders/{order}/return-at-door', [DeliveryOrderController::class, 'returnAtDoor'])->middleware('permission:delivery.return_at_door,delivery.act_as');
    Route::post('/orders/{order}/return-start', [DeliveryOrderController::class, 'startReturn'])->middleware('permission:delivery.return_pickup,delivery.act_as');
    Route::post('/orders/{order}/return-complete', [DeliveryOrderController::class, 'completeReturn'])->middleware('permission:delivery.return_complete,delivery.act_as');
});

Route::middleware(['auth', 'active', 'role:owner'])->group(function () {
    Route::get('/api/owner/commissions', [CommissionController::class, 'index']);
    Route::post('/api/owner/commissions/{commission}/transfer', [CommissionController::class, 'transfer']);
    Route::post('/api/owner/finance/accounts/{account}/settlements', [CommissionController::class, 'recordSettlement']);
    Route::post('/api/owner/finance/transfer-claims/{claim}/confirm', [CommissionController::class, 'confirmSettlementClaim']);
    Route::post('/api/owner/finance/transfer-claims/{claim}/reject', [CommissionController::class, 'rejectSettlementClaim']);
});

Route::view('/owner/support/{any?}', 'welcome')->where('any', '.*')->middleware(['auth', 'active', 'role:owner']);
Route::view('/owner/{any?}', 'welcome')->where('any', '.*')->middleware(['auth', 'active', 'role:owner']);

// Admin workspace pages are permission-gated on the server too. The dashboard itself stays
// available to every active admin and renders only the modules granted to that account.
Route::view('/admin/support/{any?}', 'welcome')->where('any', '.*')->middleware(['auth', 'active', 'role:owner,admin', 'permission:support.view']);
Route::view('/admin/team/{any?}', 'welcome')->where('any', '.*')->middleware(['auth', 'active', 'role:owner,admin', 'permission:team.view']);
Route::view('/admin/orders/{any?}', 'welcome')->where('any', '.*')->middleware(['auth', 'active', 'role:owner,admin', 'permission:orders.view']);
Route::view('/admin/products/{any?}', 'welcome')->where('any', '.*')->middleware(['auth', 'active', 'role:owner,admin', 'permission:products.view']);
Route::view('/admin/operations/{any?}', 'welcome')->where('any', '.*')->middleware(['auth', 'active', 'role:owner,admin', 'permission:commissions.self.view']);
Route::view('/admin/marketing/{any?}', 'welcome')->where('any', '.*')->middleware(['auth', 'active', 'role:owner,admin', 'permission:marketing.view']);
Route::view('/admin/decoration/{any?}', 'welcome')->where('any', '.*')->middleware(['auth', 'active', 'role:owner,admin', 'permission:decoration.view']);
Route::view('/admin/{any?}', 'welcome')->where('any', '.*')->middleware(['auth', 'active', 'role:owner,admin']);

Route::view('/delivery/{any?}', 'welcome')->where('any', '.*')->middleware([
    'auth',
    'active',
    'role:owner,admin,delivery',
    'permission:delivery.orders.view,delivery.view,delivery.act_as',
]);

Route::view('/customer/{any?}', 'welcome')->where('any', '.*')->middleware(['auth', 'active', 'role:customer']);

Route::view('/account', 'welcome')->name('login')->middleware('staff.workspace');
Route::view('/', 'welcome')->middleware('staff.workspace');
Route::view('/{any}', 'welcome')->where('any', '.*')->middleware('staff.workspace');


