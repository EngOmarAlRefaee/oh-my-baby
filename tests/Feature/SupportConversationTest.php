<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\SupportConversation;
use App\Models\User;
use App\Support\PermissionCatalog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SupportConversationTest extends TestCase
{
    use RefreshDatabase;

    private function user(string $role, array $permissions = []): User
    {
        $user = User::factory()->create(['role' => $role]);
        $user->forceFill([
            'account_status' => 'active',
            'permissions' => $permissions,
        ])->save();

        return $user->fresh();
    }

    private function orderFor(User $customer, string $reference = 'OMB-SUPPORT-1'): Order
    {
        return Order::create([
            'reference' => $reference,
            'user_id' => $customer->id,
            'status' => 'pending_review',
            'customer_name' => $customer->name,
            'customer_phone' => $customer->phone ?: '0999000000',
            'delivery_address' => 'Support test address',
            'subtotal_usd' => 10,
            'discount_usd' => 0,
            'delivery_fee_usd' => 2.50,
            'total_usd' => 12.50,
            'payment_currency' => 'usd',
            'fulfillment_method' => 'delivery',
            'delivery_zone' => 'damascus',
        ]);
    }

    public function test_guest_can_open_and_continue_conversation_only_with_token(): void
    {
        $response = $this->postJson('/api/support/conversations', [
            'guest_name' => 'Guest Support',
            'message' => 'Hello from guest.',
        ])->assertCreated();

        $id = (int) $response->json('conversation.id');
        $token = (string) $response->json('conversation.token');

        $this->assertNotSame('', $token);
        $this->assertDatabaseHas('support_conversations', [
            'id' => $id,
            'user_id' => null,
            'guest_phone' => null,
            'subject' => null,
            'unread_for_staff' => 1,
            'status' => 'open',
        ]);

        $this->getJson("/api/support/conversations/{$id}?token=wrong-token")
            ->assertForbidden();

        $this->getJson("/api/support/conversations/{$id}?token=".urlencode($token))
            ->assertOk()
            ->assertJsonPath('conversation.messages.0.body', 'Hello from guest.');

        $this->withHeader('X-Support-Token', $token)
            ->postJson("/api/support/conversations/{$id}/messages", [
                'message' => 'Second guest message.',
                'token' => $token,
            ])
            ->assertOk();

        $this->assertDatabaseHas('support_conversations', [
            'id' => $id,
            'unread_for_staff' => 2,
        ]);
    }

    public function test_customer_can_link_own_order_and_other_customer_cannot_read_thread(): void
    {
        $customer = $this->user('customer');
        $other = $this->user('customer');
        $order = $this->orderFor($customer);

        $response = $this->actingAs($customer)->postJson('/api/support/conversations', [
            'order_id' => $order->id,
            'message' => 'Where is my order?',
        ])->assertCreated()
          ->assertJsonPath('conversation.order.reference', $order->reference);

        $conversationId = (int) $response->json('conversation.id');

        $this->assertDatabaseHas('support_conversations', [
            'id' => $conversationId,
            'user_id' => $customer->id,
            'order_id' => $order->id,
        ]);

        $this->actingAs($other)
            ->getJson("/api/support/conversations/{$conversationId}")
            ->assertForbidden();
    }

    public function test_support_permissions_separate_view_reply_assign_and_close(): void
    {
        $guestConversation = SupportConversation::create([
            'public_token' => str_repeat('a', 64),
            'guest_name' => 'Guest',
            'guest_phone' => '0999000001',
            'status' => 'open',
            'unread_for_staff' => 1,
            'last_message_at' => now(),
        ]);
        $guestConversation->messages()->create([
            'sender_type' => 'guest',
            'body' => 'Need help',
        ]);

        $viewOnly = $this->user('admin', ['support.view']);

        $this->actingAs($viewOnly)
            ->getJson('/api/support/staff')
            ->assertOk();

        $this->actingAs($viewOnly)
            ->postJson("/api/support/staff/{$guestConversation->id}/messages", ['message' => 'Nope'])
            ->assertForbidden();

        $supportAdmin = $this->user('admin', [
            'support.view',
            'support.reply',
            'support.assign',
            'support.close',
        ]);

        $this->actingAs($supportAdmin)
            ->postJson("/api/support/staff/{$guestConversation->id}/messages", ['message' => 'We are checking.'])
            ->assertOk()
            ->assertJsonPath('conversation.status', 'waiting_customer');

        $this->assertDatabaseHas('support_conversations', [
            'id' => $guestConversation->id,
            'assigned_to_user_id' => $supportAdmin->id,
            'unread_for_customer' => 1,
        ]);

        $this->actingAs($supportAdmin)
            ->postJson("/api/support/staff/{$guestConversation->id}/close", [])
            ->assertOk()
            ->assertJsonPath('conversation.status', 'closed');
    }

    public function test_owner_can_access_support_without_explicit_permission(): void
    {
        SupportConversation::create([
            'public_token' => str_repeat('b', 64),
            'guest_name' => 'Guest',
            'guest_phone' => '0999000002',
            'status' => 'open',
            'last_message_at' => now(),
        ]);

        $owner = $this->user('owner');

        $this->actingAs($owner)
            ->get('/owner/support')
            ->assertOk();

        $this->actingAs($owner)
            ->getJson('/api/support/staff')
            ->assertOk();
    }

    public function test_customer_read_clears_staff_reply_unread_counter(): void
    {
        $customer = $this->user('customer');

        $response = $this->actingAs($customer)->postJson('/api/support/conversations', [
            'message' => 'Customer message',
        ])->assertCreated();

        $conversation = SupportConversation::findOrFail($response->json('conversation.id'));
        $owner = $this->user('owner');

        $this->actingAs($owner)
            ->postJson("/api/support/staff/{$conversation->id}/messages", ['message' => 'Owner reply'])
            ->assertOk();

        $this->assertSame(1, (int) $conversation->fresh()->unread_for_customer);

        $this->actingAs($customer)
            ->getJson("/api/support/conversations/{$conversation->id}")
            ->assertOk();

        $this->assertSame(0, (int) $conversation->fresh()->unread_for_customer);
    }
    public function test_replies_can_quote_messages_only_inside_the_same_conversation(): void
    {
        $customer = $this->user('customer');
        $owner = $this->user('owner');

        $first = $this->actingAs($customer)->postJson('/api/support/conversations', [
            'message' => 'First customer message',
        ])->assertCreated();

        $conversationId = (int) $first->json('conversation.id');
        $customerMessageId = (int) $first->json('conversation.messages.0.id');

        $staffReply = $this->actingAs($owner)
            ->postJson("/api/support/staff/{$conversationId}/messages", [
                'message' => 'Quoted staff reply',
                'reply_to_message_id' => $customerMessageId,
            ])
            ->assertOk()
            ->assertJsonPath('conversation.messages.1.reply_to.id', $customerMessageId)
            ->assertJsonPath('conversation.messages.1.reply_to.body', 'First customer message');

        $staffMessageId = (int) $staffReply->json('conversation.messages.1.id');

        $this->actingAs($customer)
            ->postJson("/api/support/conversations/{$conversationId}/messages", [
                'message' => 'Customer quotes the staff reply',
                'reply_to_message_id' => $staffMessageId,
            ])
            ->assertOk()
            ->assertJsonPath('conversation.messages.2.reply_to.id', $staffMessageId);

        $this->assertDatabaseHas('support_messages', [
            'support_conversation_id' => $conversationId,
            'reply_to_message_id' => $staffMessageId,
            'body' => 'Customer quotes the staff reply',
        ]);

        $second = $this->actingAs($customer)->postJson('/api/support/conversations', [
            'message' => 'Second conversation',
        ])->assertCreated();

        $secondConversationId = (int) $second->json('conversation.id');

        $this->actingAs($owner)
            ->postJson("/api/support/staff/{$secondConversationId}/messages", [
                'message' => 'Cross-thread quote must fail',
                'reply_to_message_id' => $customerMessageId,
            ])
            ->assertUnprocessable();
    }

    public function test_customer_message_reopens_a_closed_conversation(): void
    {
        $customer = $this->user('customer');
        $owner = $this->user('owner');

        $created = $this->actingAs($customer)->postJson('/api/support/conversations', [
            'message' => 'Initial message',
        ])->assertCreated();

        $conversationId = (int) $created->json('conversation.id');

        $this->actingAs($owner)
            ->postJson("/api/support/staff/{$conversationId}/close", [])
            ->assertOk()
            ->assertJsonPath('conversation.status', 'closed');

        $this->actingAs($customer)
            ->postJson("/api/support/conversations/{$conversationId}/messages", [
                'message' => 'I still need help',
            ])
            ->assertOk()
            ->assertJsonPath('conversation.status', 'open');

        $this->assertDatabaseHas('support_conversations', [
            'id' => $conversationId,
            'status' => 'open',
            'closed_at' => null,
        ]);
    }

    public function test_notification_permission_is_available_and_depends_on_support_view(): void
    {
        $this->assertContains('support.notifications', PermissionCatalog::flatForRole('admin'));
        $this->assertSame(['support.view'], PermissionCatalog::dependencies()['support.notifications']);
    }

    public function test_peek_does_not_mark_staff_reply_as_read(): void
    {
        $customer = $this->user('customer');
        $owner = $this->user('owner');

        $created = $this->actingAs($customer)->postJson('/api/support/conversations', [
            'message' => 'Need a reply',
        ])->assertCreated();

        $conversationId = (int) $created->json('conversation.id');

        $this->actingAs($owner)
            ->postJson("/api/support/staff/{$conversationId}/messages", ['message' => 'New staff message'])
            ->assertOk();

        $conversation = SupportConversation::findOrFail($conversationId);
        $this->assertSame(1, (int) $conversation->unread_for_customer);

        $this->actingAs($customer)
            ->getJson("/api/support/conversations/{$conversationId}?peek=1")
            ->assertOk()
            ->assertJsonPath('conversation.unread', 1);

        $this->assertSame(1, (int) $conversation->fresh()->unread_for_customer);

        $this->actingAs($customer)
            ->getJson("/api/support/conversations/{$conversationId}")
            ->assertOk();

        $this->assertSame(0, (int) $conversation->fresh()->unread_for_customer);
    }

    public function test_guest_conversation_is_claimed_by_customer_with_same_browser_token(): void
    {
        $created = $this->postJson('/api/support/conversations', [
            'guest_name' => 'Before signup',
            'message' => 'Guest message before account.',
        ])->assertCreated();

        $conversationId = (int) $created->json('conversation.id');
        $token = (string) $created->json('conversation.token');
        $customer = $this->user('customer');

        $this->actingAs($customer)
            ->postJson("/api/support/conversations/{$conversationId}/claim", [
                'token' => $token,
            ])
            ->assertOk()
            ->assertJsonPath('conversation.id', $conversationId)
            ->assertJsonPath('conversation.messages.0.sender_type', 'customer')
            ->assertJsonPath('conversation.messages.0.body', 'Guest message before account.');

        $conversation = SupportConversation::findOrFail($conversationId);

        $this->assertSame($customer->id, $conversation->user_id);
        $this->assertNotSame($token, $conversation->public_token);
        $this->assertDatabaseHas('support_messages', [
            'support_conversation_id' => $conversationId,
            'sender_user_id' => $customer->id,
            'sender_type' => 'customer',
            'body' => 'Guest message before account.',
        ]);

        $this->actingAs($customer)
            ->getJson("/api/support/conversations/{$conversationId}")
            ->assertOk();

        auth()->logout();
        $this->getJson("/api/support/conversations/{$conversationId}?token=".urlencode($token))
            ->assertForbidden();
    }

    public function test_guest_conversation_cannot_be_claimed_with_wrong_token_or_by_another_customer(): void
    {
        $created = $this->postJson('/api/support/conversations', [
            'guest_name' => 'Guest',
            'message' => 'Private guest conversation.',
        ])->assertCreated();

        $conversationId = (int) $created->json('conversation.id');
        $token = (string) $created->json('conversation.token');
        $first = $this->user('customer');
        $second = $this->user('customer');

        $this->actingAs($first)
            ->postJson("/api/support/conversations/{$conversationId}/claim", [
                'token' => 'wrong-token',
            ])
            ->assertForbidden();

        $this->assertNull(SupportConversation::findOrFail($conversationId)->user_id);

        $this->actingAs($first)
            ->postJson("/api/support/conversations/{$conversationId}/claim", [
                'token' => $token,
            ])
            ->assertOk();

        $this->actingAs($second)
            ->postJson("/api/support/conversations/{$conversationId}/claim", [
                'token' => $token,
            ])
            ->assertForbidden();
    }

}


