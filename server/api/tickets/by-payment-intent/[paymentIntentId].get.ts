import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";
import type { Database } from "~/supabase/supabase";

export default defineEventHandler(async (event) => {
  try {
    // Get the payment intent ID from the URL params
    const paymentIntentId = getRouterParam(event, "paymentIntentId");
    if (!paymentIntentId) {
      throw createError({
        statusCode: 400,
        message: "Payment Intent ID is required",
      });
    }

    // Get the current user
    const user = await serverSupabaseUser(event);
    if (!user) {
      throw createError({
        statusCode: 401,
        message: "Unauthorized",
      });
    }

    // Get Supabase client
    const supabase = await serverSupabaseClient<Database>(event);

    // Get tickets associated with this payment intent
    const { data: tickets, error: ticketsError } = await supabase
      .from("tickets")
      .select(
        `
        *,
        race:races(
          *,
          event:events(
            *,
            organization:organizations(*)
          )
        ),
        participants(*)
      `
      )
      .eq("stripe_payment_intent_id", paymentIntentId)
      .eq("purchaser_id", user.id); // Ensure user can only see their own tickets

    if (ticketsError) {
      console.error("Error fetching tickets:", ticketsError);
      throw createError({
        statusCode: 500,
        message: "Failed to fetch tickets",
      });
    }

    if (!tickets || tickets.length === 0) {
      // Tickets might not be created yet if payment just succeeded
      // Return a helpful message
      return {
        tickets: [],
        message:
          "Tickets are being processed. Please wait a moment and refresh the page.",
        status: "processing",
      };
    }

    return {
      tickets,
      count: tickets.length,
      status: "found",
    };
  } catch (error: any) {
    console.error("API Error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Internal server error",
    });
  }
});
