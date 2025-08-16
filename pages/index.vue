<template>
  <div class="container mx-auto p-4 sm:p-6 lg:p-8">
    <div class="mb-8 text-center">
      <h1 class="text-4xl font-bold">RaceUp</h1>
      <p class="text-xl text-muted-foreground">Find your next running challenge</p>
      
      <!-- Onboarding CTA -->
      <div class="mt-6 flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Button asChild class="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
          <NuxtLink to="/onboarding">
            Get Started - Create Your Profile 🚀
          </NuxtLink>
        </Button>
        
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
import { ref, onMounted } from 'vue'
import { CalendarIcon, MapPinIcon } from 'lucide-vue-next'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const dayjs = useDayjs()
const client = useSupabaseClient()

const events = ref([])
const loading = ref(true)
const error = ref('')

// Format date
const formatDate = (date) => {
  return dayjs(date).format('MMM D, YYYY')
}

// Format date range
const formatDateRange = (startDate, endDate) => {
  const start = dayjs(startDate)
  const end = dayjs(endDate)
  
  if (start.isSame(end, 'day')) {
    return `${start.format('MMM D, YYYY')}`
  }
  
  if (start.isSame(end, 'month')) {
    return `${start.format('MMM D')} - ${end.format('D, YYYY')}`
  }
  
  if (start.isSame(end, 'year')) {
    return `${start.format('MMM D')} - ${end.format('MMM D, YYYY')}`
  }
  
  return `${start.format('MMM D, YYYY')} - ${end.format('MMM D, YYYY')}`
}

// Fetch events
const fetchEvents = async () => {
  loading.value = true
  error.value = ''
  
  try {
    // Try the new simplified schema first
    let { data, error: err } = await client
      .from('events')
      .select('*')
      .order('start_date', { ascending: true })
      .gte('end_date', new Date().toISOString()) // Only upcoming events
    
    // If that fails, try the old complex schema
    if (err) {
      console.log('Trying old schema with event_editions...')
      const { data: editionsData, error: editionsErr } = await client
        .from('event_editions')
        .select(`
          id, name, description, start_date, end_date, location, slug,
          event_root:event_roots(
            organization:organizations(*)
          )
        `)
        .order('start_date', { ascending: true })
        .gte('end_date', new Date().toISOString())
      
      if (editionsErr) throw editionsErr
      
      // Transform the data to match expected format
      data = editionsData?.map(edition => ({
        id: edition.id,
        name: edition.name,
        description: edition.description,
        start_date: edition.start_date,
        end_date: edition.end_date,
        location: edition.location,
        slug: edition.slug
      })) || []
    }
    
    events.value = data || []
  } catch (err) {
    console.error('Error fetching events:', err)
    error.value = 'Failed to load events. Please check your database setup.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchEvents()
})
</script>