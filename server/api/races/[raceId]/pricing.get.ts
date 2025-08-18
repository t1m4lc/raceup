import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event);
  const raceId = getRouterParam(event, "raceId");

  if (!raceId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Race ID is required",
    });
  }

  try {
    // Get race pricing
    const { data: race, error: raceError } = await client
      .from("races")
      .select("id, name, price_cents, currency")
      .eq("id", raceId)
      .single();

    if (raceError || !race) {
      // Fallback to default pricing if race not found
      return await $fetch(`/api/races/${raceId}/pricing-fallback`);
    }

    // Get race extras with availability info
    const { data: extras, error: extrasError } = await client
      .from("race_extras_with_availability")
      .select(
        "id, name, description, price_cents, currency, max_quantity_per_participant, remaining_quantity, display_order"
      )
      .eq("race_id", raceId)
      .order("display_order, name");

    // If extras table doesn't exist or query fails, use fallback pricing
    if (extrasError) {
      console.log("Extras table not available, using fallback pricing");
      const fallbackData = await $fetch(
        `/api/races/${raceId}/pricing-fallback`
      );
      // Use real race data but fallback extras
      return {
        race: {
          id: (race as any).id,
          name: (race as any).name,
          price_cents: (race as any).price_cents,
          currency: (race as any).currency,
        },
        extras: (fallbackData as any).extras,
      };
    }

    return {
      race: {
        id: (race as any).id,
        name: (race as any).name,
        price_cents: (race as any).price_cents,
        currency: (race as any).currency,
      },
      extras: extras || [],
    };
  } catch (error) {
    console.error("Pricing API error:", error);
    // Ultimate fallback
    return await $fetch(`/api/races/${raceId}/pricing-fallback`);
  }
});
