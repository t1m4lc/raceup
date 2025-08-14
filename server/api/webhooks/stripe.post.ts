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

      // Update the ticket status
      const { error: ticketError } = await supabase
        .from("tickets")
        .update({ status: "paid", updated_at: new Date().toISOString() })
        .eq("stripe_payment_intent_id", paymentIntent.id);

      if (ticketError) {
        console.error("Error updating ticket status:", ticketError);
        throw new Error(
          `Failed to update ticket status: ${ticketError.message}`
        );
      }

      // Update the payment record
      const { error: paymentError } = await supabase
        .from("payments")
        .update({
          status: "succeeded",
          stripe_payment_method: paymentIntent.payment_method,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_payment_intent_id", paymentIntent.id);

      if (paymentError) {
        console.error("Error updating payment record:", paymentError);
        throw new Error(
          `Failed to update payment record: ${paymentError.message}`
        );
      }
    } else if (stripeEvent.type === "payment_intent.payment_failed") {
      const paymentIntent = stripeEvent.data.object;

      // Update the ticket status
      await supabase
        .from("tickets")
        .update({ status: "pending", updated_at: new Date().toISOString() })
        .eq("stripe_payment_intent_id", paymentIntent.id);

      // Update the payment record
      await supabase
        .from("payments")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_payment_intent_id", paymentIntent.id);
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
