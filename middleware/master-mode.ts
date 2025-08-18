export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()
  
  // Must be logged in
  if (!user.value) {
    return navigateTo('/')
  }

  // Only allow your email - Master Mode = Super Admin
  const masterModeEmails = [
    'timothy.alcaide@gmail.com',  // Timothy - Super Admin (vraie adresse)
    't1m4lc@gmail.com',          // Ancien email (au cas où)
    'timothy@raceup.com',        // Backup email
    // Add more master mode emails if needed
  ]

  if (!masterModeEmails.includes(user.value.email || '')) {
    return navigateTo('/')
  }
})
