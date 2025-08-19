import { serverSupabaseServiceRole } from "#supabase/server";
import type { Database } from "~/supabase/supabase";

export default defineEventHandler(async (event) => {
  const pendingOrderId = getRouterParam(event, "pendingOrderId");

  if (!pendingOrderId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Pending Order ID is required",
    });
  }

  console.log("=== PENDING ORDER TICKETS API ===");
  console.log("Pending Order ID:", pendingOrderId);

  try {
    const supabase = serverSupabaseServiceRole<Database>(event);

    // First, let's check if the pending_orders table exists
    console.log("Checking if pending_orders table exists...");

    // Get pending order details
    const { data: pendingOrder, error: orderError } = await supabase
      .from("pending_orders")
      .select("*")
      .eq("id", pendingOrderId)
      .single();

    console.log("Query result:");
    console.log("- Order data:", pendingOrder);
    console.log("- Order error:", orderError);

    if (orderError) {
      console.error("Database error details:", {
        code: orderError.code,
        message: orderError.message,
        details: orderError.details,
        hint: orderError.hint,
      });

      // If table doesn't exist, provide helpful error
      if (orderError.code === "42P01") {
        return {
          success: false,
          status: "error",
          message:
            "The pending_orders table does not exist in the database. Please run the migration script manually.",
          error: "MISSING_TABLE",
          migrationRequired: true,
          tickets: [],
          debugInfo: {
            pendingOrderId,
            errorCode: orderError.code,
            errorMessage: orderError.message,
          },
        };
      }

      // If permission denied (likely table doesn't exist or RLS issue)
      if (orderError.code === "42501") {
        return {
          success: false,
          status: "error",
          message:
            "Database access denied. The pending_orders table may not exist or have incorrect permissions. Please run the migration script manually.",
          error: "PERMISSION_DENIED",
          migrationRequired: true,
          tickets: [],
          debugInfo: {
            pendingOrderId,
            errorCode: orderError.code,
            errorMessage: orderError.message,
            solution:
              "Run the manual migration script in your Supabase SQL editor",
          },
        };
      }

      // If order not found but table exists
      if (orderError.code === "PGRST116") {
        return {
          success: false,
          status: "not_found",
          message:
            "This pending order was not found. It may have expired or never been created.",
          error: "ORDER_NOT_FOUND",
          tickets: [],
          debugInfo: {
            pendingOrderId,
            suggestion:
              "Try creating a new order or check if the payment was processed through a different flow.",
          },
        };
      }
    }

    if (!pendingOrder) {
      return {
        success: false,
        status: "not_found",
        message: "Pending order not found",
        error: "ORDER_NOT_FOUND",
        tickets: [],
        debugInfo: { pendingOrderId },
      };
    }

    console.log("Pending order status:", pendingOrder.status);

    // If order is still processing, check for tickets created by webhook
    let tickets: any[] = [];

    if (pendingOrder.stripe_payment_intent_id) {
      // Get tickets with race and event data
      const { data: createdTickets, error: ticketsError } = await supabase
        .from("tickets")
        .select(
          `
          *,
          race:races(
            id,
            name,
            distance_km,
            start_time,
            currency,
            event:events(
              id,
              name,
              slug
            )
          )
        `
        )
        .eq("stripe_payment_intent_id", pendingOrder.stripe_payment_intent_id);

      if (ticketsError) {
        console.error("❌ Error fetching tickets:", ticketsError);
      } else if (createdTickets && createdTickets.length > 0) {
        tickets = createdTickets;

        // Get participants for each ticket
        for (let i = 0; i < tickets.length; i++) {
          const { data: participants } = await supabase
            .from("participants")
            .select("*")
            .eq("ticket_id", tickets[i].id);

          tickets[i].participants = participants || [];
          console.log(
            `📋 Ticket ${tickets[i].id} has ${participants?.length || 0} participants`
          );
        }

        console.log(`📋 Found ${tickets.length} tickets total`);
      }
    }

    if (tickets.length > 0) {
      console.log(`Found ${tickets.length} tickets for pending order`);

      return {
        success: true,
        status: "completed",
        tickets,
        pendingOrder,
      };
    } else {
      console.log("No tickets found yet, payment may still be processing");

      return {
        success: true,
        status: "processing",
        tickets: [],
        pendingOrder,
        message:
          "Payment is being processed. Tickets will appear here once payment is confirmed.",
      };
    }
  } catch (error: any) {
    console.error("Error fetching pending order tickets:", error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
