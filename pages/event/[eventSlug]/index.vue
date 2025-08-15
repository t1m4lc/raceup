<template>
  <div class="container mx-auto p-4 sm:p-6 lg:p-8">
    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin h-12 w-12 border-t-4 border-b-4 border-primary rounded-full"></div>
    </div>
    
    <div v-else-if="error" class="bg-destructive/20 text-destructive p-4 rounded-md">
      <p>{{ error }}</p>
      <Button @click="() => router.back()" class="mt-4">
        <ArrowLeftIcon class="mr-2 h-4 w-4" />
        Go Back
      </Button>
    </div>
    
    <div v-else>
      <!-- Cart is now in the default layout -->
      
      <!-- Registration Drawer -->
      <RaceRegistrationDrawer 
        v-model:open="isRegistrationDrawerOpen" 
        :race="selectedRace" 
        @added-to-cart="handleAddedToCart" 
      />
      <!-- Event Header -->
      <div class="mb-8">
        <div class="flex items-center gap-2 mb-2">
          <Button variant="outline" size="sm" @click="() => router.back()">
            <ArrowLeftIcon class="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>
        <h1 class="text-3xl sm:text-4xl font-bold">{{ event.name }}</h1>
        <div class="flex flex-wrap items-center gap-4 mt-2 text-muted-foreground">
          <div class="flex items-center gap-2">
            <CalendarIcon class="h-4 w-4" />
            <span>{{ formatDateRange(event.start_date, event.end_date) }}</span>
          </div>
          <div class="flex items-center gap-2">
            <MapPinIcon class="h-4 w-4" />
            <span>{{ event.location }}</span>
          </div>
        </div>
      </div>
      
      <!-- Event Description -->
      <Card class="mb-8">
        <CardHeader>
          <CardTitle>About this event</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="whitespace-pre-line">{{ event.description || 'No description available.' }}</p>
        </CardContent>
      </Card>
      
      <!-- Races List -->
      <div class="mb-8">
        <h2 class="text-2xl font-semibold mb-4">Available Races</h2>
        <div v-if="races.length === 0" class="text-center py-8 border rounded-lg bg-muted/20">
          <p class="text-muted-foreground">No races available for this event yet.</p>
        </div>
        
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card v-for="race in races" :key="race.id" class="overflow-hidden">
            <CardHeader>
              <CardTitle>{{ race.name }}</CardTitle>
              <CardDescription>{{ formatDate(race.date) }}</CardDescription>
            </CardHeader>
            
            <CardContent>
              <div class="space-y-2 mb-4">
                <p class="line-clamp-3 text-muted-foreground">
                  {{ race.description || 'No description available' }}
                </p>
              </div>
              
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <MoveRightIcon class="h-4 w-4 text-muted-foreground" />
                  <span>{{ race.distance_km }} km</span>
                </div>
                <div class="font-semibold">
                  {{ formatPrice(race.price_cents, race.currency) }}
                </div>
              </div>
            </CardContent>
            
            <CardFooter>
              <Button class="w-full" @click="openRegistrationDrawer(race)">
                Register Now
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from '#imports'
import { ArrowLeftIcon, CalendarIcon, MapPinIcon, MoveRightIcon } from 'lucide-vue-next'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
// CartSheet is now in the default layout
import RaceRegistrationDrawer from '@/components/cart/RaceRegistrationDrawer.vue'

const route = useRoute()
const router = useRouter()
const { $dayjs } = useNuxtApp()
const client = useSupabaseClient()

const eventSlug = computed(() => route.params.eventSlug)

const event = ref(null)
const races = ref([])
const loading = ref(true)
const error = ref('')
const isRegistrationDrawerOpen = ref(false)
const selectedRace = ref(null)

// Format date
const formatDate = (date) => {
  return $dayjs(date).format('MMM D, YYYY')
}

// Format date range
const formatDateRange = (startDate, endDate) => {
  const start = $dayjs(startDate)
  const end = $dayjs(endDate)
  
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

// Format price
const formatPrice = (priceCents, currency = 'EUR') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(priceCents / 100)
}

// Fetch event and races
const fetchEventData = async () => {
  loading.value = true
  error.value = ''
  
  try {
    // Fetch event details
    const { data: eventData, error: eventError } = await client
      .from('events')
      .select('*')
      .eq('slug', eventSlug.value)
      .single()
    
    if (eventError) throw eventError
    if (!eventData) throw new Error('Event not found')
    
    event.value = eventData
    
    // Fetch races for this event
    const { data: racesData, error: racesError } = await client
      .from('races')
      .select('*')
      .eq('event_id', event.value.id)
      .order('date', { ascending: true })
    
    if (racesError) throw racesError
    
    races.value = racesData || []
  } catch (err) {
    console.error('Error fetching event data:', err)
    error.value = err.message || 'Failed to load event'
  } finally {
    loading.value = false
  }
}

// Open registration drawer
const openRegistrationDrawer = (race) => {
  selectedRace.value = race
  isRegistrationDrawerOpen.value = true
}

// Handle added to cart event
const handleAddedToCart = () => {
  // You can add a toast notification here if desired
  isRegistrationDrawerOpen.value = false
}

onMounted(() => {
  fetchEventData()
})
</script>
