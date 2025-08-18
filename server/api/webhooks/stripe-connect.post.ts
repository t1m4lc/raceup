import { serverSupabaseServiceRole } from "#supabase/server";
import { useServerStripe } from "#stripe/server";
import type { Database } from "~/supabase/supabase";

export default defineEventHandler(async (event) => {
  try {
    const stripe = await useServerStripe(event);
    const body = await readBody(event);
    const signature = getHeader(event, "stripe-signature");

    if (!signature || !body) {
      throw createError({
        statusCode: 400,
        message: "Missing Stripe signature or request body",
      });
    }

    const webhookSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error(
        "Missing STRIPE_CONNECT_WEBHOOK_SECRET environment variable"
      );
    }

    let stripeEvent;
    try {
      stripeEvent = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      throw createError({
        statusCode: 400,
        message: `Webhook Error: ${err.message}`,
      });
    }

    const supabase = serverSupabaseServiceRole<Database>(event);

    // Handle Connect account events
    switch (stripeEvent.type) {
      case "account.updated": {
        const account = stripeEvent.data.object;

        const isComplete =
          account.details_submitted &&
          account.charges_enabled &&
          account.payouts_enabled;

        // Update organization status
        const { error } = await supabase
          .from("organizations")
          .update({
            stripe_onboarding_completed: isComplete,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_account_id", account.id);

        if (error) {
          console.error("Error updating organization:", error);
        }

        console.log(`Account ${account.id} updated - Complete: ${isComplete}`);
        break;
      }

      case "capability.updated": {
        const capability = stripeEvent.data.object;
        console.log(
          `Capability ${capability.id} updated: ${capability.status}`
        );
        break;
      }

      default:
        console.log(`Unhandled Connect event type: ${stripeEvent.type}`);
    }

    return { received: true };
  } catch (error: any) {
    console.error("Connect webhook error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Webhook processing failed",
    });
  }
});
