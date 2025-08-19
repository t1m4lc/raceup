import { serverSupabaseServiceRole } from "#supabase/server";
import type { Database } from "~/supabase/supabase";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { paymentIntentId } = body;

    if (!paymentIntentId) {
      throw createError({
        statusCode: 400,
        message: "Missing paymentIntentId",
      });
    }

    const supabase = serverSupabaseServiceRole<Database>(event);

    console.log(
      "🗑️ Cleaning up old tickets for payment intent:",
      paymentIntentId
    );

    // Delete all tickets for this payment intent
    const { error: deleteError } = await supabase
      .from("tickets")
      .delete()
      .eq("stripe_payment_intent_id", paymentIntentId);

    if (deleteError) {
      console.error("❌ Failed to delete old tickets:", deleteError);
      throw createError({
        statusCode: 500,
        message: "Failed to clean up old tickets",
      });
    }

    console.log("✅ Old tickets cleaned up successfully");

    return {
      success: true,
      message: "Old tickets cleaned up successfully",
    };
  } catch (error: any) {
    console.error("Error cleaning up tickets:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "An error occurred cleaning up tickets",
    });
  }
});
