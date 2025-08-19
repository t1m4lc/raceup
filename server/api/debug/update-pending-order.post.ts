import { serverSupabaseServiceRole } from "#supabase/server";
import type { Database } from "~/supabase/supabase";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { pendingOrderId, newPaymentIntentId } = body;

    if (!pendingOrderId || !newPaymentIntentId) {
      throw createError({
        statusCode: 400,
        message: "Missing pendingOrderId or newPaymentIntentId",
      });
    }

    const supabase = serverSupabaseServiceRole<Database>(event);

    console.log(
      "🔄 Updating pending order payment intent:",
      pendingOrderId,
      "->",
      newPaymentIntentId
    );

    // Update the pending order to point to the new payment intent
    const { error: updateError } = await supabase
      .from("pending_orders")
      .update({
        stripe_payment_intent_id: newPaymentIntentId,
      })
      .eq("id", pendingOrderId);

    if (updateError) {
      console.error("❌ Failed to update pending order:", updateError);
      throw createError({
        statusCode: 500,
        message: "Failed to update pending order",
      });
    }

    console.log("✅ Pending order updated successfully");

    return {
      success: true,
      message: "Pending order updated successfully",
    };
  } catch (error: any) {
    console.error("Error updating pending order:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "An error occurred updating pending order",
    });
  }
});
