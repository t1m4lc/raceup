import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";
import { useServerStripe } from "#stripe/server";
import type { Database } from "~/supabase/supabase";

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event);
    if (!user) {
      throw createError({ statusCode: 401, message: "Unauthorized" });
    }

    const body = await readBody(event);
    const { organizationId, returnUrl, refreshUrl } = body;

    if (!organizationId) {
      throw createError({
        statusCode: 400,
        message: "Organization ID required",
      });
    }

    const supabase = await serverSupabaseClient<Database>(event);
    const stripe = await useServerStripe(event);

    // Verify user owns this organization
    const { data: organization, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", organizationId)
      .eq("founder_id", user.id) // Using correct founder_id field
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
        message: "Stripe account already connected",
        accountId: organization.stripe_account_id,
      };
    }

    let accountId = organization.stripe_account_id;

    // Create Stripe Connect account if doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express", // Use Express accounts for easier onboarding
        country: "FR", // Adjust based on your market
        email: user.email, // Use user's email instead of contact_email
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual", // or 'company' based on your needs
        metadata: {
          organization_id: organizationId,
          platform_user_id: user.id,
          organization_name: organization.name,
        },
      });

      accountId = account.id;

      // Save Stripe account ID to database
      await supabase
        .from("organizations")
        .update({ stripe_account_id: accountId })
        .eq("id", organizationId);
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url:
        refreshUrl || `${getHeader(event, "origin")}/dashboard/stripe/refresh`,
      return_url:
        returnUrl || `${getHeader(event, "origin")}/dashboard/stripe/success`,
      type: "account_onboarding",
    });

    return {
      success: true,
      onboardingUrl: accountLink.url,
      accountId: accountId,
    };
  } catch (error: any) {
    console.error("Stripe Connect onboarding error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to setup Stripe Connect",
    });
  }
});
