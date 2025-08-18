<template>
  <div class="container max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">My Tickets</h1>
      <p class="text-muted-foreground">View and manage your race registrations</p>
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="py-12">
      <Alert variant="destructive">
        <AlertTriangleIcon class="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load your tickets. Please try again later.
        </AlertDescription>
      </Alert>
    </div>

    <!-- Empty State -->
    <div v-else-if="!tickets || tickets.length === 0" class="py-16 flex flex-col items-center justify-center">
      <TicketIcon class="h-12 w-12 text-muted-foreground mb-4" />
      <p class="text-xl font-medium mb-2">No tickets found</p>
      <p class="text-muted-foreground mb-6">Register for a race to see your tickets here</p>
      <Button asChild>
        <NuxtLink to="/">Browse Events</NuxtLink>
      </Button>
    </div>

    <!-- Tickets List -->
    <div v-else class="space-y-6">
      <!-- Filter tabs -->
      <Tabs :default-value="activeFilter" @update:model-value="activeFilter = $event">
        <TabsList>
          <TabsTrigger value="all">All Tickets</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past Events</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" class="mt-6">
          <TicketsList :tickets="filteredTickets" />
        </TabsContent>
        
        <TabsContent value="upcoming" class="mt-6">
          <TicketsList :tickets="upcomingTickets" />
        </TabsContent>
        
        <TabsContent value="past" class="mt-6">
          <TicketsList :tickets="pastTickets" />
        </TabsContent>
      </Tabs>
    </div>

    <!-- Ticket Detail Modal -->
    <TicketDetailModal 
      :open="!!selectedTicket"
      :ticket="selectedTicket"
      @update:open="selectedTicket = $event ? selectedTicket : null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertTriangleIcon, TicketIcon } from 'lucide-vue-next'
import TicketsList from '@/components/tickets/TicketsList.vue'
import TicketDetailModal from '@/components/tickets/TicketDetailModal.vue'

// Types
interface IndividualTicket {
  id: string
  ticket_number: string
  qr_code_data: string
  status: string
  checked_in_at: string | null
  medical_validated: boolean
  participant: {
    id: string
    first_name: string
    last_name: string
    gender: string
    birthdate: string
    certificate_url: string | null
    bib_number: string | null
  }
  ticket: {
    id: string
    race: {
      id: string
      name: string
      distance_km: number
      start_time: string
      event: {
        id: string
        name: string
        location: string
        start_date: string
        end_date: string
      }
    }
  }
}

definePageMeta({
  middleware: ['auth']
})

const client = useSupabaseClient()
const user = useSupabaseUser()
const activeFilter = ref('all')
const selectedTicket = ref<IndividualTicket | null>(null)

// Fetch user tickets
const { data: tickets, pending, error, refresh } = await useLazyAsyncData('user-tickets', async () => {
  if (!user.value) return []

  const { data, error } = await client
    .from('individual_tickets')
    .select(`
      id,
      ticket_number,
      qr_code_data,
      status,
      checked_in_at,
      medical_validated,
      participant:participants(
        id,
        first_name,
        last_name,
        gender,
        birthdate,
        certificate_url,
        bib_number
      ),
      ticket:tickets(
        id,
        race:races(
          id,
          name,
          distance_km,
          start_time,
          event:events(
            id,
            name,
            location,
            start_date,
            end_date
          )
        )
      )
    `)
    .or(`linked_user_id.eq.${user.value.id},ticket.buyer_id.eq.${user.value.id}`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching tickets:', error)
    throw error
  }

  return data as IndividualTicket[]
})

// Computed filtered tickets
const filteredTickets = computed(() => tickets.value || [])

const upcomingTickets = computed(() => {
  const now = new Date()
  return filteredTickets.value.filter(ticket => 
    new Date(ticket.ticket.race.start_time) > now
  )
})

const pastTickets = computed(() => {
  const now = new Date()
  return filteredTickets.value.filter(ticket => 
    new Date(ticket.ticket.race.start_time) <= now
  )
})

// Watch for user changes
watch(user, () => {
  if (user.value) {
    refresh()
  }
})

// Expose data for child components
provide('selectTicket', (ticket: IndividualTicket) => {
  selectedTicket.value = ticket
})
</script>
