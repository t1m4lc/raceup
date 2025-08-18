import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~/supabase/supabase";

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient<Database>(event);

    // Get available races with their events and organizations
    const { data: races, error } = await supabase
      .from("races")
      .select(
        `
        *,
        event:events(
          *,
          organization:organizations(*)
        )
      `
      )
      .limit(5);

    if (error) {
      console.error("Database error:", error);
      return {
        success: false,
        message: "Database connection issue",
        races: [],
      };
    }

    return {
      success: true,
      races: races || [],
      count: races?.length || 0,
    };
  } catch (error: any) {
    console.error("API error:", error);
    return {
      success: false,
      message: error.message,
      races: [],
    };
  }
});
