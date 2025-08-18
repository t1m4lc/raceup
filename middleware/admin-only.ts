export default defineNuxtRouteMiddleware(async (to, from) => {
  const user = useSupabaseUser();

  // Check if user is logged in
  if (!user.value) {
    throw createError({
      statusCode: 401,
      statusMessage: "Authentication required",
    });
  }

  // Add your email here - replace with your actual email
  const adminEmails = [
    "timothy@example.com", // Replace with your actual email
    "your-email@domain.com", // Add more admin emails if needed
  ];

  // Check if user email is in admin list
  if (!adminEmails.includes(user.value.email)) {
    throw createError({
      statusCode: 403,
      statusMessage: "Access denied - Admin privileges required",
    });
  }
});
