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
        :race="race" 
        @added-to-cart="handleAddedToCart" 
      />

      <!-- Header Navigation -->
      <div class="mb-6">
        <div class="flex flex-wrap gap-2 mb-4">
          <NuxtLink :to="`/event/${eventSlug}`">
            <Button variant="outline" size="sm">
              <ArrowLeftIcon class="h-4 w-4 mr-1" />
              Back to event
            </Button>
          </NuxtLink>

          <div class="flex-grow"></div>
          
          <!-- Registration button with tooltip -->
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button 
                    @click="race.register_state === 'open' ? openRegistrationDrawer() : null"
                    :disabled="race.register_state !== 'open'"
                    size="sm"
                  >
                    Register
                    <ArrowRightIcon class="ml-2 h-4 w-4" />
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

      <!-- Race Header -->
      <div class="mb-8 bg-muted p-6 rounded-lg">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 class="text-3xl sm:text-4xl font-bold mb-2">{{ race.name }}</h1>
            
            <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground">
              <div class="flex items-center gap-2">
                <CalendarIcon class="h-4 w-4" />
                <span>{{ formatDate(race.date) }}</span>
              </div>
              <div class="flex items-center gap-2">
                <MapPinIcon class="h-4 w-4" />
                <span>{{ event?.location }}</span>
              </div>
            </div>
          </div>
          
          <div class="flex flex-wrap items-center gap-3">
            <Badge variant="outline" class="text-base font-medium px-3 py-1.5">
              {{ formatPrice(race.price_cents, race.currency) }}
            </Badge>
            
            <Badge variant="secondary" class="text-base font-medium px-3 py-1.5">
              {{ race.distance_km }} km
            </Badge>
            
            <Badge 
              v-if="remainingSpots !== null" 
              :variant="remainingSpots < 10 ? 'destructive' : 'outline'"
              class="text-base font-medium px-3 py-1.5"
            >
              {{ remainingSpots }} {{ remainingSpots === 1 ? 'spot' : 'spots' }} left
            </Badge>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left Column (2/3) -->
        <div class="lg:col-span-2">
          <Tabs default-value="infos" class="mb-8">
            <TabsList class="grid w-full grid-cols-3">
              <TabsTrigger value="infos">Information</TabsTrigger>
              <TabsTrigger value="parcours">Course</TabsTrigger>
              <TabsTrigger value="reglement">Rules</TabsTrigger>
            </TabsList>
            
            <!-- Tab Content: Informations -->
            <TabsContent value="infos" class="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>About this race</CardTitle>
                </CardHeader>
                <CardContent>
                  <p class="whitespace-pre-line">{{ race.description || 'No description available.' }}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Technical details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div class="flex flex-col items-center p-4 bg-muted rounded-lg">
                      <RulerIcon class="h-6 w-6 mb-2 text-primary" />
                      <div class="text-sm text-muted-foreground">Distance</div>
                      <div class="font-bold text-lg">{{ race.distance_km }} km</div>
                    </div>
                    
                    <div v-if="race.elevation_gain" class="flex flex-col items-center p-4 bg-muted rounded-lg">
                      <MountainIcon class="h-6 w-6 mb-2 text-primary" />
                      <div class="text-sm text-muted-foreground">Elevation gain</div>
                      <div class="font-bold text-lg">{{ race.elevation_gain }} m</div>
                    </div>
                    
                    <div v-if="race.aid_stations" class="flex flex-col items-center p-4 bg-muted rounded-lg">
                      <CupSodaIcon class="h-6 w-6 mb-2 text-primary" />
                      <div class="text-sm text-muted-foreground">Aid stations</div>
                      <div class="font-bold text-lg">{{ race.aid_stations }}</div>
                    </div>
                    
                    <div v-if="race.max_participants" class="flex flex-col items-center p-4 bg-muted rounded-lg">
                      <UsersIcon class="h-6 w-6 mb-2 text-primary" />
                      <div class="text-sm text-muted-foreground">Max participants</div>
                      <div class="font-bold text-lg">{{ race.max_participants }}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <!-- Tab Content: Course Map -->
            <TabsContent value="parcours" class="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Course Map</CardTitle>
                </CardHeader>
                <CardContent>
                  <div v-if="race.route_map_url" class="rounded-lg overflow-hidden border">
                    <AspectRatio :ratio="16/9">
                      <img 
                        :src="race.route_map_url" 
                        :alt="'Course map for ' + race.name" 
                        class="w-full h-full object-cover"
                      />
                    </AspectRatio>
                  </div>
                  <div v-else class="bg-muted flex items-center justify-center rounded-lg h-64">
                    <p class="text-muted-foreground">Course map not available</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card v-if="race.aid_stations">
                <CardHeader>
                  <CardTitle>Aid Stations</CardTitle>
                </CardHeader>
                <CardContent>
                  <p class="mb-4">This race has {{ race.aid_stations }} aid station{{ race.aid_stations > 1 ? 's' : '' }}.</p>
                  
                  <!-- Placeholder for detailed aid station info - would need to be added to schema -->
                  <p class="text-muted-foreground">Check the race rules section for details about aid stations.</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <!-- Tab Content: Rules -->
            <TabsContent value="reglement" class="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Race Rules</CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert class="mb-4">
                    <AlertCircleIcon class="h-4 w-4" />
                    <AlertTitle>Important</AlertTitle>
                    <AlertDescription>
                      A valid medical certificate is required to participate in this race.
                    </AlertDescription>
                  </Alert>
                  
                  <div class="prose max-w-none" v-if="race.rules">
                    <div v-html="formatRules(race.rules)"></div>
                  </div>
                  <div v-else>
                    <p>Complete rules will be available soon.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <!-- Right Column (1/3) -->
        <div>
          <!-- Registration Card -->
          <Card class="mb-6">
            <CardHeader>
              <CardTitle>Registration</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="flex justify-between items-center mb-4">
                <span>Registration fee</span>
                <span class="font-bold">{{ formatPrice(race.price_cents, race.currency) }}</span>
              </div>
              
              <div v-if="remainingSpots !== null" class="mb-4">
                <Progress :value="participationPercentage" class="mb-2" />
                <div class="flex justify-between text-sm text-muted-foreground">
                  <span>{{ race.max_participants - remainingSpots }} registered</span>
                  <span>{{ remainingSpots }} spot{{ remainingSpots !== 1 ? 's' : '' }} left</span>
                </div>
              </div>
              
              <Alert v-if="race.registration_open === false" variant="destructive" class="mb-4">
                <BanIcon class="h-4 w-4" />
                <AlertTitle>Registration closed</AlertTitle>
                <AlertDescription>
                  Registration for this race is no longer open.
                </AlertDescription>
              </Alert>
              
              <Alert v-else-if="remainingSpots !== null && remainingSpots <= 0" variant="destructive" class="mb-4">
                <BanIcon class="h-4 w-4" />
                <AlertTitle>Full</AlertTitle>
                <AlertDescription>
                  This race has reached its maximum participant capacity.
                </AlertDescription>
              </Alert>
              
              <div class="space-y-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Button 
                          class="w-full" 
                          size="lg" 
                          :disabled="race.register_state !== 'open' || (remainingSpots !== null && remainingSpots <= 0)"
                          @click="openRegistrationDrawer"
                        >
                          Register now
                        </Button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent v-if="race.register_state === 'not_open'">
                      Registration not yet open
                    </TooltipContent>
                    <TooltipContent v-else-if="race.register_state === 'closed'">
                      Registration is closed
                    </TooltipContent>
                    <TooltipContent v-else-if="remainingSpots !== null && remainingSpots <= 0">
                      Race is full
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <div class="text-sm text-muted-foreground">
                  <p class="mb-2">Registration includes:</p>
                  <ul class="space-y-1">
                    <li class="flex items-center gap-2">
                      <CheckIcon class="h-4 w-4 text-primary" />
                      <span>Custom race bib</span>
                    </li>
                    <li class="flex items-center gap-2">
                      <CheckIcon class="h-4 w-4 text-primary" />
                      <span>Timing chip</span>
                    </li>
                    <li class="flex items-center gap-2">
                      <CheckIcon class="h-4 w-4 text-primary" />
                      <span>Aid stations</span>
                    </li>
                    <li class="flex items-center gap-2">
                      <CheckIcon class="h-4 w-4 text-primary" />
                      <span>Finisher medal</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <!-- Event Info Card -->
          <Card>
            <CardHeader>
              <CardTitle>About the event</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="space-y-4">
                <div class="flex gap-4 items-center">
                  <Avatar class="h-12 w-12 border border-border">
                    <AvatarImage :src="event?.logo_url" />
                    <AvatarFallback>{{ event?.name?.substring(0, 2).toUpperCase() || 'EV' }}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 class="font-medium">{{ event?.name }}</h3>
                    <p class="text-sm text-muted-foreground">{{ formatDateRange(event?.start_date, event?.end_date) }}</p>
                  </div>
                </div>
                
                <div class="flex items-center gap-2">
                  <MapPinIcon class="h-4 w-4 text-muted-foreground" />
                  <span class="text-sm">{{ event?.location }}</span>
                </div>
                
                <div class="pt-2">
                  <NuxtLink :to="`/event/${eventSlug}`">
                    <Button variant="outline" class="w-full">
                      View all races
                      <ArrowRightIcon class="ml-2 h-4 w-4" />
                    </Button>
                  </NuxtLink>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from '#imports'
import { 
  AlertCircleIcon,
  ArrowLeftIcon, 
  ArrowRightIcon,
  BanIcon,
  CalendarIcon, 
  CheckIcon,
  ClockIcon,
  CupSodaIcon,
  MapPinIcon, 
  MountainIcon,
  RulerIcon,
  UsersIcon,
  XIcon
} from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import RaceRegistrationDrawer from '@/components/cart/RaceRegistrationDrawer.vue'

const route = useRoute()
const router = useRouter()
const { $dayjs } = useNuxtApp()
const client = useSupabaseClient()

const eventSlug = computed(() => route.params.eventSlug as string)
const raceSlug = computed(() => route.params.raceSlug as string)

const event = ref<any>(null)
const race = ref<any>(null)
const loading = ref(true)
const error = ref('')
const remainingSpots = ref<number | null>(null)
const isRegistrationDrawerOpen = ref(false)

// Computed properties
const participationPercentage = computed(() => {
  if (!race.value?.max_participants || remainingSpots.value === null) return 0
  const taken = race.value.max_participants - remainingSpots.value
  return Math.floor((taken / race.value.max_participants) * 100)
})

// Format date
const formatDate = (date: string) => {
  return $dayjs(date).format('DD MMMM YYYY')
}

// Format date range
const formatDateRange = (startDate?: string, endDate?: string) => {
  if (!startDate || !endDate) return ''
  
  const start = $dayjs(startDate)
  const end = $dayjs(endDate)
  
  if (start.isSame(end, 'day')) {
    return `${start.format('DD MMMM YYYY')}`
  }
  
  if (start.isSame(end, 'month')) {
    return `${start.format('DD')} - ${end.format('DD MMMM YYYY')}`
  }
  
  if (start.isSame(end, 'year')) {
    return `${start.format('DD MMMM')} - ${end.format('DD MMMM YYYY')}`
  }
  
  return `${start.format('DD MMMM YYYY')} - ${end.format('DD MMMM YYYY')}`
}

// Format price
const formatPrice = (priceCents: number, currency: string = 'EUR') => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
  }).format(priceCents / 100)
}

// Format rules (convert newlines to HTML)
const formatRules = (rules?: string): string => {
  if (!rules) return ''
  return rules.replace(/\n/g, '<br>')
}

// Fetch race and event data
const fetchRaceData = async () => {
  loading.value = true
  error.value = ''
  
  try {
    // Fetch race details
    const { data: raceData, error: raceError } = await client
      .from('races')
      .select('*')
      .eq('slug', raceSlug.value)
      .single()
    
    if (raceError) throw raceError
    if (!raceData) throw new Error('Race not found')
    
    race.value = raceData
    
    // Fetch event details
    const { data: eventData, error: eventError } = await client
      .from('events')
      .select('*')
      .eq('id', race.value.event_id)
      .single()
    
    if (eventError) throw eventError
    if (!eventData) throw new Error('Event not found')
    
    event.value = eventData as any // Type assertion to bypass TypeScript error
    
    // Check if event slug matches
    if (event.value.slug !== eventSlug.value) {
      throw new Error('This race is not part of this event')
    }
    
    // Calculate remaining spots if max_participants is set
    if (race.value.max_participants) {
      // Count existing tickets for this race
      const { count, error: countError } = await client
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('race_id', race.value.id)
        .eq('status', 'paid')
      
      if (!countError) {
        remainingSpots.value = race.value.max_participants - (count || 0)
      }
    }
    
  } catch (err: any) {
    console.error('Error fetching race data:', err)
    error.value = err.message || 'Impossible de charger les données de la course'
  } finally {
    loading.value = false
  }
}

// Open registration drawer
const openRegistrationDrawer = () => {
  isRegistrationDrawerOpen.value = true
}

// Handle added to cart event
const handleAddedToCart = () => {
  isRegistrationDrawerOpen.value = false
}

onMounted(() => {
  fetchRaceData()
})
</script>
