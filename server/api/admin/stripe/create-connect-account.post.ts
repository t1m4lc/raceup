import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";
import { useServerStripe } from "#stripe/server";
import type { Database } from "~/supabase/supabase";

export default defineEventHandler(async (event) => {
  try {
    console.log("=== Stripe Connect Account Creation Started ===");

    const user = await serverSupabaseUser(event);
    console.log("User:", user ? { id: user.id, email: user.email } : "No user");

    if (!user) {
      throw createError({ statusCode: 401, message: "Unauthorized" });
    }

    // Check if user has master access
    const masterEmails = [
      "timothy.alcaide@gmail.com",
      "t1m4lc@gmail.com",
      "timothy@raceup.com",
    ];
    console.log("Checking master access for:", user.email);

    if (!masterEmails.includes(user.email || "")) {
      throw createError({
        statusCode: 403,
        message: "Master admin access required",
      });
    }

    const body = await readBody(event);
    console.log("Request body:", body);
    const { organizationId } = body;

    if (!organizationId) {
      console.log("Missing organizationId in request body");
      throw createError({
        statusCode: 400,
        message: "Organization ID required",
      });
    }

    console.log("Organization ID:", organizationId);

    const supabase = await serverSupabaseClient<Database>(event);
    const stripe = await useServerStripe(event);

    // Get organization details (master admin can access any organization)
    const { data: organization, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", organizationId)
      .single();

    if (error || !organization) {
      throw createError({ statusCode: 404, message: "Organization not found" });
    }

    // Check if already has Stripe account
    if (
      organization.stripe_account_id &&
      organization.stripe_onboarding_completed
    ) {
      return {
        success: true,
        message: "✅ Stripe account already connected and onboarded",
        accountId: organization.stripe_account_id,
        isTestMode: organization.stripe_account_id.startsWith("acct_test_"),
        onboardingUrl: null,
      };
    }

    let accountId = organization.stripe_account_id;
    let isTestMode = false;

    // Create Stripe Connect account if doesn't exist
    if (!accountId) {
      // Get founder details for the Stripe account
      const { data: founder } = await supabase
        .from("profiles")
        .select("email, first_name, last_name")
        .eq("id", organization.founder_id)
        .single();

      try {
        const account = await stripe.accounts.create({
          type: "express", // Use Express accounts for easier onboarding
          country: "FR", // Adjust based on your market
          email: founder?.email || user.email,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          business_type: "individual", // or 'company' based on your needs
          metadata: {
            organization_id: organizationId,
            platform_user_id: organization.founder_id,
            organization_name: organization.name,
          },
        });

        accountId = account.id;
      } catch (stripeError: any) {
        console.log("Stripe Connect not enabled, using test mode");

        // For testing purposes, simulate a Stripe account ID
        accountId = `acct_test_${Math.random().toString(36).substring(2, 15)}`;
        isTestMode = true;

        // In a real scenario, you'd need to activate Stripe Connect first
        console.warn(
          "WARNING: Using simulated Stripe account ID for testing. Please activate Stripe Connect for production."
        );
      }

      // Save Stripe account ID to database
      await supabase
        .from("organizations")
        .update({
          stripe_account_id: accountId,
          stripe_onboarding_completed: true, // Mark as completed for test mode
        })
        .eq("id", organizationId);
    }

    // Only create account link for real Stripe accounts that need onboarding
    let onboardingUrl = null;
    if (!isTestMode && !organization.stripe_onboarding_completed) {
      try {
        const accountLink = await stripe.accountLinks.create({
          account: accountId,
          refresh_url: `${getHeader(event, "origin")}/master/stripe-connect-admin`,
          return_url: `${getHeader(event, "origin")}/master/stripe-connect-admin`,
          type: "account_onboarding",
        });
        onboardingUrl = accountLink.url;
      } catch (linkError: any) {
        console.warn("Failed to create onboarding link:", linkError.message);
        // Don't fail the whole process if link creation fails
      }
    }

    const response = {
      success: true,
      onboardingUrl: onboardingUrl,
      accountId: accountId,
      isTestMode: isTestMode,
      message: isTestMode
        ? `✅ Test Stripe account created for ${organization.name} (Connect not enabled)`
        : `✅ Stripe Connect account created for ${organization.name}`,
    };

    console.log("✅ Successfully created/updated Stripe account:", response);
    return response;
  } catch (error: any) {
    console.error("=== Stripe Connect creation error ===");
    console.error("Error details:", error);
    console.error("Error message:", error.message);
    console.error("Error status:", error.statusCode);

    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to create Stripe Connect account",
    });
  }
});
