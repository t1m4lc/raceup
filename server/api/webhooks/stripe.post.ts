import { serverSupabaseServiceRole } from "#supabase/server";
import { useServerStripe } from "#stripe/server";
import type { Database } from "~/supabase/supabase";

export default defineEventHandler(async (event) => {
  try {
    // Get the Stripe webhook secret from environment variable
    const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripeWebhookSecret) {
      throw new Error("Missing STRIPE_WEBHOOK_SECRET environment variable");
    }

    // Initialize Stripe using the module's composable
    const stripe = await useServerStripe(event);

    // Get the raw body as string for signature verification
    const rawBody = await readRawBody(event);
    const signature = getHeader(event, "stripe-signature");

    if (!signature || !rawBody) {
      throw createError({
        statusCode: 400,
        message: "Missing Stripe signature or request body",
      });
    }

    // Verify the webhook signature
    let stripeEvent;
    try {
      stripeEvent = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        stripeWebhookSecret
      );
    } catch (err: any) {
      console.error("⚠️ Webhook signature verification failed:", err.message);
      throw createError({
        statusCode: 400,
        message: `Webhook Error: ${err.message}`,
      });
    }

    // Get the database client (using service role for this to bypass RLS)
    const supabase = serverSupabaseServiceRole<Database>(event);

    // Handle the event
    if (stripeEvent.type === "payment_intent.succeeded") {
      const paymentIntent = stripeEvent.data.object;

      console.log("🎉 Payment succeeded:", paymentIntent.id);

      // Check for pending order ID in metadata
      const pendingOrderId = paymentIntent.metadata?.pending_order_id;

      if (pendingOrderId) {
        console.log("📋 Found pending order ID:", pendingOrderId);

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
          throw new Error(`Pending order not found: ${pendingOrderId}`);
        }

        console.log(
          "📦 Processing pending order cart items:",
          pendingOrder.cart_items
        );

        // Create tickets and payments from the cart data
        const cartItems = pendingOrder.cart_items as any[];
        const createdTickets = [];

        if (!cartItems || !Array.isArray(cartItems)) {
          throw new Error("Invalid cart items in pending order");
        }

        for (const item of cartItems) {
          // Create ticket
          const { data: ticket, error: ticketError } = await supabase
            .from("tickets")
            .insert({
              race_id: item.raceId,
              buyer_id: pendingOrder.user_id,
              quantity: item.participants?.length || 1,
              total_price_cents: item.totalPrice,
              stripe_payment_intent_id: paymentIntent.id,
              status: "paid",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (ticketError) {
            console.error("❌ Failed to create ticket:", ticketError);
            throw new Error("Failed to create ticket");
          }

          // Create participants
          if (item.participants && Array.isArray(item.participants)) {
            for (const participant of item.participants) {
              // Split full_name into first_name and last_name
              const nameParts = participant.full_name?.split(" ") || [
                "Unknown",
                "Participant",
              ];
              const firstName = nameParts[0];
              const lastName = nameParts.slice(1).join(" ") || "Participant";

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
                console.error(
                  "❌ Failed to create participant:",
                  participantError
                );
                // Don't throw here, continue with other participants
              }
            }
          }

          createdTickets.push(ticket);
          console.log("✅ Created ticket:", ticket.id);
        }

        // Mark pending order as completed
        await supabase
          .from("pending_orders")
          .update({
            status: "completed",
            stripe_payment_intent_id: paymentIntent.id,
          })
          .eq("id", pendingOrderId);

        console.log(
          `✅ Successfully processed pending order ${pendingOrderId} with ${createdTickets.length} tickets`
        );
      }

      // Fallback: update existing tickets (current behavior)
      const { data: existingTickets } = await supabase
        .from("tickets")
        .select("id")
        .eq("stripe_payment_intent_id", paymentIntent.id);

      if (existingTickets && existingTickets.length > 0) {
        console.log("📋 Found existing tickets, updating status...");

        await supabase
          .from("tickets")
          .update({ status: "paid", updated_at: new Date().toISOString() })
          .eq("stripe_payment_intent_id", paymentIntent.id);

        await supabase
          .from("payments")
          .update({
            status: "completed",
            stripe_payment_method:
              typeof paymentIntent.payment_method === "string"
                ? paymentIntent.payment_method
                : paymentIntent.payment_method?.id || null,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_payment_intent_id", paymentIntent.id);

        console.log("✅ Tickets updated for payment intent:", paymentIntent.id);
      } else if (!pendingOrderId) {
        console.error(
          `No tickets or pending order found for payment intent ${paymentIntent.id}`
        );
        throw new Error("No order found for this payment intent");
      }
    } else if (stripeEvent.type === "payment_intent.payment_failed") {
      const paymentIntent = stripeEvent.data.object;

      // Marquer les tickets comme échoués
      await supabase
        .from("tickets")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("stripe_payment_intent_id", paymentIntent.id);

      // Marquer les payments comme échoués
      await supabase
        .from("payments")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_payment_intent_id", paymentIntent.id);

      console.log(`❌ Payment failed for payment intent: ${paymentIntent.id}`);
    }

    // Return a success response
    return { received: true };
  } catch (error: any) {
    console.error("Error handling Stripe webhook:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "An error occurred handling the webhook",
    });
  }
});
