import { serverSupabaseClient } from "#supabase/server";
import { useServerStripe } from "#stripe/server";
import type { Database } from "~/supabase/supabase";

export default defineEventHandler(async (event) => {
  try {
    const accountId = getRouterParam(event, "accountId");
    if (!accountId) {
      throw createError({ statusCode: 400, message: "Account ID required" });
    }

    const supabase = await serverSupabaseClient<Database>(event);
    const stripe = await useServerStripe(event);

    // Get account details from Stripe
    const account = await stripe.accounts.retrieve(accountId);

    // Check if onboarding is complete
    const isComplete =
      account.details_submitted &&
      account.charges_enabled &&
      account.payouts_enabled;

    // Update database if onboarding is complete
    if (isComplete) {
      await supabase
        .from("organizations")
        .update({
          stripe_onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_account_id", accountId);
    }

    return {
      accountId: account.id,
      isComplete,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      requirements: account.requirements,
      country: account.country,
      currency: account.default_currency,
    };
  } catch (error: any) {
    console.error("Stripe account status error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to check account status",
    });
  }
});
