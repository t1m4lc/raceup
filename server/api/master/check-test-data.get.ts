import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~/supabase/supabase";

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient<Database>(event);

    // Check organizations with Stripe Connect
    const { data: organizations, error: orgError } = await supabase.from(
      "organizations"
    ).select(`
        id, 
        name, 
        stripe_account_id, 
        stripe_onboarding_completed,
        events(
          id,
          name,
          races(id, name, price_cents, currency)
        )
      `);

    if (orgError) {
      console.error("Organizations error:", orgError);
      return { organizations: [], error: orgError.message };
    }

    // Check if we have test data
    const hasTestData = organizations && organizations.length > 0;
    const hasStripeSetup = organizations?.some((org) => org.stripe_account_id);
    const hasRaces = organizations?.some((org) =>
      org.events?.some((event) => event.races?.length > 0)
    );

    return {
      hasTestData,
      hasStripeSetup,
      hasRaces,
      organizations: organizations || [],
      stats: {
        totalOrgs: organizations?.length || 0,
        orgsWithStripe:
          organizations?.filter((org) => org.stripe_account_id).length || 0,
        totalEvents:
          organizations?.reduce(
            (sum, org) => sum + (org.events?.length || 0),
            0
          ) || 0,
        totalRaces:
          organizations?.reduce(
            (sum, org) =>
              sum +
              (org.events?.reduce(
                (eventSum, event) => eventSum + (event.races?.length || 0),
                0
              ) || 0),
            0
          ) || 0,
      },
    };
  } catch (error: any) {
    console.error("Check test data error:", error);
    return {
      organizations: [],
      error: error.message,
      hasTestData: false,
      hasStripeSetup: false,
      hasRaces: false,
    };
  }
});
