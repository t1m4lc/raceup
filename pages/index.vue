<template>
  <div class="container mx-auto p-4 sm:p-6 lg:p-8">
    <div class="mb-8 text-center">
      <h1 class="text-4xl font-bold">RaceUp</h1>
      <p class="text-xl text-muted-foreground">Find your next running challenge</p>
      
      <div class="mt-6 flex flex-col sm:flex-row gap-4 justify-center items-center">

        <Button asChild variant="outline">
          <NuxtLink to="/organizations">
            Browse Organizations
          </NuxtLink>
        </Button>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin h-12 w-12 border-t-4 border-b-4 border-primary rounded-full"></div>
    </div>
    
    <div v-else-if="error" class="bg-destructive/20 text-destructive p-4 rounded-md">
      <p>{{ error }}</p>
    </div>
    
    <div v-else-if="events.length === 0" class="text-center py-12">
      <h2 class="text-2xl font-semibold mb-4">No events found</h2>
      <p class="text-muted-foreground">Check back later for upcoming events.</p>
    </div>
    
    <div v-else>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card v-for="event in events" :key="event.id" class="overflow-hidden">
          <CardHeader>
            <CardTitle class="truncate">{{ event.name }}</CardTitle>
            <CardDescription>{{ formatDate(event.start_date) }}</CardDescription>
          </CardHeader>
          
          <CardContent>
            <p class="line-clamp-3 text-muted-foreground mb-4">
              {{ event.description || 'No description available' }}
            </p>
            
            <div class="flex items-center gap-2 mb-2">
              <MapPinIcon class="h-4 w-4 text-muted-foreground" />
              <span>{{ event.location }}</span>
            </div>
            
            <div class="flex items-center gap-2">
              <CalendarIcon class="h-4 w-4 text-muted-foreground" />
              <span>{{ formatDateRange(event.start_date, event.end_date) }}</span>
            </div>
          </CardContent>
          
          <CardFooter>
            <Button asChild class="w-full">
              <NuxtLink :to="`/event/${event.slug}`">
                View Event
              </NuxtLink>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { CalendarIcon, MapPinIcon } from 'lucide-vue-next'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// Use our new composables
const { formatDate, formatDateRange } = useDateFormatting()
const { handleError } = useApiError()

// Fetch upcoming events using useLazyAsyncData
const { data: events, pending: loading, error: fetchError } = await useLazyAsyncData(
  'upcoming-events',
  async () => {
    const client = useSupabaseClient()
    
    const { data, error } = await client
      .from('events')
      .select(`
        *,
        organization:organizations(*)
      `)
      .order('start_date', { ascending: true })
      .gte('end_date', new Date().toISOString()) // Only upcoming events
    
    if (error) throw error
    return data || []
  },
  {
    default: () => [],
    server: false // Client-side only due to Supabase client
  }
)

// Handle errors reactively
const error = computed(() => {
  if (fetchError.value) {
    return handleError(fetchError.value, 'Loading events')
  }
  return null
})
</script>