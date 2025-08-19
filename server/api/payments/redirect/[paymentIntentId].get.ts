import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~/supabase/supabase";

export default defineEventHandler(async (event) => {
  try {
    const paymentIntentId = getRouterParam(event, "paymentIntentId");

    console.log("=== PAYMENT REDIRECT API ===");
    console.log("Payment Intent ID:", paymentIntentId);

    if (!paymentIntentId) {
      throw createError({
        statusCode: 400,
        message: "Payment Intent ID is required",
      });
    }

    // Get Supabase client
    const supabase = await serverSupabaseClient<Database>(event);

    // Get ticket ID from payment intent
    const { data: ticket, error } = await supabase
      .from("tickets")
      .select("id")
      .eq("stripe_payment_intent_id", paymentIntentId)
      .single();

    if (error || !ticket) {
      console.error("Error finding ticket:", error);
      throw createError({
        statusCode: 404,
        message: "Ticket not found for this payment intent",
      });
    }

    console.log("Found ticket ID:", ticket.id);

    // Redirect to the ticket confirmation page
    await sendRedirect(event, `/payment/confirmation/${ticket.id}`);
  } catch (error: any) {
    console.error("Redirect API Error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Internal server error",
    });
  }
});
