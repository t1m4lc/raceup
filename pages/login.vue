<script setup>
import { ref } from 'vue'
import { useSupabaseClient, useSupabaseCookieRedirect } from '#imports'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { MailIcon, LoaderIcon } from 'lucide-vue-next'

const supabase = useSupabaseClient()
const email = ref('')
const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const redirectInfo = useSupabaseCookieRedirect()

const signInWithOtp = async () => {
  if (!email.value || !email.value.includes('@')) {
    errorMessage.value = 'Please enter a valid email address'
    return
  }
  
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  
  try {
    // Set redirect to home page after login
    redirectInfo.path.value = '/'
    
    const { error } = await supabase.auth.signInWithOtp({
      email: email.value,
      options: {
        emailRedirectTo: `${window.location.origin}/confirm`,
      }
    })
    
    if (error) {
      errorMessage.value = error.message || 'Failed to send login email'
    } else {
      successMessage.value = 'Check your email for the login link'
      email.value = '' // Reset email field
    }
  } catch (err) {
    errorMessage.value = 'An unexpected error occurred'
    console.error('Login error:', err)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex items-center justify-center min-h-[80vh]">
    <Card class="w-full max-w-md">
      <CardHeader class="text-center">
        <CardTitle class="text-2xl">RaceUp</CardTitle>
        <CardDescription>Sign in to your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="signInWithOtp" class="space-y-4">
          <div class="space-y-2">
            <label for="email" class="block text-sm font-medium">Email</label>
            <Input 
              id="email" 
              v-model="email" 
              type="email" 
              placeholder="name@example.com" 
              required 
            />
          </div>
          
          <Button type="submit" class="w-full" :disabled="loading">
            <MailIcon v-if="!loading" class="mr-2 h-4 w-4" />
            <LoaderIcon v-else class="mr-2 h-4 w-4 animate-spin" />
            {{ loading ? 'Sending Link...' : 'Send Magic Link' }}
          </Button>
          
          <!-- Success Message -->
          <div v-if="successMessage" class="bg-green-50 text-green-800 p-3 rounded-md text-sm">
            {{ successMessage }}
          </div>
          
          <!-- Error Message -->
          <div v-if="errorMessage" class="bg-red-50 text-red-800 p-3 rounded-md text-sm">
            {{ errorMessage }}
          </div>
        </form>
      </CardContent>
      <CardFooter class="flex justify-center text-sm text-gray-600">
        <p>We'll email you a magic link for a password-free sign in.</p>
      </CardFooter>
    </Card>
  </div>
</template>
