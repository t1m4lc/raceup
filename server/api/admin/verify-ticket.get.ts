import { serverSupabaseServiceRole } from "#supabase/server";
import type { Database } from "~/supabase/supabase";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const qrData = query.qr_data as string;
    const eventId = query.event_id as string;

    if (!qrData) {
      throw createError({
        statusCode: 400,
        message: "QR data is required",
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

    // Verify the ticket using the stored procedure
    const { data, error } = await supabase.rpc("verify_individual_ticket", {
      p_qr_code_data: qrData,
      p_event_id: eventId,
    });

    if (error) {
      console.error("Error verifying ticket:", error);
      throw createError({
        statusCode: 500,
        message: "Failed to verify ticket",
      });
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        message: "Invalid or expired ticket",
        participant: null,
      };
    }

    const participantData = data[0];

    // Check if already checked in
    if (participantData.checked_in_at) {
      return {
        success: false,
        message: "Ticket already used",
        participant: participantData,
        checkedInAt: participantData.checked_in_at,
      };
    }

    return {
      success: true,
      message: "Valid ticket",
      participant: {
        id: participantData.participant_id,
        ticketId: participantData.ticket_id,
        firstName: participantData.participant_first_name || "",
        lastName: participantData.participant_last_name || "",
        birthdate: participantData.participant_birthdate,
        gender: participantData.participant_gender,
        raceName: participantData.race_name,
        raceDistance: participantData.race_distance_km,
        ticketNumber: participantData.ticket_number,
        bibNumber: participantData.participant_bib_number,
      },
    };
  } catch (error: any) {
    console.error("Error in verify-ticket endpoint:", error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: "Internal server error",
    });
  }
});
