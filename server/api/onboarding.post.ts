import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";
import type { Database } from "~/supabase/supabase";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  try {
    // Get the authenticated user
    const user = await serverSupabaseUser(event);
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    }

    // Validate the incoming data
    const { firstName, lastName, dateOfBirth, gender, phoneNumber } = body;

    if (!firstName || !lastName || !dateOfBirth || !gender || !phoneNumber) {
      throw createError({
        statusCode: 400,
        statusMessage: "Missing required fields",
      });
    }

    // Update the user profile in Supabase
    const client = await serverSupabaseClient<Database>(event);
    const { data, error } = await client
      .from("profiles")
      .update({
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dateOfBirth,
        gender,
        phone_number: phoneNumber,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to update profile",
      });
    }

    return {
      success: true,
      message: "Profile updated successfully",
      data,
    };
  } catch (error: any) {
    console.error("Onboarding API error:", error);

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Internal server error",
    });
  }
});
