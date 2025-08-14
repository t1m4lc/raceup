<template>
  <div class="container mx-auto p-4 max-w-7xl">
    <div class="mb-8">
      <h1 class="text-3xl font-bold tracking-tight">My Tickets</h1>
      <p class="text-muted-foreground">View and manage your race registrations</p>
    </div>

    <div v-if="loading" class="flex justify-center my-12">
      <div class="animate-spin h-12 w-12 border-t-4 border-b-4 border-primary rounded-full"></div>
    </div>
    
    <div v-else-if="error" class="bg-destructive/20 p-4 rounded-md text-destructive mb-4">
      {{ error }}
    </div>
    
    <div v-else-if="tickets.length === 0" class="text-center my-12">
      <InboxIcon class="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 class="mt-4 text-lg font-medium">No tickets yet</h3>
      <p class="text-muted-foreground mt-2 mb-4">You haven't registered for any races yet.</p>
      <Button asChild>
        <NuxtLink to="/">Explore Races</NuxtLink>
      </Button>
    </div>
    
    <div v-else>
      <div class="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Race</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Participants</TableHead>
              <TableHead>Status</TableHead>
              <TableHead class="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="ticket in tickets" :key="ticket.id">
              <TableCell>{{ ticket.race.event.name }}</TableCell>
              <TableCell>{{ ticket.race.name }}</TableCell>
              <TableCell>{{ formatDate(ticket.race.date) }}</TableCell>
              <TableCell>{{ ticket.participants.length }}</TableCell>
              <TableCell>
                <Badge :variant="getStatusVariant(ticket.status)">
                  {{ ticket.status }}
                </Badge>
              </TableCell>
              <TableCell class="text-right">
                <Button variant="ghost" asChild>
                  <NuxtLink :to="`/tickets/${ticket.id}`">
                    <EyeIcon class="h-4 w-4 mr-2" />
                    View
                  </NuxtLink>
                </Button>
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
import { InboxIcon, EyeIcon } from 'lucide-vue-next'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const { $dayjs } = useNuxtApp()
const client = useSupabaseClient()
const user = useSupabaseUser()

const tickets = ref<any[]>([])
const loading = ref(true)
const error = ref('')

// Format date using dayjs
const formatDate = (date: string, format = 'MMM D, YYYY') => {
  return $dayjs(date).format(format)
}

// Get badge variant based on status
const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'paid':
      return 'default'
    case 'pending':
      return 'secondary'
    case 'canceled':
    case 'refunded':
      return 'destructive'
    default:
      return 'outline'
  }
}

// Fetch tickets
const fetchTickets = async () => {
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
    
    // Then fetch tickets with that profile ID
    const { data, error: fetchError } = await client
      .from('tickets')
      .select(`
        *,
        race:races(
          *,
          event:events(*)
        ),
        participants(*)
      `)
      .eq('purchaser_id', profile.id)
      .order('created_at', { ascending: false })
    
    if (fetchError) throw fetchError
    
    tickets.value = data || []
  } catch (err: any) {
    console.error('Error fetching tickets:', err)
    error.value = 'Failed to load tickets. Please try again.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTickets()
})
</script>
