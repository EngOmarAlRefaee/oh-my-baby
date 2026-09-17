<?php

namespace App\Http\Controllers;

use App\Models\OwnerRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class OwnerRequestController extends Controller
{
    public function adminIndex(Request $request): JsonResponse
    {
        $items = OwnerRequest::query()
            ->with('reviewer:id,name,email,role')
            ->where('admin_id', $request->user()->id)
            ->latest()
            ->limit(100)
            ->get();

        return response()->json(['requests' => $items]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', Rule::in(['general', 'permission', 'financial', 'staff', 'exception', 'technical'])],
            'title' => ['required', 'string', 'max:180'],
            'message' => ['required', 'string', 'min:3', 'max:5000'],
        ]);

        $item = OwnerRequest::create([
            ...$data,
            'admin_id' => $request->user()->id,
            'status' => 'pending',
        ]);

        return response()->json(['message' => 'Request sent to owner.', 'request' => $item], 201);
    }

    public function ownerIndex(): JsonResponse
    {
        $items = OwnerRequest::query()
            ->with(['admin:id,name,email,phone,role', 'reviewer:id,name,email,role'])
            ->latest()
            ->limit(200)
            ->get();

        return response()->json(['requests' => $items]);
    }

    public function resolve(Request $request, OwnerRequest $ownerRequest): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(['approved', 'rejected', 'answered'])],
            'owner_response' => ['nullable', 'string', 'max:5000'],
        ]);

        $ownerRequest->update([
            'status' => $data['status'],
            'owner_response' => $data['owner_response'] ?? null,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        return response()->json(['message' => 'Request updated.', 'request' => $ownerRequest->fresh()]);
    }
}
