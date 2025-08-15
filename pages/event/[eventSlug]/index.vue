<template>
  <div class="container mx-auto p-4 sm:p-6 lg:p-8">
    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin h-12 w-12 border-t-4 border-b-4 border-primary rounded-full"></div>
    </div>
    
    <div v-else-if="error" class="bg-destructive/20 text-destructive p-4 rounded-md">
      <p>{{ error }}</p>
      <Button @click="() => router.back()" class="mt-4">
        <ArrowLeftIcon class="mr-2 h-4 w-4" />
        Back
      </Button>
    </div>
    
    <div v-else>
      <!-- Registration Drawer -->
      <RaceRegistrationDrawer 
        v-model:open="isRegistrationDrawerOpen" 
        :race="selectedRace" 
        @added-to-cart="handleAddedToCart" 
      />
      
      <!-- Event Header Section -->
      <section class="mb-10">
        <div class="flex flex-col md:flex-row md:items-end gap-6 bg-muted p-6 rounded-lg">
          <div class="flex-shrink-0">
            <Avatar class="h-24 w-24 border-4 border-background shadow-lg">
              <AvatarImage :src="event.logo_url" :alt="event.name" />
              <AvatarFallback>{{ event.name.substring(0, 2).toUpperCase() }}</AvatarFallback>
            </Avatar>
          </div>
          
          <div class="flex-grow">
            <h1 class="text-3xl sm:text-4xl font-bold mb-2">{{ event.name }}</h1>
            <div class="flex flex-wrap items-center gap-4 text-muted-foreground">
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
          
          <Button 
            v-if="hasActiveRaces" 
            size="lg" 
            class="mt-4 md:mt-0" 
            @click="scrollToRaces"
          >
            Register
            <ChevronDownIcon class="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2">
          <!-- About Section -->
          <Card class="mb-8">
            <CardHeader>
              <CardTitle>About this event</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="prose max-w-none">
                <p class="whitespace-pre-line">{{ event.description || 'No description available.' }}</p>
              </div>
            </CardContent>
          </Card>

          <!-- Races Section -->
          <div id="races-section" class="mb-8">
            <h2 class="text-2xl font-semibold mb-4">Available Races</h2>
            <div v-if="races.length === 0" class="text-center py-8 border rounded-lg bg-muted/20">
              <p class="text-muted-foreground">No races are currently available for this event.</p>
            </div>
            
            <div v-else class="space-y-4">
              <Card v-for="race in races" :key="race.id" class="overflow-hidden transition-shadow hover:shadow-md">
                <div class="p-4 flex flex-col justify-between">
                  <div>
                    <div class="flex justify-between items-start mb-2">
                      <h3 class="font-bold text-lg">{{ race.name }}</h3>
                      <Badge variant="secondary">{{ formatPrice(race.price_cents, race.currency) }}</Badge>
                    </div>
                    
                    <div class="flex flex-wrap gap-2 text-sm text-muted-foreground mb-4">
                      <div class="flex items-center gap-2">
                        <CalendarIcon class="h-4 w-4" />
                        <span>{{ formatDate(race.date) }}</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <MoveRightIcon class="h-4 w-4" />
                        <span>{{ race.distance_km }} km</span>
                      </div>
                      <div v-if="race.elevation_gain" class="flex items-center gap-2">
                        <MountainIcon class="h-4 w-4" />
                        <span>{{ race.elevation_gain }}m D+</span>
                      </div>
                    </div>
                    
                    <p v-if="race.description" class="line-clamp-2 text-muted-foreground mb-4">
                      {{ race.description }}
                    </p>
                    
                    <!-- Registration status removed, we'll show tooltips on buttons instead -->
                  </div>
                  
                  <div class="flex gap-2">
                    <NuxtLink :to="`/event/${eventSlug}/race/${race.slug}`" class="flex-grow">
                      <Button variant="outline" class="w-full">
                        View race
                      </Button>
                    </NuxtLink>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div class="flex-grow">
                            <Button 
                              class="w-full" 
                              @click="race.register_state === 'open' ? openRegistrationDrawer(race) : null"
                              :disabled="race.register_state !== 'open'"
                            >
                              Register
                            </Button>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent v-if="race.register_state === 'not_open'">
                          Registration not yet open
                        </TooltipContent>
                        <TooltipContent v-else-if="race.register_state === 'closed'">
                          Registration is closed
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
        
        <div class="space-y-8">
          <!-- Practical Info Section -->
          <Card>
            <CardHeader>
              <CardTitle>Practical Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div v-if="event.location_map_url" class="mb-6">
                <h3 class="font-medium mb-2 flex items-center gap-2">
                  <MapPinIcon class="h-4 w-4" /> 
                  <span>Location</span>
                </h3>
                <p class="text-sm text-muted-foreground">{{ event.location }}</p>
              </div>
              
              <div v-if="event.practical_info?.access" class="mb-6">
                <h3 class="font-medium mb-2 flex items-center gap-2">
                  <CarIcon class="h-4 w-4" />
                  <span>How to get there</span>
                </h3>
                <p class="text-sm text-muted-foreground">{{ event.practical_info.access }}</p>
              </div>
              
              <div v-if="event.practical_info?.accommodation" class="mb-6">
                <h3 class="font-medium mb-2 flex items-center gap-2">
                  <HotelIcon class="h-4 w-4" />
                  <span>Accommodation</span>
                </h3>
                <p class="text-sm text-muted-foreground">{{ event.practical_info.accommodation }}</p>
              </div>
              
              <div v-if="event.practical_info?.contact" class="mb-6">
                <h3 class="font-medium mb-2 flex items-center gap-2">
                  <MailIcon class="h-4 w-4" />
                  <span>Contact</span>
                </h3>
                <p class="text-sm text-muted-foreground">{{ event.practical_info.contact }}</p>
              </div>
              
              <!-- Social Links -->
              <div class="border-t pt-4 mt-6">
                <h3 class="font-medium mb-3">Official Links</h3>
                <div class="flex flex-wrap gap-3">
                  <a v-if="event.website_url" :href="event.website_url" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      <GlobeIcon class="h-4 w-4 mr-2" />
                      Website
                    </Button>
                  </a>
                  <a v-if="event.facebook_url" :href="event.facebook_url" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      <FacebookIcon class="h-4 w-4 mr-2" />
                      Facebook
                    </Button>
                  </a>
                  <a v-if="event.instagram_url" :href="event.instagram_url" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      <InstagramIcon class="h-4 w-4 mr-2" />
                      Instagram
                    </Button>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <!-- Event Countdown -->
          <Card v-if="isEventUpcoming">
            <CardContent class="pt-6">
              <div class="text-center">
                <h3 class="font-medium mb-2">Event starts in</h3>
                <div class="grid grid-cols-4 gap-2 my-4">
                  <div class="flex flex-col items-center p-2 bg-muted rounded-md">
                    <span class="text-2xl font-bold">{{ countdown.days }}</span>
                    <span class="text-xs text-muted-foreground">Days</span>
                  </div>
                  <div class="flex flex-col items-center p-2 bg-muted rounded-md">
                    <span class="text-2xl font-bold">{{ countdown.hours }}</span>
                    <span class="text-xs text-muted-foreground">Hours</span>
                  </div>
                  <div class="flex flex-col items-center p-2 bg-muted rounded-md">
                    <span class="text-2xl font-bold">{{ countdown.minutes }}</span>
                    <span class="text-xs text-muted-foreground">Min</span>
                  </div>
                  <div class="flex flex-col items-center p-2 bg-muted rounded-md">
                    <span class="text-2xl font-bold">{{ countdown.seconds }}</span>
                    <span class="text-xs text-muted-foreground">Sec</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from '#imports'
import { useInterval } from '@vueuse/core'
import { 
  ArrowLeftIcon, 
  CalendarIcon, 
  CarIcon, 
  ChevronDownIcon,
  FacebookIcon, 
  GlobeIcon, 
  HotelIcon, 
  InstagramIcon, 
  MailIcon, 
  MapPinIcon, 
  MountainIcon,
  MoveRightIcon 
} from 'lucide-vue-next'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
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

// Countdown timer
const countdown = ref({
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0
})

// Computed properties
const hasActiveRaces = computed(() => {
  return races.value?.some(race => race.register_state === 'open') || false
})

const isEventUpcoming = computed(() => {
  if (!event.value?.start_date) return false
  return $dayjs(event.value.start_date).isAfter($dayjs())
})

// Format date
const formatDate = (date) => {
  return $dayjs(date).format('DD MMM YYYY')
}

// Format date range
const formatDateRange = (startDate, endDate) => {
  const start = $dayjs(startDate)
  const end = $dayjs(endDate)
  
  if (start.isSame(end, 'day')) {
    return `${start.format('DD MMM YYYY')}`
  }
  
  if (start.isSame(end, 'month')) {
    return `${start.format('DD')} - ${end.format('DD MMM YYYY')}`
  }
  
  if (start.isSame(end, 'year')) {
    return `${start.format('DD MMM')} - ${end.format('DD MMM YYYY')}`
  }
  
  return `${start.format('DD MMM YYYY')} - ${end.format('DD MMM YYYY')}`
}

// Format price
const formatPrice = (priceCents, currency = 'EUR') => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
  }).format(priceCents / 100)
}

// Update countdown timer
const updateCountdown = () => {
  if (!event.value?.start_date) return
  
  const now = $dayjs()
  const eventStart = $dayjs(event.value.start_date)
  const diff = eventStart.diff(now, 'second')
  
  if (diff <= 0) {
    countdown.value = { days: 0, hours: 0, minutes: 0, seconds: 0 }
    return
  }
  
  countdown.value = {
    days: Math.floor(diff / (60 * 60 * 24)),
    hours: Math.floor((diff % (60 * 60 * 24)) / (60 * 60)),
    minutes: Math.floor((diff % (60 * 60)) / 60),
    seconds: diff % 60
  }
}

// Setup countdown timer
const { counter, pause, resume } = useInterval(1000, { controls: true })

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
    if (!eventData) throw new Error('Événement introuvable')
    
    event.value = eventData
    
    // Fetch races for this event
    const { data: racesData, error: racesError } = await client
      .from('races')
      .select('*')
      .eq('event_id', event.value.id)
      .order('date', { ascending: true })
    
    if (racesError) throw racesError
    
    races.value = racesData || []
    
    // Start countdown timer if event is in the future
    if (isEventUpcoming.value) {
      updateCountdown()
      resume()
    }
  } catch (err) {
    console.error('Error fetching event data:', err)
    error.value = err.message || 'Impossible de charger les données de l\'événement'
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

// Scroll to races section
const scrollToRaces = () => {
  const racesSection = document.getElementById('races-section')
  if (racesSection) {
    racesSection.scrollIntoView({ behavior: 'smooth' })
  }
}

// Watch for changes to update the countdown
watch(counter, updateCountdown)

onMounted(() => {
  fetchEventData()
})

onBeforeUnmount(() => {
  pause()
})
</script>
