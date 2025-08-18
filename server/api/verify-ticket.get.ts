import { serverSupabaseServiceRole } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const { code, t: ticketId, p: participantId } = query;

  if (!code || !ticketId || !participantId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing required parameters",
    });
  }

  const supabase = serverSupabaseServiceRole(event);

  try {
    // Verify the ticket exists and get details using raw SQL for flexibility
    const { data: tickets, error } = (await supabase.rpc(
      "verify_individual_ticket",
      {
        p_ticket_id: ticketId as string,
        p_participant_id: participantId as string,
        p_qr_code_data: `${getRequestURL(event).origin}/verify-ticket?code=${code}&t=${ticketId}&p=${participantId}`,
      }
    )) as { data: any[] | null; error: any };

    if (error || !tickets || tickets.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "Ticket not found or invalid QR code",
      });
    }

    const ticket = tickets[0] as any;

    // Check if ticket is valid
    if (ticket.status !== "valid") {
      return {
        valid: false,
        ticket,
        message: `Ticket is ${ticket.status}`,
      };
    }

    // Check if already checked in
    if (ticket.checked_in_at) {
      return {
        valid: false,
        ticket,
        message: "Ticket already used",
        checkedInAt: ticket.checked_in_at,
      };
    }

    // Check if event is today or in the future (allow check-in up to 2 hours early)
    const raceStart = new Date(ticket.race_start_time);
    const now = new Date();
    const twoHoursEarly = new Date(raceStart.getTime() - 2 * 60 * 60 * 1000);

    if (now < twoHoursEarly) {
      return {
        valid: false,
        ticket,
        message:
          "Check-in not yet available. Check-in opens 2 hours before race start.",
      };
    }

    return {
      valid: true,
      ticket,
      message: "Ticket is valid for check-in",
    };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Failed to verify ticket",
    });
  }
});
