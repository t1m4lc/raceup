<script setup lang="ts">
import Button from '~/components/ui/button/Button.vue'
import Input from '~/components/ui/input/Input.vue'

const supabase = useSupabaseClient()
const email = ref('')
const redirectInfo = useSupabaseCookieRedirect()

const signInWithOtp = async () => {
  // Set redirect to /protected after login
  redirectInfo.path.value = '/protected'
  
  const { error } = await supabase.auth.signInWithOtp({
    email: email.value,
    options: {
      emailRedirectTo: 'http://localhost:3000/confirm',
    }
  })
  if (error) console.log(error)
}
</script>
<template>
  <div>
    <Button @click="signInWithOtp">
      Sign In with E-Mail
    </Button>
    <Input v-model="email" type="email" />
  </div>
</template>
