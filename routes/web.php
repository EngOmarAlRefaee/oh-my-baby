<?php

use App\Http\Controllers\AccountOverviewController;
use App\Http\Controllers\AdminOrderController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\CommissionController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeliveryOrderController;
use App\Http\Controllers\ExchangeRateController;
use App\Http\Controllers\GoogleAuthController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\OwnerRequestController;
use App\Http\Controllers\SiteVisitController;
use App\Http\Controllers\TeamManagementController;
use Illuminate\Support\Facades\Route;

Route::get('/auth/session', [AuthController::class, 'session']);
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:20,1');
Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('auth');

Route::get('/auth/google/status', [GoogleAuthController::class, 'status']);
Route::get('/auth/google/redirect', [GoogleAuthController::class, 'redirect']);
Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback']);

Route::get('/api/exchange-rate', ExchangeRateController::class)->middleware('throttle:90,1');
Route::get('/api/catalog', [CatalogController::class, 'publicIndex'])->middleware('throttle:120,1');
Route::post('/api/analytics/visit', [SiteVisitController::class, 'store'])->middleware('throttle:120,1');

Route::middleware(['auth', 'active'])->group(function () {
    Route::get('/api/account/overview', AccountOverviewController::class);
    Route::get('/api/orders/mine', [OrderController::class, 'mine']);
    Route::post('/api/orders', [OrderController::class, 'store'])->middleware('throttle:20,1');
    Route::post('/api/orders/{order}/return-request', [OrderController::class, 'requestReturn'])->middleware('throttle:10,1');
});

// Every Admin can land on the control center. The cards/data inside it are
// limited by the permissions assigned to that Admin.
Route::middleware(['auth', 'active', 'role:owner,admin'])->group(function () {
    Route::get('/api/dashboard', DashboardController::class);
});

Route::middleware(['auth', 'active', 'role:admin', 'permission:owner_requests.manage'])
    ->prefix('api/admin')->group(function () {
        Route::get('/owner-requests', [OwnerRequestController::class, 'adminIndex']);
        Route::post('/owner-requests', [OwnerRequestController::class, 'store']);
    });

Route::middleware(['auth', 'active', 'role:owner'])->prefix('api/owner')->group(function () {
    Route::get('/requests', [OwnerRequestController::class, 'ownerIndex']);
    Route::post('/requests/{ownerRequest}/resolve', [OwnerRequestController::class, 'resolve']);
});

Route::middleware(['auth', 'active', 'role:owner,admin'])->prefix('api/admin')->group(function () {
    Route::get('/catalog', [CatalogController::class, 'adminIndex'])->middleware('permission:products.view');
    Route::post('/catalog/bootstrap', [CatalogController::class, 'bootstrap'])->middleware('permission:products.create');
    Route::post('/catalog', [CatalogController::class, 'store'])->middleware('permission:products.create');
    Route::put('/catalog/{externalId}', [CatalogController::class, 'update'])->middleware('permission:products.edit');
    Route::delete('/catalog/{externalId}', [CatalogController::class, 'archive'])->middleware('permission:products.archive');
    Route::post('/catalog/image', [CatalogController::class, 'uploadImage'])->middleware('permission:products.create,products.edit');

    Route::get('/orders', [AdminOrderController::class, 'index'])->middleware('permission:orders.view');
    Route::post('/orders/{order}/accept', [AdminOrderController::class, 'accept'])->middleware('permission:orders.accept');
    Route::post('/orders/{order}/reject', [AdminOrderController::class, 'reject'])->middleware('permission:orders.reject');
    Route::post('/orders/{order}/dispatch', [AdminOrderController::class, 'dispatch'])->middleware('permission:orders.dispatch');
    Route::post('/orders/{order}/return-approve', [AdminOrderController::class, 'approveReturn'])->middleware('permission:orders.returns');
    Route::post('/orders/{order}/return-reject', [AdminOrderController::class, 'rejectReturn'])->middleware('permission:orders.returns');
    Route::post('/orders/{order}/return-dispatch', [AdminOrderController::class, 'dispatchReturn'])->middleware('permission:orders.returns');
});

Route::middleware(['auth', 'active', 'role:owner,admin,delivery'])->prefix('api/delivery')->group(function () {
    Route::get('/orders', [DeliveryOrderController::class, 'index'])->middleware('permission:delivery.view,delivery.orders.view');
    Route::post('/orders/{order}/start', [DeliveryOrderController::class, 'startDelivery'])->middleware('permission:delivery.act_as,delivery.start');
    Route::post('/orders/{order}/deliver', [DeliveryOrderController::class, 'markDelivered'])->middleware('permission:delivery.act_as,delivery.complete');
    Route::post('/orders/{order}/return-at-door', [DeliveryOrderController::class, 'returnAtDoor'])->middleware('permission:delivery.act_as,delivery.return_at_door');
    Route::post('/orders/{order}/return-start', [DeliveryOrderController::class, 'startReturn'])->middleware('permission:delivery.act_as,delivery.return_pickup');
    Route::post('/orders/{order}/return-complete', [DeliveryOrderController::class, 'completeReturn'])->middleware('permission:delivery.act_as,delivery.return_complete');
});

Route::middleware(['auth', 'active', 'role:owner,admin', 'permission:finance.view'])
    ->get('/api/owner/commissions', [CommissionController::class, 'index']);
Route::middleware(['auth', 'active', 'role:owner,admin', 'permission:finance.transfer'])
    ->post('/api/owner/commissions/{commission}/transfer', [CommissionController::class, 'transfer']);

Route::middleware(['auth', 'active', 'role:owner,admin'])->prefix('api/team')->group(function () {
    Route::get('/', [TeamManagementController::class, 'index'])->middleware('permission:team.view');
    Route::post('/', [TeamManagementController::class, 'store'])->middleware('permission:team.view');
    Route::put('/{user}', [TeamManagementController::class, 'update'])->middleware('permission:team.edit_accounts');
    Route::post('/{user}/suspend', [TeamManagementController::class, 'suspend'])->middleware('permission:team.suspend_accounts');
    Route::post('/{user}/reactivate', [TeamManagementController::class, 'reactivate'])->middleware('permission:team.suspend_accounts');
});
Route::middleware(['auth', 'active', 'role:owner'])->post('/api/team/{user}/make-primary-admin', [TeamManagementController::class, 'makePrimaryAdmin']);

// Owner pages: Owner always has all operational access plus Owner-only powers.
Route::view('/owner/{any?}', 'welcome')
    ->where('any', '.*')
    ->middleware(['auth', 'active', 'role:owner']);

// Permission-protected Admin workspaces.
Route::view('/admin/team', 'welcome')->middleware(['auth', 'active', 'role:owner,admin', 'permission:team.view']);
Route::view('/admin/owner-requests', 'welcome')->middleware(['auth', 'active', 'role:admin', 'permission:owner_requests.manage']);
Route::view('/admin/operations', 'welcome')->middleware(['auth', 'active', 'role:owner,admin', 'permission:finance.view']);
Route::view('/admin/orders', 'welcome')->middleware(['auth', 'active', 'role:owner,admin', 'permission:orders.view']);
Route::view('/admin/products', 'welcome')->middleware(['auth', 'active', 'role:owner,admin', 'permission:products.view']);

// The Admin control center itself is always reachable after Admin login; it
// only shows the sections that the Admin actually has permission to use.
Route::view('/admin/{any?}', 'welcome')
    ->where('any', '.*')
    ->middleware(['auth', 'active', 'role:owner,admin']);

Route::view('/delivery/{any?}', 'welcome')
    ->where('any', '.*')
    ->middleware(['auth', 'active', 'role:owner,admin,delivery', 'permission:delivery.act_as,delivery.orders.view']);

Route::view('/account', 'welcome')->name('login');
Route::view('/', 'welcome');
Route::view('/{any}', 'welcome')->where('any', '.*');
