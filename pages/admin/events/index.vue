<template>
  <div>
    <div class="flex items-center justify-between space-y-2 mb-6">
      <div>
        <h2 class="text-3xl font-bold tracking-tight">Events</h2>
        <p class="text-muted-foreground">
          Manage your racing events and participants
        </p>
      </div>
      <div class="flex items-center space-x-2">
        <Button>
          <PlusIcon class="mr-2 h-4 w-4" />
          Create New Event
        </Button>
      </div>
    </div>
    
    <div v-if="loading" class="flex justify-center my-12">
      <div class="animate-spin h-12 w-12 border-t-4 border-b-4 border-primary rounded-full"></div>
    </div>
    
    <div v-else-if="error" class="bg-destructive/20 p-4 rounded-md text-destructive mb-4">
      {{ error }}
    </div>
    
    <div v-else-if="events.length === 0" class="text-center my-12">
      <CalendarIcon class="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 class="mt-4 text-lg font-medium">No events yet</h3>
      <p class="text-muted-foreground mt-2 mb-4">
        You haven't created any events yet. Get started by creating your first event.
      </p>
      <Button>
        <PlusIcon class="mr-2 h-4 w-4" />
        Create New Event
      </Button>
    </div>
    
    <div v-else>
      <div class="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Participants</TableHead>
              <TableHead class="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="event in events" :key="event.id">
              <TableCell class="font-medium">{{ event.name }}</TableCell>
              <TableCell>{{ formatDate(event.start_date) }}</TableCell>
              <TableCell>{{ formatDate(event.end_date) }}</TableCell>
              <TableCell>{{ event.location }}</TableCell>
              <TableCell>{{ event.participant_count || 0 }}</TableCell>
              <TableCell class="text-right">
                <div class="flex justify-end space-x-2">
                  <Button variant="ghost" size="icon" asChild>
                    <NuxtLink :to="`/admin/events/${event.id}`">
                      <PencilIcon class="h-4 w-4" />
                    </NuxtLink>
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <NuxtLink :to="`/admin/events/${event.id}/participants`">
                      <UsersIcon class="h-4 w-4" />
                    </NuxtLink>
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontalIcon class="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { CalendarIcon, PlusIcon, PencilIcon, UsersIcon, MoreHorizontalIcon } from 'lucide-vue-next'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'

const { $dayjs } = useNuxtApp()
const client = useSupabaseClient()
const user = useSupabaseUser()

const events = ref<any[]>([])
const loading = ref(true)
const error = ref('')

// Format date using dayjs
const formatDate = (date: string, format = 'MMM D, YYYY') => {
  return $dayjs(date).format(format)
}

// Fetch events
const fetchEvents = async () => {
  if (!user.value) return
  
  loading.value = true
  error.value = ''
  
  try {
    // First get the user's profile
    const { data: profile } = await client
      .from('profiles')
      .select('id')
      .eq('auth_user_id', user.value.id)
      .single()
    
    if (!profile) {
      throw new Error('Profile not found')
    }
    
    // Then fetch events organized by this user
    const { data: eventsData, error: eventsError } = await client
      .from('events')
      .select('*')
      .eq('organizer_id', profile.id)
      .order('start_date', { ascending: true })
    
    if (eventsError) throw eventsError
    
    // For each event, count the participants
    const eventsWithCounts = await Promise.all((eventsData || []).map(async (event) => {
      // Count participants in all races for this event
      const { count, error: countError } = await client
        .from('participants')
        .select('*', { count: 'exact', head: true })
        .eq('ticket.race.event_id', event.id)
      
      if (countError) {
        console.error(`Error counting participants for event ${event.id}:`, countError)
        return { ...event, participant_count: 0 }
      }
      
      return { ...event, participant_count: count }
    }))
    
    events.value = eventsWithCounts
  } catch (err: any) {
    console.error('Error fetching events:', err)
    error.value = 'Failed to load events. Please try again.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchEvents()
})
</script>

<script>
// This is needed for layout
definePageMeta({
  layout: 'admin'
})
</script>
