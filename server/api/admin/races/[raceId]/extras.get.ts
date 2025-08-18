// server/api/admin/races/[raceId]/extras.get.ts
import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event);
  const user = await serverSupabaseUser(event);
  const raceId = getRouterParam(event, "raceId");

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Authentication required",
    });
  }

  if (!raceId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Race ID is required",
    });
  }

  try {
    // Check if user is organization founder for this race
    const { data: race, error: raceError } = await client
      .from("races")
      .select(
        `
        id,
        event_id,
        events(
          organization_id,
          organizations(
            founder_id
          )
        )
      `
      )
      .eq("id", raceId)
      .single();

    if (raceError || !race) {
      throw createError({
        statusCode: 404,
        statusMessage: "Race not found",
      });
    }

    const organizationFounderId = (race as any).events?.organizations
      ?.founder_id;
    if (organizationFounderId !== user.id) {
      throw createError({
        statusCode: 403,
        statusMessage: "Access denied",
      });
    }

    // Get all extras for this race (including inactive ones for admin)
    const { data: extras, error: extrasError } = await client
      .from("extras")
      .select(
        `
        id, 
        name, 
        description, 
        short_description,
        price_cents, 
        currency, 
        max_quantity_per_participant, 
        total_available_quantity,
        current_sold_quantity,
        is_active,
        available_from,
        available_until,
        display_order,
        image_url,
        category,
        created_at,
        updated_at
      `
      )
      .eq("race_id", raceId)
      .order("display_order, name");

    if (extrasError) {
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to fetch extras",
      });
    }

    return {
      race_id: raceId,
      extras: extras || [],
    };
  } catch (error) {
    console.error("Admin extras API error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
