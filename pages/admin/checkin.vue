<template>
  <div>
    <div class="flex items-center justify-between space-y-2 mb-6">
      <div>
        <h2 class="text-3xl font-bold tracking-tight">Event Check-in</h2>
        <p class="text-muted-foreground">
          Scan QR codes to check in participants
        </p>
      </div>
      
      <!-- Event Selection -->
      <div class="min-w-[250px]">
        <Select v-model="selectedEventId" @update:model-value="loadEventRaces">
          <SelectTrigger>
            <SelectValue placeholder="Select event" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem 
              v-for="event in events" 
              :key="event.id" 
              :value="event.id"
            >
              {{ event.name }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- QR Scanner Section -->
      <Card>
        <CardHeader>
          <CardTitle>QR Code Scanner</CardTitle>
          <CardDescription>
            Use your device camera to scan participant QR codes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div v-if="!isCameraStarted" class="flex flex-col items-center justify-center gap-4 p-8">
            <div class="rounded-full bg-muted p-3">
              <CameraIcon class="h-8 w-8" />
            </div>
            <div class="text-center">
              <p class="mb-2">Camera access required for QR code scanning</p>
              <Button @click="startCamera">
                Start Camera
              </Button>
            </div>
          </div>
          <div v-else>
            <div class="relative aspect-video bg-muted rounded-md mb-4 overflow-hidden">
              <video 
                ref="videoRef" 
                class="w-full h-full object-cover"
                autoplay 
                playsinline
              ></video>
              <div class="absolute inset-0 border-2 border-dashed border-primary/50 m-8 pointer-events-none"></div>
            </div>
            <div class="flex items-center justify-between">
              <p class="text-sm text-muted-foreground">
                Position the QR code within the frame
              </p>
              <Button variant="outline" size="sm" @click="stopCamera">
                <XIcon class="h-4 w-4 mr-2" />
                Stop Camera
              </Button>
            </div>
          </div>
          
          <!-- Manual Entry -->
          <div class="mt-4 pt-4 border-t">
            <Label for="manual-ticket">Manual Ticket Number Entry</Label>
            <div class="flex gap-2 mt-2">
              <Input 
                id="manual-ticket"
                v-model="manualTicketNumber"
                placeholder="Enter ticket number (e.g., TK123456)"
                @keyup.enter="validateManualTicket"
              />
              <Button @click="validateManualTicket" :disabled="!manualTicketNumber.trim()">
                Validate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Validation Panel -->
      <Card>
        <CardHeader>
          <CardTitle>Participant Validation</CardTitle>
          <CardDescription>
            Validate participant details and check-in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div v-if="!currentTicket" class="flex flex-col items-center justify-center gap-4 p-8 text-center">
            <QrCodeIcon class="h-12 w-12 text-muted-foreground" />
            <p class="text-muted-foreground">Scan a QR code or enter a ticket number to begin validation</p>
          </div>
          
          <div v-else class="space-y-4">
            <!-- Participant Info -->
            <div class="p-4 bg-muted/50 rounded-lg">
              <h3 class="font-semibold mb-2">{{ currentTicket.participant.full_name }}</h3>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span class="text-muted-foreground">Ticket:</span>
                  <span class="font-mono ml-1">#{{ currentTicket.ticket_number }}</span>
                </div>
                <div>
                  <span class="text-muted-foreground">Gender:</span>
                  <span class="capitalize ml-1">{{ currentTicket.participant.gender }}</span>
                </div>
                <div>
                  <span class="text-muted-foreground">Age:</span>
                  <span class="ml-1">{{ calculateAge(currentTicket.participant.birthdate) }}</span>
                </div>
                <div>
                  <span class="text-muted-foreground">Race:</span>
                  <span class="ml-1">{{ currentTicket.ticket.race.name }}</span>
                </div>
              </div>
            </div>
            
            <!-- Status Checks -->
            <div class="space-y-3">
              <div class="flex items-center justify-between p-3 border rounded-lg">
                <div class="flex items-center gap-2">
                  <div :class="currentTicket.status === 'valid' ? 'text-green-600' : 'text-red-600'">
                    <CheckCircle2Icon v-if="currentTicket.status === 'valid'" class="h-5 w-5" />
                    <XCircleIcon v-else class="h-5 w-5" />
                  </div>
                  <span class="font-medium">Ticket Status</span>
                </div>
                <Badge :variant="currentTicket.status === 'valid' ? 'default' : 'destructive'">
                  {{ currentTicket.status }}
                </Badge>
              </div>
              
              <div class="flex items-center justify-between p-3 border rounded-lg">
                <div class="flex items-center gap-2">
                  <div :class="currentTicket.participant.certificate_url ? 'text-green-600' : 'text-orange-500'">
                    <CheckCircle2Icon v-if="currentTicket.participant.certificate_url" class="h-5 w-5" />
                    <AlertCircleIcon v-else class="h-5 w-5" />
                  </div>
                  <span class="font-medium">Medical Certificate</span>
                </div>
                <div class="flex items-center gap-2">
                  <Switch 
                    :checked="currentTicket.medical_validated"
                    @update:checked="updateMedicalValidation"
                    :disabled="!currentTicket.participant.certificate_url"
                  />
                  <span class="text-sm">Validated</span>
                </div>
              </div>
              
              <!-- Participant Extras -->
              <div v-if="currentTicket.extras && currentTicket.extras.length > 0" class="space-y-2">
                <h4 class="font-medium">Selected Extras</h4>
                <div 
                  v-for="extra in currentTicket.extras" 
                  :key="extra.id"
                  class="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <span class="font-medium">{{ extra.name }}</span>
                    <span class="text-sm text-muted-foreground ml-2">({{ extra.quantity }}x)</span>
                  </div>
                  <Switch 
                    :checked="extra.validated"
                    @update:checked="updateExtraValidation(extra.id, $event)"
                  />
                </div>
              </div>
            </div>
            
            <!-- Bib Number Assignment -->
            <div v-if="currentTicket && !currentTicket.checked_in_at" class="space-y-3 pt-3 border-t">
              <h4 class="font-medium">Bib Number Assignment</h4>
              <div class="space-y-2">
                <Label for="bibNumber">Assign Bib Number</Label>
                <Input 
                  id="bibNumber"
                  v-model="bibNumber"
                  placeholder="Enter bib number (e.g., 1234)"
                  type="text"
                  pattern="[0-9]*"
                  maxlength="6"
                  @keyup.enter="checkInParticipant"
                />
                <p class="text-sm text-muted-foreground">
                  Enter the physical bib number for this participant
                </p>
              </div>
            </div>
            
            <!-- Action Buttons -->
            <div class="flex gap-2 pt-4">
              <Button 
                v-if="!currentTicket.checked_in_at"
                @click="checkInParticipant"
                :disabled="currentTicket.status !== 'valid'"
                class="flex-1"
              >
                <CheckIcon class="h-4 w-4 mr-2" />
                Check In
              </Button>
              
              <Button 
                v-else
                variant="outline"
                disabled
                class="flex-1"
              >
                <CheckCircle2Icon class="h-4 w-4 mr-2" />
                Already Checked In
              </Button>
              
              <Button variant="outline" @click="clearCurrentTicket">
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    
    <!-- Participants List -->
    <Card class="mt-6">
      <CardHeader>
        <div class="flex items-center justify-between">
          <div>
            <CardTitle>Participants</CardTitle>
            <CardDescription>
              Manage event participants and check-in status
            </CardDescription>
          </div>
          
          <!-- Search and Filters -->
          <div class="flex gap-2">
            <Input 
              v-model="searchQuery"
              placeholder="Search participants..."
              class="w-64"
            />
            <Select v-model="statusFilter">
              <SelectTrigger class="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="checked-in">Checked In</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ParticipantsList 
          :participants="filteredParticipants"
          :loading="participantsLoading"
          @select-participant="selectParticipant"
        />
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import jsQR from 'jsqr'
import { 
  CameraIcon, 
  XIcon,
  QrCodeIcon,
  CheckIcon,
  CheckCircle2Icon,
  XCircleIcon,
  AlertCircleIcon
} from 'lucide-vue-next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import ParticipantsList from '~/components/admin/ParticipantsList.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'master-mode'
})

const client = useSupabaseClient()
const user = useSupabaseUser()

// State
const selectedEventId = ref('')
const events = ref<any[]>([])
const races = ref<any[]>([])
const participants = ref<any[]>([])
const participantsLoading = ref(false)
const searchQuery = ref('')
const statusFilter = ref('all')

// Camera & QR scanning
const videoRef = ref<HTMLVideoElement>()
const isCameraStarted = ref(false)
const videoStream = ref<MediaStream>()
const scanInterval = ref<NodeJS.Timeout>()
const manualTicketNumber = ref('')

// Current validation
const currentTicket = ref<any>(null)
const bibNumber = ref('')

// Computed
const filteredParticipants = computed(() => {
  let filtered = participants.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(p => 
      p.participant.full_name.toLowerCase().includes(query) ||
      p.ticket_number.toLowerCase().includes(query)
    )
  }

  if (statusFilter.value !== 'all') {
    if (statusFilter.value === 'checked-in') {
      filtered = filtered.filter(p => p.checked_in_at)
    } else if (statusFilter.value === 'pending') {
      filtered = filtered.filter(p => !p.checked_in_at)
    }
  }

  return filtered
})

// Methods
const loadEvents = async () => {
  try {
    const { data, error } = await client
      .from('events')
      .select(`
        id,
        name,
        start_date,
        organization:organizations!inner(
          id,
          founder_id
        )
      `)
      .eq('organizations.founder_id', user.value?.id || '')
      .order('start_date', { ascending: false })

    if (error) throw error
    events.value = data || []
  } catch (error) {
    console.error('Error loading events:', error)
  }
}

const loadEventRaces = async () => {
  if (!selectedEventId.value) return
  
  try {
    const { data, error } = await client
      .from('races')
      .select('*')
      .eq('event_id', selectedEventId.value)
      .order('start_time')

    if (error) throw error
    races.value = data || []
    
    await loadParticipants()
  } catch (error) {
    console.error('Error loading races:', error)
  }
}

const loadParticipants = async () => {
  if (!selectedEventId.value) return
  
  participantsLoading.value = true
  try {
    const { data, error } = await client
      .from('individual_tickets')
      .select(`
        *,
        participant:participants(*),
        ticket:tickets(
          id,
          race:races(
            id,
            name,
            distance_km,
            event_id
          )
        )
      `)
      .eq('ticket.race.event_id', selectedEventId.value)
      .order('created_at', { ascending: false })

    if (error) throw error
    participants.value = data || []
  } catch (error) {
    console.error('Error loading participants:', error)
  } finally {
    participantsLoading.value = false
  }
}

const startCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    })
    
    if (videoRef.value) {
      videoRef.value.srcObject = stream
      videoStream.value = stream
      isCameraStarted.value = true
      startQRScanning()
    }
  } catch (error) {
    console.error('Camera access denied:', error)
  }
}

const stopCamera = () => {
  if (videoStream.value) {
    videoStream.value.getTracks().forEach(track => track.stop())
    videoStream.value = undefined
  }
  
  if (scanInterval.value) {
    clearInterval(scanInterval.value)
    scanInterval.value = undefined
  }
  
  isCameraStarted.value = false
}

const startQRScanning = () => {
  scanInterval.value = setInterval(() => {
    scanQRCode()
  }, 100)
}

const scanQRCode = () => {
  if (!videoRef.value) return
  
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) return
  
  canvas.width = videoRef.value.videoWidth
  canvas.height = videoRef.value.videoHeight
  
  context.drawImage(videoRef.value, 0, 0, canvas.width, canvas.height)
  
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  const code = jsQR(imageData.data, imageData.width, imageData.height)
  
  if (code) {
    validateQRCode(code.data)
  }
}

const validateQRCode = async (qrData: string) => {
  try {
    // Extract ticket validation data from QR code
    const url = new URL(qrData)
    const ticketId = url.searchParams.get('t')
    const participantId = url.searchParams.get('p')
    
    if (!ticketId || !participantId) {
      throw new Error('Invalid QR code format')
    }
    
    await validateTicket(ticketId, participantId)
  } catch (error) {
    console.error('QR validation error:', error)
  }
}

const validateManualTicket = async () => {
  if (!manualTicketNumber.value.trim()) return
  
  try {
    const { data, error } = await client
      .from('individual_tickets')
      .select(`
        *,
        participant:participants(*),
        ticket:tickets(
          id,
          race:races(
            id,
            name,
            distance_km
          )
        )
      `)
      .eq('ticket_number', manualTicketNumber.value.trim())
      .single()

    if (error) throw error
    
    currentTicket.value = data
    manualTicketNumber.value = ''
  } catch (error) {
    console.error('Manual validation error:', error)
  }
}

const validateTicket = async (ticketId: string, participantId: string) => {
  try {
    const { data, error } = await client
      .from('individual_tickets')
      .select(`
        *,
        participant:participants(*),
        ticket:tickets(
          id,
          race:races(
            id,
            name,
            distance_km
          )
        )
      `)
      .eq('ticket_id', ticketId)
      .eq('participant_id', participantId)
      .single()

    if (error) throw error
    
    currentTicket.value = data
  } catch (error) {
    console.error('Ticket validation error:', error)
  }
}

const checkInParticipant = async () => {
  if (!currentTicket.value || !selectedEventId.value) return
  
  try {
    // Use the API endpoint to handle check-in with bib number
    const response = await $fetch('/api/admin/checkin', {
      method: 'POST',
      body: {
        participantId: currentTicket.value.participant_id,
        eventId: selectedEventId.value,
        checkedInBy: user.value?.id || '',
        bibNumber: bibNumber.value.trim() || null
      }
    })

    if (response.success) {
      // Update the current ticket status
      currentTicket.value.checked_in_at = response.checkedInAt
      currentTicket.value.status = 'used'
      
      // Clear the bib number input
      bibNumber.value = ''
      
      // Reload participants list to reflect changes
      await loadParticipants()
      
      // Show success message
      console.log('Check-in successful:', response.message)
    }
  } catch (error) {
    console.error('Check-in error:', error)
    // TODO: Add proper error handling/toast notification
  }
}

const updateMedicalValidation = async (validated: boolean) => {
  if (!currentTicket.value) return
  
  try {
    const { error } = await (client as any)
      .from('individual_tickets')
      .update({ medical_validated: validated })
      .eq('id', currentTicket.value.id)

    if (error) throw error
    
    currentTicket.value.medical_validated = validated
  } catch (error) {
    console.error('Medical validation error:', error)
  }
}

const updateExtraValidation = async (extraId: string, validated: boolean) => {
  // TODO: Update extra validation in participant_extras table
  console.log('Update extra validation:', extraId, validated)
}

const clearCurrentTicket = () => {
  currentTicket.value = null
  bibNumber.value = ''
}

const selectParticipant = (participant: any) => {
  currentTicket.value = participant
  bibNumber.value = participant.participant?.bib_number || ''
}

const calculateAge = (birthdate: string) => {
  const today = new Date()
  const birth = new Date(birthdate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age
}

// Lifecycle
onMounted(() => {
  loadEvents()
})

onBeforeUnmount(() => {
  stopCamera()
})
</script>
