<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\RewardCoupon;
use App\Services\CommissionService;
use App\Services\RewardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeliveryOrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $statuses = [
            'assigned_to_driver', 'out_for_delivery', 'delivered',
            'return_assigned', 'return_in_transit', 'returned',
        ];

        $query = Order::with([
            'items', 'user:id,name,phone', 'deliveryUser:id,name,phone',
            'returnDeliveryUser:id,name,phone', 'commission',
        ])->whereIn('status', $statuses);

        if ($request->user()->role === 'delivery') {
            $userId = $request->user()->id;
            $query->where(function ($q) use ($userId) {
                $q->where('assigned_delivery_id', $userId)
                    ->orWhere('return_delivery_id', $userId);
            });
        }

        return response()->json(['orders' => $query->latest()->limit(150)->get()]);
    }

    public function startDelivery(Request $request, Order $order): JsonResponse
    {
        $this->ensureCanOperateForwardDelivery($request, $order);

        if ($order->status !== 'assigned_to_driver') {
            return response()->json(['message' => 'This order is not waiting for delivery start.'], 409);
        }

        $data = $request->validate(['delivery_note' => ['nullable', 'string', 'max:3000']]);

        $order->update([
            'status' => 'out_for_delivery',
            'delivery_note' => $data['delivery_note'] ?? $order->delivery_note,
            'out_for_delivery_at' => now(),
        ]);
        $this->event($order, $request, 'delivery_started', $data['delivery_note'] ?? null);

        return $this->freshOrder($order);
    }

    public function markDelivered(
        Request $request,
        Order $order,
        RewardService $rewards,
        CommissionService $commissions
    ): JsonResponse {
        $this->ensureCanOperateForwardDelivery($request, $order);

        if ($order->status !== 'out_for_delivery') {
            return response()->json(['message' => 'Start delivery before marking the order delivered.'], 409);
        }

        $data = $request->validate(['delivery_note' => ['nullable', 'string', 'max:3000']]);

        $order->update([
            'status' => 'delivered',
            'delivery_note' => $data['delivery_note'] ?? $order->delivery_note,
            'delivered_at' => now(),
        ]);
        $this->event($order, $request, 'order_delivered', $data['delivery_note'] ?? null);

        if ($order->user) {
            $rewards->syncForUser($order->user);
        }
        $commissions->ensureForDeliveredOrder($order);

        return $this->freshOrder($order);
    }

    public function returnAtDoor(Request $request, Order $order): JsonResponse
    {
        $this->ensureCanOperateForwardDelivery($request, $order);

        if ($order->status !== 'out_for_delivery') {
            return response()->json(['message' => 'The order must be out for delivery before it can be returned from the door.'], 409);
        }

        $data = $request->validate([
            'reason' => ['required', 'string', 'min:3', 'max:2000'],
            'delivery_note' => ['nullable', 'string', 'max:3000'],
        ]);

        $order->update([
            'status' => 'return_in_transit',
            'return_reason' => $data['reason'],
            'delivery_note' => $data['delivery_note'] ?? $order->delivery_note,
            'return_delivery_id' => $order->assigned_delivery_id,
            'return_requested_at' => now(),
            'return_approved_at' => now(),
            'return_assigned_at' => now(),
            'return_started_at' => now(),
        ]);
        $this->event($order, $request, 'delivery_failed_return_started', $data['reason']);

        return $this->freshOrder($order);
    }

    public function startReturn(Request $request, Order $order): JsonResponse
    {
        $this->ensureCanOperateReturn($request, $order);

        if ($order->status !== 'return_assigned') {
            return response()->json(['message' => 'This return is not waiting for pickup.'], 409);
        }

        $data = $request->validate(['delivery_note' => ['nullable', 'string', 'max:3000']]);
        $order->update([
            'status' => 'return_in_transit',
            'delivery_note' => $data['delivery_note'] ?? $order->delivery_note,
            'return_started_at' => now(),
        ]);
        $this->event($order, $request, 'return_picked_up', $data['delivery_note'] ?? null);

        return $this->freshOrder($order);
    }

    public function completeReturn(
        Request $request,
        Order $order,
        RewardService $rewards,
        CommissionService $commissions
    ): JsonResponse {
        $this->ensureCanOperateReturn($request, $order);

        if ($order->status !== 'return_in_transit') {
            return response()->json(['message' => 'Start the return trip before marking it returned.'], 409);
        }

        $data = $request->validate(['delivery_note' => ['nullable', 'string', 'max:3000']]);
        $order->update([
            'status' => 'returned',
            'delivery_note' => $data['delivery_note'] ?? $order->delivery_note,
            'returned_at' => now(),
        ]);
        $this->event($order, $request, 'order_returned_to_store', $data['delivery_note'] ?? null);

        if ($order->coupon_code) {
            RewardCoupon::where('used_on_order_id', $order->id)
                ->where('status', 'used')
                ->update(['status' => 'available', 'used_on_order_id' => null, 'used_at' => null]);
        }

        if ($order->user) {
            $rewards->syncForUser($order->user);
        }
        $commissions->reverseForReturnedOrder($order, 'Order returned to store');

        return $this->freshOrder($order);
    }

    private function ensureCanOperateForwardDelivery(Request $request, Order $order): void
    {
        $role = $request->user()?->role;
        abort_unless(in_array($role, ['owner', 'admin', 'delivery'], true), 403);

        if ($role === 'delivery') {
            abort_unless((int) $order->assigned_delivery_id === (int) $request->user()->id, 403);
        }
    }

    private function ensureCanOperateReturn(Request $request, Order $order): void
    {
        $role = $request->user()?->role;
        abort_unless(in_array($role, ['owner', 'admin', 'delivery'], true), 403);

        if ($role === 'delivery') {
            abort_unless((int) $order->return_delivery_id === (int) $request->user()->id, 403);
        }
    }

    private function freshOrder(Order $order): JsonResponse
    {
        return response()->json([
            'order' => $order->fresh()->load([
                'items', 'deliveryUser:id,name,phone', 'returnDeliveryUser:id,name,phone', 'commission',
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
