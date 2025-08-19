import { serverSupabaseServiceRole } from "#supabase/server";
import type { Database } from "~/supabase/supabase";

export default defineEventHandler(async (event) => {
  try {
    const ticketId = getQuery(event).ticketId as string;
    const supabase = serverSupabaseServiceRole<Database>(event);

    const { data: participants, error } = await supabase
      .from("participants")
      .select("*")
      .eq("ticket_id", ticketId);

    return {
      success: true,
      ticketId,
      participants: participants || [],
      error: error || null,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
});
