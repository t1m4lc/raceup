// server/api/tickets/calculate-total.post.ts
import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event);
  const user = await serverSupabaseUser(event);
  const body = await readBody(event);

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Authentication required",
    });
  }

  const { raceId, participants, participantExtras } = body;

  if (!raceId || !participants || !Array.isArray(participants)) {
    throw createError({
      statusCode: 400,
      statusMessage: "raceId and participants array are required",
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
      throw createError({
        statusCode: 404,
        statusMessage: "Race not found",
      });
    }

    // Get available extras for this race
    const { data: extras, error: extrasError } = await client
      .from("race_extras_with_availability")
      .select("*")
      .eq("race_id", raceId);

    if (extrasError) {
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to fetch race extras",
      });
    }

    // Calculate totals
    let raceTotalCents = 0;
    let extrasTotalCents = 0;
    const calculatedParticipants = [];
    const calculatedExtras = new Map();

    // Calculate race costs
    raceTotalCents = (race as any).price_cents * participants.length;

    // Fill calculatedParticipants with base participant data
    for (let i = 0; i < participants.length; i++) {
      calculatedParticipants[i] = {
        ...participants[i],
        extras: [],
        extras_cost_cents: 0,
      };
    }

    // Process each participant's extras if provided
    if (participantExtras && Array.isArray(participantExtras)) {
      for (const participantExtra of participantExtras) {
        const { participantIndex, extras: participantExtrasList } =
          participantExtra;

        if (!participantExtrasList || !Array.isArray(participantExtrasList)) {
          continue;
        }

        if (participantIndex < 0 || participantIndex >= participants.length) {
          continue;
        }

        let participantExtrasCost = 0;
        const validatedExtras = [];

        for (const extraSelection of participantExtrasList) {
          const { extraId, quantity } = extraSelection;

          if (!extraId || !quantity || quantity < 1) {
            continue;
          }

          const extra = extras?.find((e: any) => e.id === extraId);

          if (!extra) {
            throw createError({
              statusCode: 400,
              statusMessage: `Extra with ID "${extraId}" not found`,
            });
          }

          if (!extra.is_active) {
            throw createError({
              statusCode: 400,
              statusMessage: `Extra "${extra.name}" is not available`,
            });
          }

          if (quantity > extra.max_quantity_per_participant) {
            throw createError({
              statusCode: 400,
              statusMessage: `Maximum ${extra.max_quantity_per_participant} of "${extra.name}" allowed per participant`,
            });
          }

          // Check stock availability
          const currentExtraTotal = calculatedExtras.get(extra.id) || 0;
          const newTotal = currentExtraTotal + quantity;

          if (
            extra.remaining_quantity !== null &&
            newTotal > extra.remaining_quantity
          ) {
            throw createError({
              statusCode: 400,
              statusMessage: `Not enough "${extra.name}" in stock`,
            });
          }

          calculatedExtras.set(extra.id, newTotal);

          const extraCost = extra.price_cents * quantity;
          participantExtrasCost += extraCost;
          extrasTotalCents += extraCost;

          validatedExtras.push({
            extra_id: extra.id,
            name: extra.name,
            quantity,
            unit_price_cents: extra.price_cents,
            total_price_cents: extraCost,
            currency: extra.currency,
          });
        }

        calculatedParticipants[participantIndex] = {
          ...participants[participantIndex],
          extras: validatedExtras,
          extras_cost_cents: participantExtrasCost,
        };
      }
    }

    // Calculate final totals
    const subtotalCents = raceTotalCents + extrasTotalCents;

    // Group extras by ID with total quantities for summary
    const extrasSummary = [];
    for (const [extraId, totalQuantity] of calculatedExtras.entries()) {
      const extra = extras?.find((e: any) => e.id === extraId);
      if (extra) {
        extrasSummary.push({
          extra_id: extraId,
          name: extra.name,
          quantity: totalQuantity,
          unit_price_cents: extra.price_cents,
          total_price_cents: (extra.price_cents || 0) * totalQuantity,
          currency: extra.currency,
        });
      }
    }

    return {
      success: true,
      calculation: {
        race: {
          id: race.id,
          name: race.name,
          price_cents: race.price_cents,
          currency: race.currency,
          participants_count: participants.length,
          total_cents: raceTotalCents,
        },
        extras: {
          summary: extrasSummary,
          total_cents: extrasTotalCents,
        },
        participants: calculatedParticipants,
        totals: {
          race_total_cents: raceTotalCents,
          extras_total_cents: extrasTotalCents,
          subtotal_cents: subtotalCents,
          currency: race.currency,
        },
      },
    };
  } catch (error: any) {
    console.error("Calculate total error:", error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
