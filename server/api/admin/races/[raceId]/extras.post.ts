// server/api/admin/races/[raceId]/extras.post.ts
import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event);
  const user = await serverSupabaseUser(event);
  const raceId = getRouterParam(event, "raceId");
  const body = await readBody(event);

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

    // Validate required fields
    const {
      name,
      description,
      short_description,
      price_cents,
      currency = "EUR",
      max_quantity_per_participant = 1,
      total_available_quantity,
      is_active = true,
      available_from,
      available_until,
      display_order = 0,
      image_url,
      category,
    } = body;

    if (!name || price_cents === undefined) {
      throw createError({
        statusCode: 400,
        statusMessage: "Name and price are required",
      });
    }

    // Create the extra
    const { data: extra, error: insertError } = await client
      .from("extras")
      .insert({
        race_id: raceId,
        name,
        description,
        short_description,
        price_cents: parseInt(price_cents),
        currency,
        max_quantity_per_participant: parseInt(max_quantity_per_participant),
        total_available_quantity: total_available_quantity
          ? parseInt(total_available_quantity)
          : null,
        is_active,
        available_from,
        available_until,
        display_order: parseInt(display_order),
        image_url,
        category,
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        // Unique constraint violation
        throw createError({
          statusCode: 409,
          statusMessage: "An extra with this name already exists for this race",
        });
      }
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to create extra",
      });
    }

    return {
      success: true,
      extra,
    };
  } catch (error) {
    console.error("Create extra API error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
