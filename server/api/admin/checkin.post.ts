import { serverSupabaseServiceRole } from "#supabase/server";
import type { Database } from "~/supabase/supabase";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { participantId, eventId, checkedInBy, bibNumber } = body;

    if (!participantId) {
      throw createError({
        statusCode: 400,
        message: "Participant ID is required",
      });
    }

    if (!eventId) {
      throw createError({
        statusCode: 400,
        message: "Event ID is required",
      });
    }

    // Initialize Supabase with service role
    const supabase = serverSupabaseServiceRole<Database>(event);

    // Check if the participant exists and belongs to this event
    const { data: participant, error: participantError } = await supabase
      .from("individual_tickets")
      .select(
        `
        id,
        ticket_id,
        participant_id,
        checked_in_at,
        tickets!inner(
          event_id
        )
      `
      )
      .eq("participant_id", participantId)
      .eq("tickets.event_id", eventId)
      .single();

    if (participantError || !participant) {
      throw createError({
        statusCode: 404,
        message: "Participant not found for this event",
      });
    }

    // Check if already checked in
    if (participant.checked_in_at) {
      throw createError({
        statusCode: 400,
        message: "Participant is already checked in",
      });
    }

    // Perform check-in
    const { error: checkinError } = await supabase
      .from("individual_tickets")
      .update({
        checked_in_at: new Date().toISOString(),
        checked_in_by: checkedInBy || null,
      })
      .eq("id", participant.id);

    // If bibNumber provided, update the participant record
    if (bibNumber) {
      const { error: bibError } = await supabase
        .from("participants")
        .update({
          bib_number: bibNumber,
        })
        .eq("id", participantId);

      if (bibError) {
        console.error("Error updating bib number:", bibError);
        // Don't fail the check-in if bib number update fails
      }
    }

    if (checkinError) {
      console.error("Error checking in participant:", checkinError);
      throw createError({
        statusCode: 500,
        message: "Failed to check in participant",
      });
    }

    return {
      success: true,
      message: "Participant checked in successfully",
      checkedInAt: new Date().toISOString(),
      bibNumber: bibNumber || null,
    };
  } catch (error: any) {
    console.error("Error in checkin endpoint:", error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: "Internal server error",
    });
  }
});
