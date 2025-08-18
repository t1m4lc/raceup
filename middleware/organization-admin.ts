export default defineNuxtRouteMiddleware(async (to, from) => {
  const user = useSupabaseUser();

  // Check if user is logged in
  if (!user.value) {
    throw createError({
      statusCode: 401,
      statusMessage: "Authentication required",
    });
  }

  // Check if user is a founder or member of any organization
  const client = useSupabaseClient();

  const { data: organizations, error } = await client
    .from("organizations")
    .select("id, name")
    .eq("founder_id", user.value.id);

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Error checking organization access",
    });
  }

  // TODO: Also check for organization members/volunteers when implemented
  // const { data: memberships } = await client
  //   .from("organization_members")
  //   .select("organization_id, role")
  //   .eq("profile_id", user.value.id);

  if (!organizations || organizations.length === 0) {
    throw createError({
      statusCode: 403,
      statusMessage:
        "Access denied - You must be an organization founder to access this area",
    });
  }
});
