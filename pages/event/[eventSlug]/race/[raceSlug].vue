<template>
  <div class="container max-w-4xl mx-auto p-4">
    <div v-if="loading" class="flex items-center justify-center h-64">
      <div class="animate-spin h-12 w-12 border-t-4 border-b-4 border-primary rounded-full"></div>
    </div>

    <div v-else-if="error" class="bg-destructive/20 text-destructive p-4 rounded-md">
      <p>{{ error }}</p>
    </div>

    <div v-else>
      <!-- Race Details Card -->
      <Card class="mb-8">
        <CardHeader>
          <CardTitle>{{ race.name }}</CardTitle>
          <CardDescription>
            <div class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <CalendarIcon class="h-4 w-4 text-muted-foreground" />
                <span>{{ formatDate(race.date) }}</span>
              </div>
              <div class="flex items-center gap-2">
                <MapPinIcon class="h-4 w-4 text-muted-foreground" />
                <span>{{ race.event.location }}</span>
              </div>
              <div class="flex items-center gap-2">
                <MoveRightIcon class="h-4 w-4 text-muted-foreground" />
                <span>{{ race.distance_km }} kilometers</span>
              </div>
              <div class="flex items-center gap-2">
                <TagIcon class="h-4 w-4 text-muted-foreground" />
                <span>{{ formatPrice(race.price_cents, race.currency) }}</span>
              </div>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p class="text-muted-foreground">{{ race.description }}</p>
        </CardContent>
      </Card>

      <!-- Registration Form -->
      <Card>
        <CardHeader>
          <CardTitle>Registration</CardTitle>
          <CardDescription>
            Enter participant details below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form @submit.prevent="submitForm">
            <!-- Number of participants -->
            <div class="mb-6">
              <Label for="participantCount">Number of participants</Label>
              <Input 
                id="participantCount" 
                type="number" 
                min="1" 
                max="10" 
                v-model="participantCount"
                class="w-full"
                @change="updateParticipantForms" 
              />
            </div>

            <!-- Dynamic participant forms -->
            <div v-for="(participant, index) in participants" :key="index" class="mb-8">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-medium">Participant {{ index + 1 }}</h3>
                <Button 
                  v-if="index > 0" 
                  variant="outline" 
                  size="sm" 
                  type="button"
                  @click="removeParticipant(index)"
                >
                  <TrashIcon class="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>

              <!-- Name -->
              <div class="mb-4">
                <Label :for="`name-${index}`">Full Name</Label>
                <Input 
                  :id="`name-${index}`" 
                  v-model="participant.full_name" 
                  placeholder="John Doe" 
                  required 
                />
              </div>

              <!-- Birthdate -->
              <div class="mb-4">
                <Label :for="`birthdate-${index}`">Birthdate</Label>
                <Popover>
                  <PopoverTrigger as-child>
                    <Button
                      variant="outline"
                      :class="[
                        'w-full justify-start text-left font-normal',
                        !participant.birthdate && 'text-muted-foreground'
                      ]"
                    >
                      <CalendarIcon class="mr-2 h-4 w-4" />
                      {{ participant.birthdate ? formatDate(participant.birthdate, 'YYYY-MM-DD') : 'Select date' }}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent class="w-auto p-0">
                    <Calendar
                      mode="single"
                      v-model="participant.birthdate"
                      :disabled-date="(date) => date > new Date()"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <!-- Gender -->
              <div class="mb-4">
                <Label :for="`gender-${index}`">Gender</Label>
                <Select v-model="participant.gender">
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <!-- Certificate Upload -->
              <div class="mb-4">
                <Label :for="`certificate-${index}`">Medical Certificate</Label>
                <div class="flex items-center gap-3 mb-2">
                  <Input 
                    :id="`certificate-${index}`" 
                    type="file" 
                    accept=".pdf,.jpg,.jpeg,.png" 
                    @change="handleFileUpload($event, index)" 
                  />
                </div>
                <p class="text-xs text-muted-foreground">
                  Upload a medical certificate or health declaration (PDF, JPEG, PNG)
                </p>
                <div v-if="participant.certificateUploading" class="mt-2 flex items-center gap-2">
                  <div class="animate-spin h-4 w-4 border-t-2 border-b-2 border-primary rounded-full"></div>
                  <span class="text-xs">Uploading...</span>
                </div>
                <div v-else-if="participant.certificate_url" class="mt-2 flex items-center gap-2">
                  <CheckCircleIcon class="h-4 w-4 text-green-500" />
                  <span class="text-xs">Certificate uploaded</span>
                </div>
              </div>
            </div>

            <!-- Summary -->
            <div class="border-t border-border pt-4 mt-8">
              <div class="flex justify-between mb-2">
                <span>Price per participant</span>
                <span>{{ formatPrice(race.price_cents, race.currency) }}</span>
              </div>
              <div class="flex justify-between mb-2 font-bold">
                <span>Total</span>
                <span>{{ formatPrice(race.price_cents * participants.length, race.currency) }}</span>
              </div>
            </div>

            <!-- Submit button -->
            <div class="mt-6">
              <Button 
                type="submit" 
                class="w-full" 
                :disabled="isSubmitting"
              >
                <span v-if="isSubmitting">
                  <div class="animate-spin h-4 w-4 border-t-2 border-b-2 border-primary-foreground rounded-full mr-2"></div>
                  Processing...
                </span>
                <span v-else>
                  Continue to Payment
                </span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, navigateTo } from '#imports'
import { 
  CalendarIcon, 
  MapPinIcon, 
  MoveRightIcon, 
  TagIcon, 
  TrashIcon,
  CheckCircleIcon
} from 'lucide-vue-next'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'

const route = useRoute()
const { $dayjs } = useNuxtApp()
const client = useSupabaseClient()

const eventSlug = computed(() => route.params.eventSlug as string)
const raceSlug = computed(() => route.params.raceSlug as string)

const race = ref<any>(null)
const loading = ref(true)
const error = ref('')
const participantCount = ref(1)
const participants = ref<any[]>([])
const isSubmitting = ref(false)

// Format date using dayjs
const formatDate = (date: string, format = 'MMM D, YYYY') => {
  return $dayjs(date).format(format)
}

// Format price to currency
const formatPrice = (priceCents: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'EUR',
  }).format(priceCents / 100)
}

// Initialize participant forms
const updateParticipantForms = () => {
  const count = parseInt(participantCount.value.toString())
  
  if (count < participants.value.length) {
    // Remove excess participants
    participants.value = participants.value.slice(0, count)
  } else {
    // Add new participants
    while (participants.value.length < count) {
      participants.value.push({
        full_name: '', // Updated to use full_name instead of fullname
        birthdate: '',
        gender: '',
        certificate_url: '',
        certificateUploading: false
      })
    }
  }
}

// Remove a participant
const removeParticipant = (index: number) => {
  participants.value.splice(index, 1)
  participantCount.value = participants.value.length
}

// Handle file upload
const handleFileUpload = async (event: Event, index: number) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  
  if (!file) return
  
  participants.value[index].certificateUploading = true
  
  try {
    const filename = `${Date.now()}_${file.name}`
    const { data, error } = await client.storage
      .from('certificates')
      .upload(`participants/${filename}`, file)
    
    if (error) {
      throw error
    }
    
    const publicURL = client.storage
      .from('certificates')
      .getPublicUrl(`participants/${filename}`).data.publicUrl
    
    participants.value[index].certificate_url = publicURL
  } catch (err: any) {
    console.error('Error uploading file:', err)
    alert(`File upload failed: ${err.message}`)
  } finally {
    participants.value[index].certificateUploading = false
  }
}

// Submit form
const submitForm = async () => {
  // Validate form
  for (const p of participants.value) {
    if (!p.full_name || !p.birthdate || !p.gender) {
      alert('Please complete all participant details')
      return
    }
  }
  
  isSubmitting.value = true
  
  try {
    // Call the checkout API
    const response = await $fetch(`/api/races/${raceSlug.value}/checkout`, {
      method: 'POST',
      body: { participants: participants.value }
    })
    
    // Store the client secret and navigate to payment page
    localStorage.setItem('stripeClientSecret', response.clientSecret)
    localStorage.setItem('stripeTicketId', response.ticketId)
    
    // Navigate to the payment confirmation page
    navigateTo(`/payment/confirmation/${response.ticketId}`)
  } catch (err: any) {
    console.error('Checkout error:', err)
    error.value = err.message || 'Failed to process checkout. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

// Fetch race data
const fetchRace = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const { data, error: err } = await client
      .from('races')
      .select(`
        *,
        event:events(*)
      `)
      .eq('slug', raceSlug.value)
      .single()
    
    if (err) throw err
    if (!data) throw new Error('Race not found')
    
    race.value = data
  } catch (err: any) {
    console.error('Error fetching race:', err)
    error.value = 'Failed to load race details'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchRace()
  updateParticipantForms()
})
</script>
