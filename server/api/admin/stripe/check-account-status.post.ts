import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";
import { useServerStripe } from "#stripe/server";
import type { Database } from "~/supabase/supabase";

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event);
    if (!user) {
      throw createError({ statusCode: 401, message: "Unauthorized" });
    }

    // Check if user has master access
    const masterEmails = [
      "timothy.alcaide@gmail.com",
      "t1m4lc@gmail.com",
      "timothy@raceup.com",
    ];

    if (!masterEmails.includes(user.email || "")) {
      throw createError({
        statusCode: 403,
        message: "Master admin access required",
      });
    }

    const body = await readBody(event);
    const { organizationId } = body;

    if (!organizationId) {
      throw createError({
        statusCode: 400,
        message: "Organization ID required",
      });
    }

    const supabase = await serverSupabaseClient<Database>(event);

    // Get organization details
    const { data: organization, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", organizationId)
      .single();

    if (error || !organization) {
      throw createError({ statusCode: 404, message: "Organization not found" });
    }

    if (!organization.stripe_account_id) {
      return {
        success: false,
        status: "no_account",
        message: "No Stripe account found for this organization",
      };
    }

    // Check if it's a test account
    if (organization.stripe_account_id.startsWith("acct_test_")) {
      return {
        success: true,
        status: "test_mode",
        accountId: organization.stripe_account_id,
        onboardingCompleted: organization.stripe_onboarding_completed,
        message: "Test Stripe account (Connect not enabled on platform)",
        details: {
          charges_enabled: false,
          details_submitted: true,
          payouts_enabled: false,
          requirements: [],
        },
      };
    }

    // For real Stripe accounts, check with Stripe API
    try {
      const stripe = await useServerStripe(event);
      const account = await stripe.accounts.retrieve(
        organization.stripe_account_id
      );

      return {
        success: true,
        status: "active",
        accountId: organization.stripe_account_id,
        onboardingCompleted: organization.stripe_onboarding_completed,
        message: `Stripe account status: ${account.charges_enabled ? "Active" : "Pending"}`,
        details: {
          charges_enabled: account.charges_enabled,
          details_submitted: account.details_submitted,
          payouts_enabled: account.payouts_enabled,
          requirements: account.requirements?.currently_due || [],
        },
      };
    } catch (stripeError: any) {
      return {
        success: false,
        status: "error",
        accountId: organization.stripe_account_id,
        message: `Error checking Stripe account: ${stripeError.message}`,
      };
    }
  } catch (error: any) {
    console.error("Check account status error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to check account status",
    });
  }
});
