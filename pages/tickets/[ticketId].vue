<template>
  <div class="container mx-auto p-4 max-w-4xl">
    <div v-if="loading" class="flex justify-center my-12">
      <div class="animate-spin h-12 w-12 border-t-4 border-b-4 border-primary rounded-full"></div>
    </div>
    
    <div v-else-if="error" class="bg-destructive/20 p-4 rounded-md text-destructive mb-4">
      {{ error }}
    </div>
    
    <div v-else>
      <!-- Back button -->
      <div class="mb-6">
        <Button variant="outline" asChild class="flex items-center">
          <NuxtLink to="/tickets">
            <ArrowLeftIcon class="mr-2 h-4 w-4" /> 
            Back to Tickets
          </NuxtLink>
        </Button>
      </div>
      
      <!-- Ticket Header -->
      <div class="flex justify-between items-start mb-8">
        <div>
          <h1 class="text-3xl font-bold tracking-tight">{{ ticket.race.name }}</h1>
          <p class="text-muted-foreground">{{ ticket.race.event.name }}</p>
        </div>
        <Badge :variant="getStatusVariant(ticket.status)">
          {{ ticket.status }}
        </Badge>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Ticket Information -->
        <Card class="col-span-2">
          <CardHeader>
            <CardTitle>Ticket Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt class="text-sm font-medium text-muted-foreground">Race</dt>
                <dd class="text-lg">{{ ticket.race.name }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-muted-foreground">Event</dt>
                <dd class="text-lg">{{ ticket.race.event.name }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-muted-foreground">Date</dt>
                <dd class="text-lg">{{ formatDate(ticket.race.date) }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-muted-foreground">Distance</dt>
                <dd class="text-lg">{{ ticket.race.distance }} km</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-muted-foreground">Amount</dt>
                <dd class="text-lg">{{ formatPrice(ticket.totalAmount, ticket.currency) }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-muted-foreground">Ticket ID</dt>
                <dd class="text-lg font-mono">{{ ticket.id }}</dd>
              </div>
            </dl>
            
            <Separator class="my-6" />
            
            <div>
              <h3 class="font-medium mb-2">Payment Information</h3>
              <div v-if="ticket.payment" class="text-sm">
                <div class="flex justify-between mb-1">
                  <span class="text-muted-foreground">Status:</span>
                  <Badge :variant="getPaymentStatusVariant(ticket.payment.status)">
                    {{ ticket.payment.status }}
                  </Badge>
                </div>
                <div class="flex justify-between mb-1">
                  <span class="text-muted-foreground">Date:</span>
                  <span>{{ formatDate(ticket.payment.createdAt) }}</span>
                </div>
                <div class="flex justify-between mb-1">
                  <span class="text-muted-foreground">Amount:</span>
                  <span>{{ formatPrice(ticket.payment.amount, ticket.currency) }}</span>
                </div>
              </div>
              <div v-else class="text-sm text-muted-foreground">
                No payment information available
              </div>
            </div>
          </CardContent>
        </Card>
        
        <!-- QR Code Card -->
        <Card v-if="ticket.status === 'paid'">
          <CardHeader>
            <CardTitle>Check-in QR Code</CardTitle>
            <CardDescription>
              Show this at the event check-in
            </CardDescription>
          </CardHeader>
          <CardContent class="flex flex-col items-center">
            <div class="bg-white p-4 rounded-md" ref="qrCodeContainer"></div>
            <p class="mt-2 text-xs text-center text-muted-foreground">
              Scan for check-in
            </p>
          </CardContent>
        </Card>
      </div>
      
      <!-- Participants List -->
      <Card class="mt-6">
        <CardHeader>
          <CardTitle>Participants</CardTitle>
          <CardDescription>
            {{ ticket.participants.length }} registered participants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div v-for="participant in ticket.participants" :key="participant.id" class="flex items-center justify-between p-4 border rounded-lg">
              <div class="flex items-center">
                <Avatar class="h-10 w-10 mr-4">
                  <AvatarFallback>
                    {{ getInitials(participant.name) }}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p class="font-medium">{{ participant.name }}</p>
                  <p class="text-sm text-muted-foreground">{{ participant.birthdate }} • {{ participant.gender }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Badge :variant="participant.certificateValidated ? 'default' : 'outline'">
                        <span class="flex items-center gap-1">
                          <FileIcon class="h-3 w-3" /> 
                          {{ participant.certificateValidated ? 'Validated' : 'Pending' }}
                        </span>
                      </Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Medical Certificate: {{ participant.certificateValidated ? 'Validated' : 'Pending Validation' }}</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip v-if="participant.checkedIn">
                  <TooltipTrigger asChild>
                    <div>
                      <Badge variant="secondary">
                        <span class="flex items-center gap-1">
                          <CheckIcon class="h-3 w-3" /> 
                          Checked In
                        </span>
                      </Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Checked in at {{ participant.checkedIn }}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from '#imports'
import { ArrowLeftIcon, CheckIcon, FileIcon } from 'lucide-vue-next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import QRCode from 'qrcode'

const route = useRoute()
const ticketId = computed(() => route.params.ticketId as string)
const { $dayjs } = useNuxtApp()

const ticket = ref<any>(null)
const loading = ref(true)
const error = ref('')
const qrCodeContainer = ref<HTMLElement | null>(null)

// Format date using dayjs
const formatDate = (date: string, format = 'MMM D, YYYY') => {
  return $dayjs(date).format(format)
}

// Format price to currency
const formatPrice = (price: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'EUR',
  }).format(price)
}

// Get badge variant based on status
const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'paid':
      return 'default'
    case 'pending':
      return 'secondary'
    case 'canceled':
    case 'refunded':
      return 'destructive'
    default:
      return 'outline'
  }
}

// Get badge variant for payment status
const getPaymentStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'succeeded':
      return 'default'
    case 'pending':
      return 'secondary'
    case 'failed':
    case 'refunded':
      return 'destructive'
    default:
      return 'outline'
  }
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

// Generate QR code
const generateQRCode = () => {
  if (!ticket.value || !qrCodeContainer.value) return
  
  // Create a payload with ticket and user information
  const payload = {
    ticketId: ticket.value.id,
    eventId: ticket.value.race.event.id,
    timestamp: Date.now()
  }
  
  // Generate QR code
  QRCode.toCanvas(
    qrCodeContainer.value,
    JSON.stringify(payload),
    {
      width: 180,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    }
  )
}

// Fetch ticket
const fetchTicket = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const response = await $fetch(`/api/tickets/${ticketId.value}`, {
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    ticket.value = response
    
    // Wait for DOM to update, then generate QR code
    nextTick(() => {
      if (ticket.value.status === 'paid') {
        generateQRCode()
      }
    })
  } catch (err: any) {
    console.error('Error fetching ticket:', err)
    error.value = 'Failed to load ticket details'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTicket()
})

// Regenerate QR code if the component is rerendered
watch(qrCodeContainer, () => {
  if (ticket.value?.status === 'paid' && qrCodeContainer.value) {
    generateQRCode()
  }
})
</script>
