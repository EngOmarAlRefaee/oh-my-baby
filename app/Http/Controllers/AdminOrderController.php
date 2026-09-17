<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\User;
use App\Services\CatalogInventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminOrderController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'orders' => Order::with([
                'items', 'user:id,name,email,phone', 'deliveryUser:id,name,phone',
                'returnDeliveryUser:id,name,phone', 'commission',
            ])->latest()->limit(200)->get(),
            'drivers' => User::where('role', 'delivery')->orderBy('name')->get(['id', 'name', 'phone', 'email']),
        ]);
    }

    public function accept(Request $request, Order $order): JsonResponse
    {
        if ($order->status !== 'pending_review') {
            return response()->json(['message' => 'Only orders under review can be accepted.'], 409);
        }

        $order->update([
            'status' => 'accepted',
            'accepted_at' => now(),
            'rejected_at' => null,
        ]);
        $this->event($order, $request, 'order_accepted');

        return $this->freshOrder($order);
    }

    public function reject(Request $request, Order $order, CatalogInventoryService $inventoryService): JsonResponse
    {
        if ($order->status !== 'pending_review') {
            return response()->json(['message' => 'Only orders under review can be rejected.'], 409);
        }

        $data = $request->validate(['admin_note' => ['nullable', 'string', 'max:3000']]);

        DB::transaction(function () use ($order, $data, $request, $inventoryService) {
            $order->update([
                'status' => 'rejected',
                'admin_note' => $data['admin_note'] ?? $order->admin_note,
                'rejected_at' => now(),
            ]);
            $inventoryService->restoreOrder($order);
            $this->event($order, $request, 'order_rejected', $data['admin_note'] ?? null);
        });

        return $this->freshOrder($order);
    }

    public function dispatch(Request $request, Order $order): JsonResponse
    {
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
