<template>
  <div>
    <div class="flex items-center justify-between space-y-2 mb-6">
      <div>
        <h2 class="text-3xl font-bold tracking-tight">Event Check-in</h2>
        <p class="text-muted-foreground">
          Scan QR codes to check in participants
        </p>
      </div>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </CardContent>
      </Card>
      
      <div class="space-y-6">
        <Card v-if="selectedParticipant">
          <CardHeader>
            <CardTitle class="flex items-center justify-between">
              <span>Participant Details</span>
              <Badge :variant="selectedParticipant.checkedIn ? 'default' : 'outline'">
                {{ selectedParticipant.checkedIn ? 'Already Checked In' : 'Not Checked In' }}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div class="flex items-center space-x-4">
                <Avatar class="h-12 w-12">
                  <AvatarFallback>
                    {{ getInitials(selectedParticipant.name) }}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 class="font-medium">{{ selectedParticipant.name }}</h3>
                  <p class="text-sm text-muted-foreground">
                    {{ selectedParticipant.gender }} • {{ formatDate(selectedParticipant.birthdate, 'YYYY-MM-DD') }}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <div class="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div class="text-muted-foreground">Race:</div>
                    <div class="font-medium">{{ selectedParticipant.race.name }}</div>
                  </div>
                  <div>
                    <div class="text-muted-foreground">Distance:</div>
                    <div class="font-medium">{{ selectedParticipant.race.distance }} km</div>
                  </div>
                  <div>
                    <div class="text-muted-foreground">Event:</div>
                    <div class="font-medium">{{ selectedParticipant.race.event.name }}</div>
                  </div>
                  <div>
                    <div class="text-muted-foreground">Date:</div>
                    <div class="font-medium">{{ formatDate(selectedParticipant.race.date) }}</div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <FileIcon class="h-4 w-4" />
                    <Label for="certificate-validated">Medical Certificate Validated</Label>
                  </div>
                  <Switch 
                    id="certificate-validated"
                    :checked="selectedParticipant.certificateValidated"
                    @update:checked="updateCertificateStatus(selectedParticipant.id, $event)"
                    :disabled="isUpdating"
                  />
                </div>
                
                <Button 
                  class="w-full" 
                  :disabled="isUpdating || selectedParticipant.checkedIn || !selectedParticipant.certificateValidated"
                  @click="checkInParticipant"
                >
                  <span v-if="isUpdating">
                    <div class="animate-spin h-4 w-4 border-t-2 border-b-2 border-primary-foreground rounded-full mr-2"></div>
                    Processing...
                  </span>
                  <span v-else-if="selectedParticipant.checkedIn">
                    Already Checked In
                  </span>
                  <span v-else-if="!selectedParticipant.certificateValidated">
                    Validate Certificate First
                  </span>
                  <span v-else>
                    <CheckIcon class="h-4 w-4 mr-2" />
                    Confirm Check-in
                  </span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card v-if="recentCheckIns.length > 0">
          <CardHeader>
            <CardTitle>Recent Check-ins</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div v-for="checkin in recentCheckIns" :key="checkin.id" class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <Avatar class="h-8 w-8">
                    <AvatarFallback>
                      {{ getInitials(checkin.name) }}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div class="font-medium text-sm">{{ checkin.name }}</div>
                    <div class="text-xs text-muted-foreground">{{ checkin.race.name }}</div>
                  </div>
                </div>
                <div class="text-xs text-muted-foreground">
                  {{ formatTimeAgo(checkin.checkedIn) }}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    
    <!-- Alert Dialog for Check-in Success -->
    <AlertDialog :open="!!checkInSuccess" @update:open="checkInSuccess = null">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Check-in Confirmed</AlertDialogTitle>
          <AlertDialogDescription>
            {{ checkInSuccess?.name }} has been successfully checked in.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button @click="checkInSuccess = null">OK</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    
    <!-- Alert Dialog for QR Code Errors -->
    <AlertDialog :open="!!scanError" @update:open="scanError = null">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Scan Error</AlertDialogTitle>
          <AlertDialogDescription>
            {{ scanError }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button @click="scanError = null">OK</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { 
  CameraIcon, 
  XIcon,
  FileIcon,
  CheckIcon
} from 'lucide-vue-next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { 
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import jsQR from 'jsqr'

const { $dayjs } = useNuxtApp()
const client = useSupabaseClient()

// State variables
const videoRef = ref<HTMLVideoElement | null>(null)
const videoStream = ref<MediaStream | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(document.createElement('canvas'))
const isCameraStarted = ref(false)
const isScanning = ref(false)
const scanInterval = ref<number | null>(null)
const selectedParticipant = ref<any>(null)
const isUpdating = ref(false)
const checkInSuccess = ref<any>(null)
const scanError = ref<string | null>(null)
const recentCheckIns = ref<any[]>([])

// Format date using dayjs
const formatDate = (date: string, format = 'MMM D, YYYY') => {
  return $dayjs(date).format(format)
}

// Format time ago
const formatTimeAgo = (date: string) => {
  return $dayjs(date).fromNow()
}

// Get initials from name
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

// Start camera
const startCamera = async () => {
  try {
    const constraints = {
      video: { 
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    }
    
    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    videoRef.value!.srcObject = stream
    videoStream.value = stream
    isCameraStarted.value = true
    
    // Start QR code scanning
    startScanning()
  } catch (err) {
    console.error('Error starting camera:', err)
    scanError.value = 'Could not access the camera. Please check your device permissions.'
  }
}

// Stop camera
const stopCamera = () => {
  if (videoStream.value) {
    videoStream.value.getTracks().forEach(track => track.stop())
    videoStream.value = null
  }
  
  if (scanInterval.value) {
    clearInterval(scanInterval.value)
    scanInterval.value = null
  }
  
  isCameraStarted.value = false
  isScanning.value = false
}

// Start QR code scanning
const startScanning = () => {
  if (isScanning.value) return
  
  isScanning.value = true
  
  // Set up canvas for QR code processing
  const canvas = canvasRef.value!
  const context = canvas.getContext('2d')
  
  scanInterval.value = window.setInterval(() => {
    if (videoRef.value && videoRef.value.readyState === videoRef.value.HAVE_ENOUGH_DATA) {
      // Set canvas dimensions
      canvas.height = videoRef.value.videoHeight
      canvas.width = videoRef.value.videoWidth
      
      // Draw video frame to canvas
      context!.drawImage(videoRef.value, 0, 0, canvas.width, canvas.height)
      
      // Get image data for QR code detection
      const imageData = context!.getImageData(0, 0, canvas.width, canvas.height)
      
      // Process with jsQR
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      })
      
      if (code) {
        // We found a QR code
        console.log('QR code detected:', code.data)
        
        // Process the QR code data
        processQRCode(code.data)
        
        // Pause scanning briefly to avoid multiple scans
        clearInterval(scanInterval.value!)
        scanInterval.value = null
        
        // Resume scanning after a delay
        setTimeout(() => {
          if (isCameraStarted.value) {
            startScanning()
          }
        }, 3000)
      }
    }
  }, 100)
}

// Process QR code data
const processQRCode = async (data: string) => {
  try {
    // Parse QR code data
    const qrData = JSON.parse(data)
    
    if (!qrData.ticketId) {
      throw new Error('Invalid QR code format')
    }
    
    // Fetch participant data
    await fetchParticipantFromTicket(qrData.ticketId)
  } catch (err: any) {
    console.error('Error processing QR code:', err)
    scanError.value = 'Invalid QR code format. Please try again.'
  }
}

// Fetch participant from ticket ID
const fetchParticipantFromTicket = async (ticketId: string) => {
  try {
    // Get ticket details from API
    const ticketResponse = await $fetch(`/api/tickets/${ticketId}`, {
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    if (!ticketResponse || ticketResponse.participants.length === 0) {
      throw new Error('No participants found for this ticket')
    }
    
    // For now, just use the first participant
    // In a more complex system, you might want to show a list and let the user select
    const participant = ticketResponse.participants[0]
    
    // Format the participant data for display
    selectedParticipant.value = {
      id: participant.id,
      name: participant.name,
      gender: participant.gender,
      birthdate: participant.birthdate,
      certificateValidated: participant.certificateValidated,
      certificateUrl: participant.certificateUrl,
      checkedIn: participant.checkedIn,
      race: {
        name: ticketResponse.race.name,
        date: ticketResponse.race.date,
        distance: ticketResponse.race.distance,
        event: {
          name: ticketResponse.race.eventName,
          id: ticketResponse.race.eventId
        }
      }
    }
  } catch (err: any) {
    console.error('Error fetching participant data:', err)
    scanError.value = 'Error fetching participant data. Please try again.'
  }
}

// Update certificate validation status
const updateCertificateStatus = async (participantId: string, status: boolean) => {
  isUpdating.value = true
  
  try {
    // Update in Supabase
    const { error: updateError } = await client
      .from('participants')
      .update({
        certificate_validated: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', participantId)
    
    if (updateError) throw updateError
    
    // Update local state
    if (selectedParticipant.value && selectedParticipant.value.id === participantId) {
      selectedParticipant.value.certificateValidated = status
    }
  } catch (err: any) {
    console.error('Error updating certificate status:', err)
    scanError.value = 'Failed to update certificate status'
  } finally {
    isUpdating.value = false
  }
}

// Check in participant
const checkInParticipant = async () => {
  if (!selectedParticipant.value || selectedParticipant.value.checkedIn || !selectedParticipant.value.certificateValidated) {
    return
  }
  
  isUpdating.value = true
  
  try {
    // Record check-in
    const { error: checkInError } = await client
      .from('participants')
      .update({
        checkin_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedParticipant.value.id)
    
    if (checkInError) throw checkInError
    
    // Update local state
    const now = new Date().toISOString()
    selectedParticipant.value.checkedIn = formatDate(now)
    
    // Add to recent check-ins
    const checkInRecord = {
      id: selectedParticipant.value.id,
      name: selectedParticipant.value.name,
      race: {
        name: selectedParticipant.value.race.name
      },
      checkedIn: now
    }
    
    // Add to beginning of array and limit to 10 items
    recentCheckIns.value.unshift(checkInRecord)
    recentCheckIns.value = recentCheckIns.value.slice(0, 10)
    
    // Show success message
    checkInSuccess.value = { name: selectedParticipant.value.name }
    
    // Clear selected participant after a brief delay
    setTimeout(() => {
      selectedParticipant.value = null
    }, 2000)
  } catch (err: any) {
    console.error('Error checking in participant:', err)
    scanError.value = 'Failed to check in participant'
  } finally {
    isUpdating.value = false
  }
}

// Clean up
onBeforeUnmount(() => {
  stopCamera()
})

// This is needed for layout
definePageMeta({
  layout: 'admin'
})
</script>
