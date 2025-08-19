<template>
  <div class="container max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
    <div v-if="loading" class="flex justify-center my-12">
      <div class="animate-spin h-12 w-12 border-t-4 border-b-4 border-primary rounded-full"></div>
    </div>
    
    <div v-else-if="error" class="bg-destructive/20 p-4 rounded-md text-destructive mb-4">
      <h2 class="text-xl font-bold mb-2">Payment Setup Error</h2>
      <p>{{ error }}</p>
      <Button @click="goBack" class="mt-4">Go Back</Button>
    </div>
    
    <div v-else>
      <div class="mb-8">
        <h1 class="text-3xl font-bold mb-2">Complete Payment</h1>
        <p class="text-muted-foreground">Secure payment processed by Stripe</p>
      </div>

      <!-- Payment Summary -->
      <Card class="mb-8">
        <CardHeader>
          <CardTitle>Payment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span>Total Amount:</span>
              <span class="font-medium">{{ formatCurrency(paymentAmount, currency) }}</span>
            </div>
            <div v-if="applicationFee > 0" class="flex justify-between text-muted-foreground">
              <span>Service Fee:</span>
              <span>{{ formatCurrency(applicationFee, currency) }}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Stripe Payment Form -->
      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
          <CardDescription>Enter your payment details below</CardDescription>
        </CardHeader>
        <CardContent>
          <StripePaymentForm 
            v-if="clientSecret"
            :client-secret="clientSecret"
            :ticket-id="pendingOrderId"
            @payment-success="handlePaymentSuccess"
            @payment-error="handlePaymentError"
          />
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from '#imports'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import StripePaymentForm from '@/components/checkout/StripePaymentForm.vue'

const route = useRoute()
const router = useRouter()
const pendingOrderId = route.params.ticketId as string // Now using pending order ID

const loading = ref(true)
const error = ref('')
const clientSecret = ref('')
const paymentAmount = ref(0)
const applicationFee = ref(0)
const currency = ref('EUR')

// Récupérer les données depuis le localStorage (stockées lors du checkout)
onMounted(async () => {
  try {
    console.log('Loading payment data for pending order:', pendingOrderId)
    
    // Récupérer les données depuis localStorage
    const storedClientSecret = localStorage.getItem('stripeClientSecret')
    const storedAmount = localStorage.getItem('stripePaymentAmount')
    const storedCurrency = localStorage.getItem('stripePaymentCurrency')
    const storedFees = localStorage.getItem('stripePaymentFees')
    
    if (!storedClientSecret) {
      throw new Error('Payment session expired. Please try again.')
    }
    
    clientSecret.value = storedClientSecret
    paymentAmount.value = parseFloat(storedAmount || '0')
    currency.value = storedCurrency || 'EUR'
    applicationFee.value = parseFloat(storedFees || '0')
    
    console.log('Payment data loaded from localStorage:', { 
      amount: paymentAmount.value, 
      currency: currency.value, 
      fees: applicationFee.value 
    })
    
    loading.value = false
  } catch (apiError) {
    console.error('Failed to load payment data:', apiError)
    error.value = 'Payment session not found. Please try again.'
    loading.value = false
  }
})

const formatCurrency = (amount: number, curr: string = 'EUR') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: curr,
  }).format(amount)
}

const handlePaymentSuccess = (paymentIntent: any) => {
  console.log('Payment successful:', paymentIntent)
  
  // Clear localStorage
  localStorage.removeItem('stripeClientSecret')
  localStorage.removeItem('stripePaymentIntentId')
  localStorage.removeItem('stripePendingOrderId')
  
  // Redirect to confirmation page using pending order ID
  router.push(`/payment/confirmation/${pendingOrderId}`)
}

const handlePaymentError = (error: any) => {
  console.error('Payment error:', error)
  // Error is handled by the StripePaymentForm component
}

const goBack = () => {
  router.push('/checkout')
}

definePageMeta({
  middleware: ['auth']
})
</script>
