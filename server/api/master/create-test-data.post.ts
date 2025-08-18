import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~/supabase/supabase";

export default defineEventHandler(async (eventHandler) => {
  try {
    const supabase = await serverSupabaseClient<Database>(eventHandler);

    // First check if we already have test data
    const { data: existingOrgs } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("name", "Course Test Marseille");

    if (existingOrgs && existingOrgs.length > 0) {
      return {
        success: false,
        message: "Test data already exists",
        data: existingOrgs[0],
      };
    }

    // We need a user to be the founder - let's use the current authenticated user
    // For now, let's use a placeholder and update it later
    const founderId = "00000000-0000-0000-0000-000000000000";

    // Create organization with proper data structure
    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name: "Course Test Marseille",
        slug: "course-test-marseille",
        description: "Organisation de test pour les courses à Marseille",
        founder_id: founderId, // Required field
        // Stripe fields will be set when Connect account is created
        stripe_account_id: null,
        stripe_onboarding_completed: false,
      })
      .select()
      .single();

    if (orgError) {
      console.error("Organization creation error:", orgError);
      throw createError({
        statusCode: 500,
        message: `Failed to create organization: ${orgError.message}`,
      });
    }

    // Create event
    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .insert({
        organization_id: organization.id,
        name: "Trail de Marseille 2025",
        slug: "trail-marseille-2025",
        description: "Course de trail dans les calanques de Marseille",
        start_date: "2025-09-15T08:00:00Z",
        end_date: "2025-09-15T16:00:00Z",
        location: "Parc National des Calanques, Marseille",
      })
      .select()
      .single();

    if (eventError) {
      console.error("Event creation error:", eventError);
      throw createError({
        statusCode: 500,
        message: `Failed to create event: ${eventError.message}`,
      });
    }

    // Create races
    const races = [
      {
        event_id: eventData.id,
        name: "10K Trail",
        slug: "10k-trail",
        distance_km: 10,
        elevation_m: 300,
        price_cents: 2500, // 25 EUR
        currency: "EUR",
        max_participants: 200,
        start_time: "2025-09-15T09:00:00Z",
      },
      {
        event_id: eventData.id,
        name: "21K Trail",
        slug: "21k-trail",
        distance_km: 21,
        elevation_m: 800,
        price_cents: 3500, // 35 EUR
        currency: "EUR",
        max_participants: 150,
        start_time: "2025-09-15T08:30:00Z",
      },
      {
        event_id: eventData.id,
        name: "5K Fun Run",
        slug: "5k-fun-run",
        distance_km: 5,
        elevation_m: 100,
        price_cents: 1500, // 15 EUR
        currency: "EUR",
        max_participants: 100,
        start_time: "2025-09-15T10:00:00Z",
      },
    ];

    const { data: createdRaces, error: racesError } = await supabase
      .from("races")
      .insert(races)
      .select();

    if (racesError) {
      console.error("Races creation error:", racesError);
      throw createError({
        statusCode: 500,
        message: `Failed to create races: ${racesError.message}`,
      });
    }

    return {
      success: true,
      message: "Test data created successfully",
      data: {
        organization,
        event: eventData,
        races: createdRaces,
        next_steps: [
          "1. Go to Master Mode > Stripe Connect Manager",
          "2. Create a Stripe Connect account for this organization",
          "3. Test the payment flow with the created races",
        ],
      },
    };
  } catch (error: any) {
    console.error("Create test data error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to create test data",
    });
  }
});
