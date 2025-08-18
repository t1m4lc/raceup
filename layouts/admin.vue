<template>
  <div class="flex h-screen">
    <!-- Sidebar -->
    <div class="hidden md:flex w-64 flex-col bg-background border-r">
      <div class="p-6">
        <h2 class="text-xl font-bold">RaceUp Admin</h2>
      </div>
      <nav class="flex-1 p-4">
        <ul class="space-y-1">
          <li>
            <NuxtLink 
              to="/admin/events" 
              class="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors" 
              :class="{ 'bg-secondary text-secondary-foreground': isActive('/admin/events'), 'hover:bg-accent hover:text-accent-foreground': !isActive('/admin/events') }"
            >
              <CalendarIcon class="h-4 w-4" />
              <span>Events</span>
            </NuxtLink>
          </li>
          <li>
            <NuxtLink 
              to="/admin/checkin" 
              class="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors"
              :class="{ 'bg-secondary text-secondary-foreground': isActive('/admin/checkin'), 'hover:bg-accent hover:text-accent-foreground': !isActive('/admin/checkin') }"
            >
              <ScanLineIcon class="h-4 w-4" />
              <span>Check-in</span>
            </NuxtLink>
          </li>
          <li>
            <NuxtLink 
              to="/tickets" 
              class="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors"
              :class="{ 'bg-secondary text-secondary-foreground': isActive('/tickets'), 'hover:bg-accent hover:text-accent-foreground': !isActive('/tickets') }"
            >
              <TicketIcon class="h-4 w-4" />
              <span>My Tickets</span>
            </NuxtLink>
          </li>
        </ul>
      </nav>
      <div class="p-4 border-t mt-auto">
        <Button variant="outline" class="w-full justify-start" asChild>
          <NuxtLink to="/">
            <HomeIcon class="h-4 w-4 mr-2" />
            Back to Home
          </NuxtLink>
        </Button>
      </div>
    </div>
    
    <!-- Main Content -->
    <div class="flex-1 flex flex-col h-screen overflow-hidden">
      <!-- Top Header -->
      <header class="border-b bg-background p-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" class="md:hidden">
          <MenuIcon class="h-5 w-5" />
        </Button>
        <div class="md:hidden">RaceUp Admin</div>
        <div class="flex items-center gap-4">
          <Button variant="ghost" size="sm">
            <BellIcon class="h-5 w-5" />
          </Button>
          <UserProfileButton />
        </div>
      </header>
      
      <!-- Main Content Area -->
      <main class="flex-1 overflow-y-auto p-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from '#imports'
import { 
  CalendarIcon, 
  HomeIcon, 
  MenuIcon, 
  ScanLineIcon, 
  TicketIcon,
  BellIcon
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

definePageMeta({
  middleware: ['auth', 'master-mode']
})

// Check if the current route matches a path
const route = useRoute()
const isActive = (path: string) => {
  return route.path.startsWith(path)
}
</script>

<script lang="ts">
// Make sure we expose this component as a layout
export default {
  name: 'AdminLayout'
}
</script>
