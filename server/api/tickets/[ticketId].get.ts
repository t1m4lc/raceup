import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";
import { formatDate } from "~/server/utils/helpers";
import type { Database } from "~/supabase/supabase";

export default defineEventHandler(async (event) => {
  try {
    // Get the ticket ID from the URL params
    const ticketId = getRouterParam(event, "ticketId");
    if (!ticketId) {
      throw createError({ statusCode: 400, message: "Ticket ID is required" });
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

    // Get the user's profile - using user.id directly as profile id
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      throw createError({
        statusCode: 404,
        message: "User profile not found",
      });
    }

    // Get the ticket with related data
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select(
        `
        *,
        race:races(*),
        purchaser:profiles!tickets_purchaser_id_fkey(*),
        participants(*)
      `
      )
      .eq("id", ticketId)
      .single();

    if (ticketError || !ticket) {
      console.error("Error fetching ticket:", ticketError);
      throw createError({
        statusCode: 404,
        message: "Ticket not found",
      });
    }

    // Check if the user is the purchaser or has a role that allows access
    const isOwner = ticket.purchaser_id === profile.id;

    // Check if user is organizer of the event
    const { data: isOrganizer } = await supabase
      .from("events")
      .select("id")
      .eq("id", ticket.race.event_id)
      .eq("organizer_id", profile.id);

    // Check if user is a volunteer for the event
    const { data: isVolunteer } = await supabase
      .from("event_volunteers")
      .select("id")
      .eq("event_id", ticket.race.event_id)
      .eq("volunteer_id", profile.id);

    if (!isOwner && !isOrganizer?.length && !isVolunteer?.length) {
      throw createError({
        statusCode: 403,
        message: "You do not have permission to view this ticket",
      });
    }

    // Get payment information
    const { data: payment } = await supabase
      .from("payments")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Format the response
    const formattedTicket = {
      id: ticket.id,
      status: ticket.status,
      totalAmount: ticket.total_price_cents / 100,
      currency: ticket.currency,
      race: {
        id: ticket.race.id,
        name: ticket.race.name,
        date: formatDate(ticket.race.date),
        distance: ticket.race.distance_km,
        eventId: ticket.race.event_id,
      },
      purchaser: {
        id: ticket.purchaser.id,
        name: ticket.purchaser.full_name, // Updated to use full_name instead of fullname
      },
      participants: ticket.participants.map((p: any) => ({
        id: p.id,
        name: p.full_name, // Updated to use full_name instead of fullname
        birthdate: formatDate(p.birthdate, "YYYY-MM-DD"),
        gender: p.gender,
        certificateValidated: p.certificate_validated,
        certificateUrl: p.certificate_url,
        checkedIn: p.checkin_at ? formatDate(p.checkin_at) : null,
      })),
      payment: payment
        ? {
            id: payment.id,
            status: payment.status,
            amount: payment.amount_cents / 100,
            applicationFee: payment.application_fee_cents / 100,
            createdAt: payment.created_at
              ? formatDate(payment.created_at)
              : null,
          }
        : null,
      createdAt: ticket.created_at ? formatDate(ticket.created_at) : null,
    };

    return formattedTicket;
  } catch (error: any) {
    console.error("Error getting ticket details:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message:
        error.message || "An error occurred while fetching ticket details",
    });
  }
});
