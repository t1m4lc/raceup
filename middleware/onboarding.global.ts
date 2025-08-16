export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only handle /onboarding route
  if (to.path !== "/onboarding") {
    return;
  }

  const user = useSupabaseUser();
  const supabase = useSupabaseClient();

  // If user is not authenticated, redirect to login
  if (!user.value) {
    return navigateTo("/login");
  }

  // Check if user wants to skip onboarding (query parameter)
  if (to.query.skip === "true") {
    try {
      // Mark onboarding as completed (skipped)
      await supabase.from("profiles").upsert({
        id: user.value.id,
        onboarding_completed: true,
      });

      // Redirect to home after skipping
      return navigateTo("/");
    } catch (error) {
      console.error("Error skipping onboarding:", error);
    }
  }

  try {
    // Check if user has completed onboarding
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.value.id)
      .single();

    if (error) {
      console.error("Error checking onboarding status:", error);
      // Allow access even if there's an error
      return;
    }

    // If onboarding is already completed, redirect to home
    if (profile && (profile as any).onboarding_completed) {
      return navigateTo("/");
    }

    // Allow access to onboarding page (user is auth and onboarding not completed)
  } catch (error) {
    console.error("Middleware error:", error);
    // Allow access even if there's an error
  }
});
