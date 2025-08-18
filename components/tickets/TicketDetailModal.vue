<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Ticket Details</DialogTitle>
        <DialogDescription>
          View your race ticket information and QR code
        </DialogDescription>
      </DialogHeader>
      
      <div v-if="ticket" class="space-y-6">
        <!-- Ticket Header -->
        <div class="text-center space-y-2">
          <Badge :variant="getStatusVariant(ticket.status)" class="text-sm">
            {{ getStatusLabel(ticket.status) }}
          </Badge>
          <h2 class="text-xl font-bold">{{ ticket.ticket.race.event.name }}</h2>
          <p class="text-muted-foreground">{{ ticket.ticket.race.name }}</p>
        </div>
        
        <!-- QR Code Section -->
        <Card class="p-6">
          <div class="text-center space-y-4">
            <h3 class="font-semibold">Check-in QR Code</h3>
            <div class="flex justify-center">
              <div ref="qrCodeContainer" class="bg-white p-4 rounded-lg border"></div>
            </div>
            <p class="text-sm text-muted-foreground">
              Show this QR code at registration for quick check-in
            </p>
            <p class="font-mono text-sm bg-muted px-2 py-1 rounded">
              Ticket #{{ ticket.ticket_number }}
            </p>
          </div>
        </Card>
        
        <!-- Event Information -->
        <Card>
          <CardHeader>
            <CardTitle class="text-base">Event Information</CardTitle>
          </CardHeader>
          <CardContent class="space-y-3">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-muted-foreground">Event:</span>
                <p class="font-medium">{{ ticket.ticket.race.event.name }}</p>
              </div>
              <div>
                <span class="text-muted-foreground">Race:</span>
                <p class="font-medium">{{ ticket.ticket.race.name }}</p>
              </div>
              <div>
                <span class="text-muted-foreground">Distance:</span>
                <p class="font-medium">{{ ticket.ticket.race.distance_km }}km</p>
              </div>
              <div>
                <span class="text-muted-foreground">Location:</span>
                <p class="font-medium">{{ ticket.ticket.race.event.location }}</p>
              </div>
              <div class="col-span-2">
                <span class="text-muted-foreground">Start Time:</span>
                <p class="font-medium">{{ formatDateTime(ticket.ticket.race.start_time) }}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <!-- Participant Information -->
        <Card>
          <CardHeader>
            <CardTitle class="text-base">Participant Information</CardTitle>
          </CardHeader>
          <CardContent class="space-y-3">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-muted-foreground">Name:</span>
                <p class="font-medium">{{ getDisplayName(ticket.participant) }}</p>
              </div>
              <div>
                <span class="text-muted-foreground">Gender:</span>
                <p class="font-medium capitalize">{{ ticket.participant.gender }}</p>
              </div>
              <div>
                <span class="text-muted-foreground">Birth Date:</span>
                <p class="font-medium">{{ formatDate(ticket.participant.birthdate) }}</p>
              </div>
              <div>
                <span class="text-muted-foreground">Bib Number:</span>
                <p class="font-medium">{{ ticket.participant.bib_number || 'Not assigned' }}</p>
              </div>
            </div>
            
            <!-- Medical Certificate -->
            <div class="pt-3 border-t">
              <span class="text-muted-foreground text-sm">Medical Certificate:</span>
              <div v-if="ticket.participant.certificate_url" class="mt-2">
                <Badge variant="secondary">
                  <CheckIcon class="h-3 w-3 mr-1" />
                  Uploaded
                </Badge>
                <Button variant="outline" size="sm" class="ml-2" @click="viewCertificate">
                  View Certificate
                </Button>
              </div>
              <div v-else class="mt-2">
                <Badge variant="outline">Not uploaded</Badge>
                <Button variant="outline" size="sm" class="ml-2" @click="uploadCertificate">
                  Upload Certificate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <!-- Check-in Status -->
        <Card v-if="ticket.checked_in_at">
          <CardHeader>
            <CardTitle class="text-base flex items-center gap-2">
              <CheckCircle2Icon class="h-5 w-5 text-green-600" />
              Checked In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-sm text-muted-foreground">
              Checked in on {{ formatDateTime(ticket.checked_in_at) }}
            </p>
            <div class="mt-2">
              <Badge variant="secondary">
                Medical: {{ ticket.medical_validated ? 'Validated' : 'Pending' }}
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <!-- Actions -->
        <div class="flex gap-2">
          <Button @click="downloadTicket" class="flex-1">
            <DownloadIcon class="h-4 w-4 mr-2" />
            Download Ticket
          </Button>
          <Button variant="outline" @click="printTicket" class="flex-1">
            <PrinterIcon class="h-4 w-4 mr-2" />
            Print Ticket
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import QRCode from 'qrcode'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckIcon, CheckCircle2Icon, DownloadIcon, PrinterIcon } from 'lucide-vue-next'
import { getDisplayName } from '@/utils/nameHelpers'

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

const props = defineProps<{
  open: boolean
  ticket: IndividualTicket | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const qrCodeContainer = ref<HTMLElement>()

// Generate QR code when ticket changes
watch(() => props.ticket, async (newTicket) => {
  if (newTicket && props.open) {
    await nextTick()
    await generateQRCode()
  }
}, { immediate: true })

watch(() => props.open, async (isOpen) => {
  if (isOpen && props.ticket) {
    await nextTick()
    await generateQRCode()
  }
})

const generateQRCode = async () => {
  if (!props.ticket || !qrCodeContainer.value) return
  
  try {
    // Clear previous QR code
    qrCodeContainer.value.innerHTML = ''
    
    // Generate QR code
    const canvas = document.createElement('canvas')
    await QRCode.toCanvas(canvas, props.ticket.qr_code_data, {
      errorCorrectionLevel: 'M',
      width: 200,
      margin: 2,
    })
    
    qrCodeContainer.value.appendChild(canvas)
  } catch (error) {
    console.error('Error generating QR code:', error)
  }
}

const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'valid':
      return 'default'
    case 'used':
      return 'secondary'
    case 'cancelled':
    case 'expired':
      return 'destructive'
    default:
      return 'outline'
  }
}

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'valid':
      return 'Valid'
    case 'used':
      return 'Used'
    case 'cancelled':
      return 'Cancelled'
    case 'expired':
      return 'Expired'
    default:
      return status.charAt(0).toUpperCase() + status.slice(1)
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const downloadTicket = () => {
  // TODO: Implement PDF download
  console.log('Download ticket PDF')
}

const printTicket = () => {
  window.print()
}

const viewCertificate = () => {
  if (props.ticket?.participant.certificate_url) {
    window.open(props.ticket.participant.certificate_url, '_blank')
  }
}

const uploadCertificate = () => {
  // TODO: Implement certificate upload
  console.log('Upload certificate')
}
</script>
