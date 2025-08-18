<template>
  <div class="space-y-4">
    <div v-if="tickets.length === 0" class="text-center py-8">
      <p class="text-muted-foreground">No tickets found for this filter.</p>
    </div>
    
    <div v-else class="grid gap-4">
      <Card 
        v-for="ticket in tickets" 
        :key="ticket.id"
        class="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
        @click="selectTicket(ticket)"
      >
        <CardContent class="p-6">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <h3 class="font-semibold text-lg">{{ ticket.ticket.race.event.name }}</h3>
                <Badge :variant="getStatusVariant(ticket.status)">
                  {{ getStatusLabel(ticket.status) }}
                </Badge>
              </div>
              
              <div class="space-y-1 text-sm text-muted-foreground">
                <div class="flex items-center gap-2">
                  <MapPinIcon class="h-4 w-4" />
                  <span>{{ ticket.ticket.race.event.location }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <CalendarIcon class="h-4 w-4" />
                  <span>{{ formatDate(ticket.ticket.race.start_time) }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <RouteIcon class="h-4 w-4" />
                  <span>{{ ticket.ticket.race.name }} - {{ ticket.ticket.race.distance_km }}km</span>
                </div>
              </div>
              
              <div class="mt-3 pt-3 border-t">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="font-medium">{{ getDisplayName(ticket.participant) }}</p>
                    <p class="text-sm text-muted-foreground">
                      Ticket #{{ ticket.ticket_number }}
                    </p>
                  </div>
                  
                  <div v-if="ticket.checked_in_at" class="flex items-center gap-1 text-green-600">
                    <CheckCircle2Icon class="h-4 w-4" />
                    <span class="text-sm font-medium">Checked In</span>
                  </div>
                  
                  <div v-else-if="isUpcoming(ticket.ticket.race.start_time)" class="flex items-center gap-1 text-blue-600">
                    <ClockIcon class="h-4 w-4" />
                    <span class="text-sm font-medium">Upcoming</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- QR Code Preview -->
            <div class="ml-6 flex-shrink-0">
              <div class="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                <QrCodeIcon class="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
          </div>
          
          <!-- Action buttons -->
          <div class="mt-4 pt-4 border-t flex gap-2">
            <Button variant="outline" size="sm" @click.stop="viewTicket(ticket)">
              <EyeIcon class="h-4 w-4 mr-2" />
              View Details
            </Button>
            
            <Button 
              v-if="!ticket.checked_in_at && isUpcoming(ticket.ticket.race.start_time)"
              variant="outline" 
              size="sm" 
              @click.stop="downloadTicket(ticket)"
            >
              <DownloadIcon class="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getDisplayName } from '@/utils/nameHelpers'
import { 
  MapPinIcon, 
  CalendarIcon, 
  RouteIcon, 
  CheckCircle2Icon, 
  ClockIcon,
  QrCodeIcon,
  EyeIcon,
  DownloadIcon
} from 'lucide-vue-next'

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
  tickets: IndividualTicket[]
}>()

const selectTicketFn = inject<(ticket: IndividualTicket) => void>('selectTicket')

const selectTicket = (ticket: IndividualTicket) => {
  selectTicketFn?.(ticket)
}

const viewTicket = (ticket: IndividualTicket) => {
  selectTicketFn?.(ticket)
}

const downloadTicket = async (ticket: IndividualTicket) => {
  // TODO: Implement PDF ticket download
  console.log('Download ticket:', ticket.ticket_number)
}

const isUpcoming = (startTime: string): boolean => {
  return new Date(startTime) > new Date()
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
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
