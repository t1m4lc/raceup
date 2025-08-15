<template>
  <div class="container max-w-4xl mx-auto p-4">
    <div v-if="loading" class="flex justify-center my-12">
      <div class="animate-spin h-12 w-12 border-t-4 border-b-4 border-primary rounded-full"></div>
    </div>
    
    <div v-else-if="error" class="bg-destructive/20 p-4 rounded-md text-destructive mb-4">
      <h2 class="text-xl font-bold mb-2">Payment Error</h2>
      <p>{{ error }}</p>
      <Button @click="goBack" class="mt-4">Go Back</Button>
    </div>
    
    <div v-else>
      <!-- Payment Success or Error Message -->
      <div class="text-center mb-12">
        <div v-if="paymentStatus === 'succeeded'" class="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <CheckIcon class="h-6 w-6 text-green-600" />
        </div>
        <div v-else-if="paymentStatus === 'processing'" class="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
          <ClockIcon class="h-6 w-6 text-blue-600" />
        </div>
        <div v-else class="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <AlertCircleIcon class="h-6 w-6 text-red-600" />
        </div>
        
        <h1 class="text-3xl font-bold mb-2">
          {{ paymentStatusTitle }}
        </h1>
        <p class="text-muted-foreground mb-6">
          {{ paymentStatusMessage }}
        </p>
      </div>
      
      <!-- Ticket Summary -->
      <Card class="mb-8">
        <CardHeader>
          <CardTitle>Booking Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-medium">{{ ticket?.race?.name }}</h3>
                <p class="text-muted-foreground">{{ ticket?.race?.event?.name }}</p>
              </div>
              <Badge :variant="getStatusVariant(ticket?.status)">
                {{ ticket?.status }}
              </Badge>
            </div>
            <Separator class="my-4" />
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div class="text-muted-foreground">Date</div>
                <div>{{ formatDate(ticket?.race?.date) }}</div>
              </div>
              <div>
                <div class="text-muted-foreground">Distance</div>
                <div>{{ ticket?.race?.distance }} km</div>
              </div>
              <div>
                <div class="text-muted-foreground">Participants</div>
                <div>{{ ticket?.participants?.length }}</div>
              </div>
              <div>
                <div class="text-muted-foreground">Total Amount</div>
                <div class="font-medium">{{ formatCurrency(ticket?.totalAmount, ticket?.currency) }}</div>
              </div>
            </div>
            
            <Separator class="my-4" />
            
            <div class="flex justify-between">
              <div>
                <div class="text-sm text-muted-foreground">Booking Reference</div>
                <div class="font-mono text-xs">{{ ticket?.id || ticketId }}</div>
              </div>
              <div class="text-right">
                <div class="text-sm text-muted-foreground">Transaction Reference</div>
                <div class="font-mono text-xs">{{ ticket?.payment?.id || 'N/A' }}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <!-- Participants List -->
      <Card class="mb-8">
        <CardHeader>
          <CardTitle>Participants</CardTitle>
          <CardDescription>
            {{ ticket?.participants?.length }} registered participant(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-3">
            <div v-for="(participant, index) in ticket?.participants" :key="index" class="flex items-center space-x-4 p-2 rounded-md border bg-background">
              <Avatar>
                <AvatarFallback>
                  {{ getInitials(participant.name) }}
                </AvatarFallback>
              </Avatar>
              <div>
                <div class="font-medium">{{ participant.name }}</div>
                <div class="text-sm text-muted-foreground">
                  {{ formatDate(participant.birthdate, 'YYYY-MM-DD') }} • {{ participant.gender }}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <Button asChild variant="outline">
          <NuxtLink to="/tickets">
            <TicketIcon class="mr-2 h-4 w-4" />
            View All Tickets
          </NuxtLink>
        </Button>
        <Button asChild>
          <NuxtLink :to="`/tickets/${ticketId}`">
            <EyeIcon class="mr-2 h-4 w-4" />
            View Ticket Details
          </NuxtLink>
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from '#imports'
import { 
  CheckIcon,
  AlertCircleIcon, 
  ClockIcon,
  TicketIcon,
  EyeIcon
} from 'lucide-vue-next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const route = useRoute()
const ticketId = route.params.ticketId as string
const { $dayjs } = useNuxtApp()
const { $stripe } = useNuxtApp()

const ticket = ref<any>(null)
const loading = ref(true)
const error = ref('')
const paymentStatus = ref<'succeeded' | 'processing' | 'failed'>('processing')

// Computed properties for payment status messages
const paymentStatusTitle = computed(() => {
  switch (paymentStatus.value) {
    case 'succeeded':
      return 'Payment Successful!'
    case 'processing':
      return 'Payment Processing'
    case 'failed':
      return 'Payment Failed'
    default:
      return 'Unknown Status'
  }
})

const paymentStatusMessage = computed(() => {
  switch (paymentStatus.value) {
    case 'succeeded':
      return 'Your registration has been confirmed. Thank you for your purchase!'
    case 'processing':
      return 'Your payment is being processed. We will update your ticket status once the payment is complete.'
    case 'failed':
      return 'There was an issue processing your payment. Please try again or contact support.'
    default:
      return ''
  }
})

// Format date using dayjs
const formatDate = (date: string, format = 'MMM D, YYYY') => {
  if (!date) return '';
  return $dayjs(date).format(format);
};

// Format price to currency
const formatCurrency = (price: number, currency = 'EUR') => {
  if (price === undefined || price === null) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(price);
};

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

// Get initials from name
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

// Check payment status with Stripe
const checkPaymentStatus = async () => {
  const clientSecret = localStorage.getItem('stripeClientSecret')
  
  if (!clientSecret) {
    console.warn('No client secret found in local storage')
    return
  }
  
  try {
    // Retrieve payment intent status
    const { paymentIntent } = await $stripe.retrievePaymentIntent(clientSecret)
    
    if (paymentIntent) {
      switch (paymentIntent.status) {
        case 'succeeded':
          paymentStatus.value = 'succeeded'
          break
        case 'processing':
          paymentStatus.value = 'processing'
          break
        case 'requires_payment_method':
        case 'requires_confirmation':
        case 'requires_action':
        case 'canceled':
        default:
          paymentStatus.value = 'failed'
          break
      }
    }
  } catch (err) {
    console.error('Error checking payment status:', err)
  }
}

// Navigate back
const goBack = () => {
  history.back();
};

// Fetch ticket details
const fetchTicket = async () => {
  loading.value = true
  error.value = ''
  
  try {
    // Fetch ticket details from API
    const response = await $fetch(`/api/tickets/${ticketId}`)
    ticket.value = response
    
    // Set payment status based on ticket status
    if (ticket.value.status === 'paid') {
      paymentStatus.value = 'succeeded'
    } else if (ticket.value.status === 'pending') {
      paymentStatus.value = 'processing'
      
      // Check with Stripe for the latest status
      await checkPaymentStatus()
    } else {
      paymentStatus.value = 'failed'
    }
    
    // If the payment was successful, clear local storage
    if (paymentStatus.value === 'succeeded') {
      localStorage.removeItem('stripeClientSecret')
      localStorage.removeItem('stripeTicketId')
    }
  } catch (err: any) {
    console.error('Error fetching ticket:', err)
    error.value = 'Failed to load ticket information'
  } finally {
    loading.value = false
  }
}

// Call fetchTicket on mount
onMounted(() => {
  fetchTicket()
})
</script>
