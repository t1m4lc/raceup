import { useServerStripe } from "#stripe/server";
import { serverSupabaseServiceRole } from "#supabase/server";
import type { Database } from "~/supabase/supabase";

export default defineEventHandler(async (event) => {
  try {
    const stripe = await useServerStripe(event);
    const supabase = serverSupabaseServiceRole<Database>(event);

    // Create Express account for testing
    const account = await stripe.accounts.create({
      type: "express",
      country: "FR", // Change to your country
      email: "test-organizer@example.com",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    console.log("✅ Created test account:", account.id);

    // Update Trail Runners Club with real account ID
    const { error } = await supabase
      .from("organizations")
      .update({
        stripe_account_id: account.id,
        stripe_onboarding_completed: false, // Will be true after onboarding
      })
      .eq("name", "Trail Runners Club");

    if (error) {
      throw new Error(`Database update failed: ${error.message}`);
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${getHeader(event, "origin")}/admin/stripe/refresh`,
      return_url: `${getHeader(event, "origin")}/admin/stripe/success`,
      type: "account_onboarding",
    });

    return {
      success: true,
      accountId: account.id,
      onboardingUrl: accountLink.url,
      message:
        "Test Connect account created! Complete onboarding to enable transfers.",
    };
  } catch (error: any) {
    console.error("❌ Error creating test account:", error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Failed to create test account",
    });
  }
});
