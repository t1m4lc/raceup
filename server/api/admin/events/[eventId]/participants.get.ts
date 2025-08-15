import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";
import type { Database } from "~/supabase/supabase";
import dayjs from "dayjs";

export default defineEventHandler(async (event) => {
  try {
    // Get the event ID from the URL params
    const eventId = getRouterParam(event, "eventId");
    if (!eventId) {
      throw createError({ statusCode: 400, message: "Event ID is required" });
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

    // Verify the user is an organizer for this event
    const { data: isOrganizer } = await supabase
      .from("events")
      .select("id")
      .eq("id", eventId)
      .eq("organizer_id", profile.id);

    if (!isOrganizer?.length) {
      throw createError({
        statusCode: 403,
        message: "You do not have permission to access this resource",
      });
    }

    // Query for all participants in all races for this event
    const { data, error } = await supabase
      .from("participants")
      .select(
        `
        *,
        ticket:tickets(
          *,
          race:races(
            id,
            name,
            date,
            distance_km
          ),
          purchaser:profiles!tickets_purchaser_id_fkey(
            id,
            fullname
          )
        )
      `
      )
      .eq("ticket.race.event_id", eventId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching participants:", error);
      throw createError({
        statusCode: 500,
        message: "Failed to fetch participants",
      });
    }

    // Format the response
    const formattedParticipants = data.map((p: any) => ({
      id: p.id,
      name: p.full_name, // Updated to use full_name instead of fullname
      birthdate: dayjs(p.birthdate).format("YYYY-MM-DD"),
      gender: p.gender,
      certificateValidated: p.certificate_validated,
      certificateUrl: p.certificate_url,
      checkedIn: p.checkin_at
        ? dayjs(p.checkin_at).format("MMM D, YYYY HH:mm")
        : null,
      ticket: {
        id: p.ticket.id,
        status: p.ticket.status,
      },
      race: {
        id: p.ticket.race.id,
        name: p.ticket.race.name,
        date: dayjs(p.ticket.race.date).format("MMM D, YYYY"),
        distance: p.ticket.race.distance_km,
      },
      purchaser: {
        id: p.ticket.purchaser.id,
        name: p.ticket.purchaser.full_name, // Updated to use full_name instead of fullname
      },
      createdAt: dayjs(p.created_at).format("MMM D, YYYY HH:mm"),
    }));

    return {
      count: formattedParticipants.length,
      participants: formattedParticipants,
    };
  } catch (error: any) {
    console.error("Error getting event participants:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "An error occurred while fetching participants",
    });
  }
});
