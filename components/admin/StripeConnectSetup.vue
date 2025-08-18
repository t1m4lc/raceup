<template>
  <Card class="w-full max-w-2xl">
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <CreditCardIcon class="h-5 w-5" />
        Payment Setup
      </CardTitle>
      <CardDescription>
        Set up Stripe Connect to receive payments for your events
      </CardDescription>
    </CardHeader>
    <CardContent class="space-y-6">
      <!-- Current Status -->
      <div v-if="stripeStatus" class="space-y-4">
        <div class="flex items-center gap-2">
          <div :class="statusIndicatorClass" class="h-3 w-3 rounded-full"></div>
          <span class="font-medium">{{ statusText }}</span>
        </div>
        
        <div v-if="!stripeStatus.isComplete" class="space-y-2">
          <p class="text-sm text-muted-foreground">
            Complete your payment setup to start receiving payments for race registrations.
          </p>
          <div class="space-y-1 text-xs">
            <div class="flex items-center gap-2">
              <CheckCircleIcon v-if="stripeStatus.detailsSubmitted" class="h-4 w-4 text-green-500" />
              <AlertCircleIcon v-else class="h-4 w-4 text-yellow-500" />
              <span>Business details {{ stripeStatus.detailsSubmitted ? 'submitted' : 'required' }}</span>
            </div>
            <div class="flex items-center gap-2">
              <CheckCircleIcon v-if="stripeStatus.chargesEnabled" class="h-4 w-4 text-green-500" />
              <AlertCircleIcon v-else class="h-4 w-4 text-yellow-500" />
              <span>Payment processing {{ stripeStatus.chargesEnabled ? 'enabled' : 'pending' }}</span>
            </div>
            <div class="flex items-center gap-2">
              <CheckCircleIcon v-if="stripeStatus.payoutsEnabled" class="h-4 w-4 text-green-500" />
              <AlertCircleIcon v-else class="h-4 w-4 text-yellow-500" />
              <span>Payouts {{ stripeStatus.payoutsEnabled ? 'enabled' : 'pending' }}</span>
            </div>
          </div>
        </div>

        <div v-if="stripeStatus.isComplete" class="bg-green-50 p-4 rounded-lg border border-green-200">
          <div class="flex items-center gap-2 text-green-700">
            <CheckCircleIcon class="h-5 w-5" />
            <span class="font-medium">Payment setup complete!</span>
          </div>
          <p class="text-sm text-green-600 mt-1">
            You can now receive payments for race registrations. 
            Funds will be transferred to your account automatically.
          </p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-3">
        <Button 
          v-if="!organization.stripe_account_id || !stripeStatus?.isComplete"
          @click="setupStripeConnect" 
          :disabled="isLoading"
          class="flex-1"
        >
          <span v-if="isLoading">Setting up...</span>
          <span v-else-if="organization.stripe_account_id">Continue Setup</span>
          <span v-else>Set Up Payments</span>
        </Button>
        
        <Button 
          v-if="organization.stripe_account_id"
          @click="checkStatus" 
          variant="outline"
          :disabled="isLoading"
        >
          <RefreshCwIcon class="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <!-- Payment Flow Explanation -->
      <div class="border-t pt-6">
        <h4 class="font-medium mb-3">How payments work:</h4>
        <div class="space-y-2 text-sm text-muted-foreground">
          <div class="flex items-start gap-2">
            <span class="font-medium text-foreground">1.</span>
            <span>Participants pay for race registration (race price + platform fee)</span>
          </div>
          <div class="flex items-start gap-2">
            <span class="font-medium text-foreground">2.</span>
            <span>Platform fee is deducted automatically</span>
          </div>
          <div class="flex items-start gap-2">
            <span class="font-medium text-foreground">3.</span>
            <span>Race registration fee is transferred to your account</span>
          </div>
          <div class="flex items-start gap-2">
            <span class="font-medium text-foreground">4.</span>
            <span>Transfers happen automatically within 2-7 business days</span>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  CreditCardIcon, 
  CheckCircleIcon, 
  AlertCircleIcon, 
  RefreshCwIcon 
} from 'lucide-vue-next'

interface Props {
  organization: {
    id: string
    name: string
    stripe_account_id?: string
    stripe_onboarding_completed?: boolean
  }
}

const props = defineProps<Props>()

const isLoading = ref(false)
const stripeStatus = ref<any>(null)

const statusIndicatorClass = computed(() => {
  if (!stripeStatus.value) return 'bg-gray-400'
  if (stripeStatus.value.isComplete) return 'bg-green-500'
  return 'bg-yellow-500'
})

const statusText = computed(() => {
  if (!stripeStatus.value) return 'Checking status...'
  if (stripeStatus.value.isComplete) return 'Payment setup complete'
  return 'Payment setup required'
})

const setupStripeConnect = async () => {
  isLoading.value = true
  try {
    const response = await $fetch('/api/stripe/connect/onboard', {
      method: 'POST',
      body: {
        organizationId: props.organization.id,
        returnUrl: `${window.location.origin}/dashboard/stripe/success`,
        refreshUrl: `${window.location.origin}/dashboard/stripe/refresh`
      }
    })

    if (response.onboardingUrl) {
      // Redirect to Stripe onboarding
      window.location.href = response.onboardingUrl
    }
  } catch (error: any) {
    console.error('Stripe setup error:', error)
    alert('Failed to set up Stripe Connect: ' + (error.data?.message || error.message))
  } finally {
    isLoading.value = false
  }
}

const checkStatus = async () => {
  if (!props.organization.stripe_account_id) return
  
  isLoading.value = true
  try {
    const status = await $fetch(`/api/stripe/connect/status/${props.organization.stripe_account_id}`)
    stripeStatus.value = status
  } catch (error) {
    console.error('Status check error:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  if (props.organization.stripe_account_id) {
    checkStatus()
  }
})
</script>
