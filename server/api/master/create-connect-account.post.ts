import { useServerStripe } from "#stripe/server";
import { serverSupabaseServiceRole } from "#supabase/server";
import type { Database } from "~/supabase/supabase";

export default defineEventHandler(async (event) => {
  try {
    const { organizationId, email } = await readBody(event);
    
    if (!organizationId || !email) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Organization ID and email are required'
      });
    }

    const stripe = await useServerStripe(event);
    const supabase = serverSupabaseServiceRole<Database>(event);

    // Create Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'FR', // Change to your country
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    console.log('✅ Created Connect account:', account.id);

    // Update organization
    const { error } = await supabase
      .from('organizations')
      .update({
        stripe_account_id: account.id,
        stripe_onboarding_completed: false
      })
      .eq('id', organizationId);

    if (error) {
      throw new Error(`Database update failed: ${error.message}`);
    }

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${getHeader(event, "origin")}/god/stripe-connect-manager`,
      return_url: `${getHeader(event, "origin")}/god/stripe-connect-manager`,
      type: 'account_onboarding',
    });

    return {
      success: true,
      accountId: account.id,
      onboardingUrl: accountLink.url,
      message: `Connect account created for organization! Complete onboarding to enable transfers.`
    };

  } catch (error: any) {
    console.error('❌ Error creating Connect account:', error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to create Connect account'
    });
  }
});
