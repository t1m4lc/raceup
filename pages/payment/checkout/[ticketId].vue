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
            :ticket-id="paymentIntentId"
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
const paymentIntentId = route.params.ticketId as string // Actually payment intent ID now

const loading = ref(true)
const error = ref('')
const clientSecret = ref('')
const paymentAmount = ref(0)
const applicationFee = ref(0)
const currency = ref('EUR')

// Get payment details from localStorage (set by checkout page)
onMounted(() => {
  try {
    const storedClientSecret = localStorage.getItem('stripeClientSecret')
    const storedPaymentIntentId = localStorage.getItem('stripePaymentIntentId')

    if (!storedClientSecret || !storedPaymentIntentId) {
      error.value = 'Payment session not found. Please start checkout again.'
      loading.value = false
      return
    }

    // Verify the payment intent ID matches
    if (storedPaymentIntentId !== paymentIntentId) {
      error.value = 'Invalid payment session. Please start checkout again.'
      loading.value = false
      return
    }

    clientSecret.value = storedClientSecret

    // Parse payment amount from client secret (basic estimation)
    // In a real app, you might call an API to get payment intent details
    // For now, we'll just show a generic message since the amount is in the Stripe payment form
    loading.value = false
    
  } catch (err) {
    console.error('Error loading payment details:', err)
    error.value = 'Failed to load payment information. Please try again.'
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
  
  // Redirect to confirmation page using payment intent ID
  // The webhook will create the actual tickets, and we'll fetch them on the confirmation page
  router.push(`/payment/confirmation/${paymentIntentId}`)
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
