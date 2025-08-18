import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event);
  const user = await serverSupabaseUser(event);
  const ticketId = getRouterParam(event, "ticketId");

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Authentication required",
    });
  }

  if (!ticketId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Ticket ID is required",
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

    // Get participant extras with full details (STRUCTURE SIMPLIFIÉE)
    const { data: participantExtras, error: extrasError } = await client
      .from("participant_extras")
      .select(
        `
        id,
        quantity,
        unit_price_cents,
        total_price_cents,
        currency,
        participant:participant_id (
          id,
          first_name,
          last_name,
          ticket_id
        ),
        race_extra:race_extra_id (
          id,
          name,
          description,
          max_quantity_per_participant
        )
      `
      )
      .eq("participant.ticket_id", ticketId);

    if (extrasError) {
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to fetch participant extras",
      });
    }

    // Calculate totals
    const totalExtrasCents = (participantExtras as any[]).reduce(
      (sum, pe) => sum + pe.total_price_cents,
      0
    );

    // Group by participant
    const participantGroups = (participantExtras as any[]).reduce(
      (groups, pe) => {
        const participantId = pe.participant.id;
        if (!groups[participantId]) {
          groups[participantId] = {
            participantId,
            participantName:
              `${pe.participant.first_name} ${pe.participant.last_name}`.trim(),
            extras: [],
          };
        }

        groups[participantId].extras.push({
          extraId: pe.race_extra.id,
          extraName: pe.race_extra.name,
          extraDescription: pe.race_extra.description,
          quantity: pe.quantity,
          unitPriceCents: pe.unit_price_cents,
          totalPriceCents: pe.total_price_cents,
          currency: pe.currency,
        });

        return groups;
      },
      {}
    );

    return {
      ticketId,
      raceId: (ticket as any).race_id,
      totalExtrasCents,
      participantExtras: Object.values(participantGroups),
      rawExtras: participantExtras, // Pour debug si nécessaire
    };
  } catch (error) {
    console.error("Get ticket extras error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
