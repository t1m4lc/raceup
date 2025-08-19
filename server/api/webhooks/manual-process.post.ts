import { serverSupabaseServiceRole } from "#supabase/server";
import type { Database } from "~/supabase/supabase";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { pendingOrderId, paymentIntentId } = body;

    if (!pendingOrderId || !paymentIntentId) {
      throw createError({
        statusCode: 400,
        message: "Missing pendingOrderId or paymentIntentId",
      });
    }

    // Get the database client (using service role for this to bypass RLS)
    const supabase = serverSupabaseServiceRole<Database>(event);

    console.log("🔧 Manual processing - Pending Order ID:", pendingOrderId);
    console.log("🔧 Manual processing - Payment Intent ID:", paymentIntentId);

    // Get the pending order data
    const { data: pendingOrder, error: pendingOrderError } = await supabase
      .from("pending_orders")
      .select("*")
      .eq("id", pendingOrderId)
      .single();

    if (pendingOrderError || !pendingOrder) {
      console.error(
        "❌ Failed to find pending order:",
        pendingOrderId,
        pendingOrderError
      );
      throw createError({
        statusCode: 404,
        message: `Pending order not found: ${pendingOrderId}`,
      });
    }

    console.log(
      "📦 Processing pending order cart items:",
      pendingOrder.cart_items
    );

    // Create tickets and payments from the cart data
    const cartItems = pendingOrder.cart_items as any[];
    const createdTickets = [];

    if (!cartItems || !Array.isArray(cartItems)) {
      throw createError({
        statusCode: 400,
        message: "Invalid cart items in pending order",
      });
    }

    for (const item of cartItems) {
      // Create ticket
      const { data: ticket, error: ticketError } = await supabase
        .from("tickets")
        .insert({
          race_id: item.raceId,
          buyer_id: pendingOrder.user_id,
          quantity: item.participants?.length || 1,
          total_price_cents: item.price || item.totalPrice,
          stripe_payment_intent_id: paymentIntentId,
          status: "paid",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (ticketError) {
        console.error("❌ Failed to create ticket:", ticketError);
        throw createError({
          statusCode: 500,
          message: "Failed to create ticket",
        });
      }

      console.log("✅ Created ticket:", ticket.id);

      // Create participants
      if (item.participants && Array.isArray(item.participants)) {
        for (const participant of item.participants) {
          // Use first_name and last_name directly from participant data
          const firstName = participant.first_name || "Unknown";
          const lastName = participant.last_name || "Participant";

          const { error: participantError } = await supabase
            .from("participants")
            .insert({
              ticket_id: ticket.id,
              first_name: firstName,
              last_name: lastName,
              gender: participant.gender,
              birthdate: participant.birthdate,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (participantError) {
            console.error("❌ Failed to create participant:", participantError);
            // Don't throw here, continue with other participants
          } else {
            console.log("✅ Created participant:", firstName, lastName);
          }
        }
      }

      createdTickets.push(ticket);
    }

    // Mark pending order as completed
    await supabase
      .from("pending_orders")
      .update({
        status: "completed",
        stripe_payment_intent_id: paymentIntentId,
      })
      .eq("id", pendingOrderId);

    console.log(
      `✅ Successfully processed pending order ${pendingOrderId} with ${createdTickets.length} tickets`
    );

    return {
      success: true,
      message: `Processed pending order ${pendingOrderId} with ${createdTickets.length} tickets`,
      tickets: createdTickets,
    };
  } catch (error: any) {
    console.error("Error in manual webhook processing:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "An error occurred processing the order",
    });
  }
});
