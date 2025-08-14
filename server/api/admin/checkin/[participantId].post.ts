import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";
import type { Database } from "~/supabase/supabase";

export default defineEventHandler(async (event) => {
  try {
    // Get the participant ID from the URL params
    const participantId = getRouterParam(event, "participantId");
    if (!participantId) {
      throw createError({
        statusCode: 400,
        message: "Participant ID is required",
      });
    }

    // Get the current user
    const user = await serverSupabaseUser(event);
    if (!user) {
      throw createError({
        statusCode: 401,
        message: "Unauthorized",
      });
    }

    // Get Supabase client
    const supabase = await serverSupabaseClient<Database>(event);

    // Get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("auth_user_id", user.id)
      .single();

    if (profileError || !profile) {
      throw createError({
        statusCode: 404,
        message: "User profile not found",
      });
    }

    // Verify the user is a volunteer
    if (profile.role !== "volunteer") {
      throw createError({
        statusCode: 403,
        message: "Access denied. Required role: volunteer",
      });
    }

    // Get the request body
    const body = await readBody(event);
    const { certificateValidated } = body;

    // First, check if the volunteer is assigned to the event for this participant
    const { data: participant, error: participantError } = await supabase
      .from("participants")
      .select(
        `
        *,
        ticket:tickets(
          race:races(
            event_id
          )
        )
      `
      )
      .eq("id", participantId)
      .single();

    if (participantError || !participant) {
      console.error("Error fetching participant:", participantError);
      throw createError({
        statusCode: 404,
        message: "Participant not found",
      });
    }

    // Check if volunteer is assigned to this event
    const eventId = participant.ticket.race.event_id;
    const { data: volunteerAssignment, error: assignmentError } = await supabase
      .from("event_volunteers")
      .select("*")
      .eq("event_id", eventId)
      .eq("volunteer_id", profile.id)
      .single();

    if (assignmentError || !volunteerAssignment) {
      throw createError({
        statusCode: 403,
        message:
          "You are not authorized to check in participants for this event",
      });
    }

    // Update the participant record with check-in information
    const { data: updatedParticipant, error: updateError } = await supabase
      .from("participants")
      .update({
        checkin_at: new Date().toISOString(),
        certificate_validated:
          certificateValidated !== undefined
            ? certificateValidated
            : participant.certificate_validated,
      })
      .eq("id", participantId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating participant:", updateError);
      throw createError({
        statusCode: 500,
        message: "Failed to update participant check-in status",
      });
    }

    return {
      success: true,
      participant: {
        id: updatedParticipant.id,
        fullname: updatedParticipant.fullname,
        checkinAt: updatedParticipant.checkin_at,
        certificateValidated: updatedParticipant.certificate_validated,
      },
    };
  } catch (error: any) {
    console.error("Error checking in participant:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "An error occurred during check-in",
    });
  }
});
