<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\User;
use App\Services\CatalogInventoryService;
use Illuminate\Support\Facades\DB;
use App\Support\DataScope;
use App\Support\PermissionCatalog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminOrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $orders = Order::with([
            'items', 'user:id,name,email,phone', 'deliveryUser:id,name,phone',
            'returnDeliveryUser:id,name,phone', 'commission',
        ]);
        DataScope::applyOrders($orders, $request->user());

        $drivers = PermissionCatalog::has($request->user(), 'orders.dispatch')
            ? User::where('role', 'delivery')->where('account_status', 'active')->orderBy('name')->get(['id', 'name', 'phone', 'email'])
            : collect();

        return response()->json([
            'orders' => $orders->latest()->limit(200)->get(),
            'drivers' => $drivers,
        ]);
    }

    public function accept(Request $request, Order $order): JsonResponse
    {
        DataScope::assertOrderVisible($request->user(), $order);

        if ($order->status !== 'pending_review') {
            return response()->json(['message' => 'Only orders under review can be accepted.'], 409);
        }

        $order->update([
            'status' => 'accepted',
            'accepted_at' => now(),
            'accepted_by_user_id' => $request->user()->id,
            'rejected_at' => null,
        ]);
        $this->event($order, $request, 'order_accepted');

        return $this->freshOrder($order);
    }

    public function reject(Request $request, Order $order, CatalogInventoryService $inventoryService): JsonResponse
    {
        DataScope::assertOrderVisible($request->user(), $order);

        if ($order->status !== 'pending_review') {
            return response()->json(['message' => 'Only orders under review can be rejected.'], 409);
        }

        $data = $request->validate(['admin_note' => ['nullable', 'string', 'max:3000']]);

        DB::transaction(function () use ($order, $request, $data, $inventoryService) {
            $locked = Order::whereKey($order->id)->lockForUpdate()->firstOrFail();
            if ($locked->status !== 'pending_review') {
                abort(409, 'Only orders under review can be rejected.');
            }
            $locked->update([
                'status' => 'rejected',
                'admin_note' => $data['admin_note'] ?? $locked->admin_note,
                'rejected_at' => now(),
            ]);
            $inventoryService->restoreOrder($locked);
            $this->event($locked, $request, 'order_rejected', $data['admin_note'] ?? null);
        });

        return $this->freshOrder($order);
    }

    public function dispatch(Request $request, Order $order): JsonResponse
    {
        DataScope::assertOrderVisible($request->user(), $order);

        if ($order->status !== 'accepted') {
            return response()->json(['message' => 'Accept the order before sending it to a driver.'], 409);
        }

        $data = $request->validate(['delivery_user_id' => ['required', 'integer', 'exists:users,id']]);
        $driver = User::whereKey($data['delivery_user_id'])->where('role', 'delivery')->firstOrFail();

        $order->update([
            'assigned_delivery_id' => $driver->id,
            'status' => 'assigned_to_driver',
            'assigned_at' => now(),
        ]);
        $this->event($order, $request, 'order_dispatched', null, ['delivery_user_id' => $driver->id]);

        return $this->freshOrder($order);
    }

    public function approveReturn(Request $request, Order $order): JsonResponse
    {
        DataScope::assertOrderVisible($request->user(), $order);

        if ($order->status !== 'return_requested') {
            return response()->json(['message' => 'This order does not have a pending return request.'], 409);
        }

        $data = $request->validate(['note' => ['nullable', 'string', 'max:3000']]);
        $order->update([
            'status' => 'return_approved',
            'return_admin_note' => $data['note'] ?? null,
            'return_approved_at' => now(),
            'return_rejected_at' => null,
        ]);
        $this->event($order, $request, 'return_approved', $data['note'] ?? null);

        return $this->freshOrder($order);
    }

    public function rejectReturn(Request $request, Order $order): JsonResponse
    {
        DataScope::assertOrderVisible($request->user(), $order);

        if ($order->status !== 'return_requested') {
            return response()->json(['message' => 'This order does not have a pending return request.'], 409);
        }

        $data = $request->validate(['note' => ['nullable', 'string', 'max:3000']]);
        $order->update([
            'status' => 'delivered',
            'return_admin_note' => $data['note'] ?? null,
            'return_rejected_at' => now(),
        ]);
        $this->event($order, $request, 'return_rejected', $data['note'] ?? null);

        return $this->freshOrder($order);
    }

    public function dispatchReturn(Request $request, Order $order): JsonResponse
    {
        DataScope::assertOrderVisible($request->user(), $order);

        if ($order->status !== 'return_approved') {
            return response()->json(['message' => 'Approve the return before assigning a driver.'], 409);
        }

        $data = $request->validate(['delivery_user_id' => ['required', 'integer', 'exists:users,id']]);
        $driver = User::whereKey($data['delivery_user_id'])->where('role', 'delivery')->firstOrFail();

        $order->update([
            'return_delivery_id' => $driver->id,
            'status' => 'return_assigned',
            'return_assigned_at' => now(),
        ]);
        $this->event($order, $request, 'return_dispatched', null, ['delivery_user_id' => $driver->id]);

        return $this->freshOrder($order);
    }

    private function freshOrder(Order $order): JsonResponse
    {
        return response()->json([
            'order' => $order->fresh()->load([
                'items', 'user:id,name,email,phone', 'deliveryUser:id,name,phone',
                'returnDeliveryUser:id,name,phone', 'commission',
            ]),
        ]);
    }

    private function event(Order $order, Request $request, string $event, ?string $note = null, array $meta = []): void
    {
        $order->events()->create([
            'actor_user_id' => $request->user()?->id,
            'event' => $event,
            'note' => $note,
            'meta' => $meta ?: null,
        ]);
    }
}
