import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";
import type { Database } from "~/supabase/supabase";

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event);
    if (!user) {
      throw createError({
        statusCode: 401,
        message: "Unauthorized",
      });
    }

    const body = await readBody(event);
    const { paymentIntentId, cartData, contactInfo } = body;

    if (!paymentIntentId || !cartData) {
      throw createError({
        statusCode: 400,
        message: "Payment intent ID and cart data are required",
      });
    }

    const supabase = await serverSupabaseClient<Database>(event);

    // Store cart data temporarily in a simple table for webhook processing
    const { error } = await supabase.from("payment_cache").insert({
      payment_intent_id: paymentIntentId,
      user_id: user.id,
      cart_data: cartData,
      contact_info: contactInfo,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h expiry
    });

    if (error) {
      console.error("Cache cart data error:", error);
      throw createError({
        statusCode: 500,
        message: "Failed to cache cart data",
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Cache cart data error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to cache cart data",
    });
  }
});
