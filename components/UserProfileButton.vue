<template>
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" class="relative h-9 w-9 rounded-full">
        <Avatar class="h-9 w-9">
          <AvatarFallback>
            {{ userInitials }}
          </AvatarFallback>
        </Avatar>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuLabel v-if="user">{{ userName }}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem @click="navigateToSettings">
        <SettingsIcon class="mr-2 h-4 w-4" />
        <span>Settings</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem @click="handleSignOut">
        <LogOutIcon class="mr-2 h-4 w-4" />
        <span>Sign out</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import { LogOutIcon, SettingsIcon } from 'lucide-vue-next'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const client = useSupabaseClient()
const user = useSupabaseUser()

// Compute user name and initials
const userName = computed(() => {
  if (!user.value?.user_metadata?.full_name) {
    return user.value?.email || 'User'
  }
  return user.value.user_metadata.full_name
})

const userInitials = computed(() => {
  if (user.value?.user_metadata?.full_name) {
    const fullName = user.value.user_metadata.full_name.trim()
    if (fullName) {
      return fullName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    }
  }
  return (user.value?.email?.substring(0, 2) || 'U').toUpperCase()
})

// Handle sign out
const handleSignOut = async () => {
  await client.auth.signOut()
  navigateTo('/login')
}

// Navigate to settings
const navigateToSettings = () => {
  navigateTo('/account/settings')
}
</script>
