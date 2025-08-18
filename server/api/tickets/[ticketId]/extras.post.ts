import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event);
  const user = await serverSupabaseUser(event);

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Authentication required",
    });
  }

  const body = await readBody(event);
  const { ticketId, participantExtras } = body;

  if (!ticketId || !participantExtras || !Array.isArray(participantExtras)) {
    throw createError({
      statusCode: 400,
      statusMessage: "ticketId and participantExtras array are required",
    });
  }

  try {
    // Verify ticket belongs to user
    const { data: ticket, error: ticketError } = await client
      .from("tickets")
      .select("id, buyer_id, race_id")
      .eq("id", ticketId)
      .eq("buyer_id", user.id)
      .single();

    if (ticketError || !ticket) {
      throw createError({
        statusCode: 404,
        statusMessage: "Ticket not found or access denied",
      });
    }

    // Get race extras to validate pricing
    const { data: raceExtras, error: extrasError } = await client
      .from("race_extras")
      .select("id, name, price_cents, currency, max_quantity_per_participant")
      .eq("race_id", (ticket as any).race_id)
      .eq("is_active", true);

    if (extrasError) {
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to fetch race extras",
      });
    }

    const extrasMap = new Map(
      (raceExtras as any[]).map((extra) => [extra.id, extra])
    );
    const results = [];

    // Process each participant's extras
    for (const participantExtra of participantExtras) {
      const { participantId, extras } = participantExtra;

      if (!participantId || !extras || !Array.isArray(extras)) {
        continue;
      }

      // Verify participant belongs to this ticket
      const { data: participant, error: participantError } = await client
        .from("participants")
        .select("id")
        .eq("id", participantId)
        .eq("ticket_id", ticketId)
        .single();

      if (participantError || !participant) {
        continue;
      }

      // Process each extra for this participant
      for (const extra of extras) {
        const { extraId, quantity } = extra;

        if (!extraId || !quantity || quantity < 1) {
          continue;
        }

        const raceExtra = extrasMap.get(extraId) as any;
        if (!raceExtra) {
          continue;
        }

        // Check quantity limits
        if (quantity > raceExtra.max_quantity_per_participant) {
          throw createError({
            statusCode: 400,
            statusMessage: `Quantity ${quantity} exceeds maximum ${raceExtra.max_quantity_per_participant} for ${raceExtra.name}`,
          });
        }

        // Create or update participant_extra (SEULE TABLE MAINTENANT)
        const { data: participantExtraData, error: participantExtraError } =
          await client
            .from("participant_extras")
            .upsert(
              {
                participant_id: participantId,
                race_extra_id: extraId,
                quantity: quantity,
                unit_price_cents: raceExtra.price_cents,
                total_price_cents: raceExtra.price_cents * quantity, // Calculé automatiquement par trigger
                currency: raceExtra.currency,
              } as any,
              {
                onConflict: "participant_id, race_extra_id",
              }
            )
            .select();

        if (participantExtraError) {
          console.error(
            "Error creating participant extra:",
            participantExtraError
          );
          continue;
        }

        results.push({
          participantId,
          extraId,
          extraName: raceExtra.name,
          quantity,
          unitPrice: raceExtra.price_cents,
          totalPrice: raceExtra.price_cents * quantity,
        });
      }
    }

    return {
      success: true,
      message: "Extras saved successfully",
      data: results,
    };
  } catch (error) {
    console.error("Save extras error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
