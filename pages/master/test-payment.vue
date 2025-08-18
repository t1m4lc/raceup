<template>
  <div class="container max-w-4xl mx-auto p-4">
    <h1 class="text-3xl font-bold mb-8">Payment Flow Test</h1>
    
    <div class="space-y-6">
      <!-- Step 1: Simulate Cart Items -->
      <Card>
        <CardHeader>
          <CardTitle>Step 1: Test Cart Setup</CardTitle>
          <CardDescription>This simulates a cart with race registrations</CardDescription>
        </CardHeader>
        <CardContent>
          <div v-if="loadingRaces" class="text-muted-foreground">
            Loading available races...
          </div>
          <div v-else-if="availableRaces.length === 0" class="text-yellow-600">
            ⚠️ No races found in database. Please add some races to test the payment flow.
          </div>
          <div v-else-if="!cartStore.totalItems" class="space-y-4">
            <p>Cart is empty. Add test items:</p>
            <div class="text-sm text-muted-foreground mb-2">
              Available race: {{ availableRaces[0]?.name }} ({{ availableRaces[0]?.event?.name }})
            </div>
            <Button @click="addTestItems" class="mr-2">Add Test Race Registration</Button>
          </div>
          <div v-else>
            <p class="text-green-600">✓ Cart has {{ cartStore.totalItems }} participant(s)</p>
            <div class="mt-4">
              <p><strong>Subtotal:</strong> {{ cartStore.formattedSubtotalPrice }}</p>
              <p><strong>Fees:</strong> {{ cartStore.formattedFeesAmount }}</p>
              <p><strong>Total:</strong> {{ cartStore.formattedTotalPrice }}</p>
            </div>
            <Button @click="clearCart" variant="outline" class="mt-4">Clear Cart</Button>
          </div>
        </CardContent>
      </Card>

      <!-- Step 2: Contact Info -->
      <Card>
        <CardHeader>
          <CardTitle>Step 2: Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <Label for="firstName">First Name</Label>
              <Input v-model="contactInfo.firstName" id="firstName" placeholder="John" />
            </div>
            <div>
              <Label for="lastName">Last Name</Label>
              <Input v-model="contactInfo.lastName" id="lastName" placeholder="Doe" />
            </div>
            <div>
              <Label for="email">Email</Label>
              <Input v-model="contactInfo.email" id="email" type="email" placeholder="john@example.com" />
            </div>
            <div>
              <Label for="phone">Phone</Label>
              <Input v-model="contactInfo.phone" id="phone" placeholder="+33123456789" />
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Step 3: Test Payment -->
      <Card>
        <CardHeader>
          <CardTitle>Step 3: Test Payment Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="!canProceed" class="text-muted-foreground">
            Please complete steps 1 and 2 first.
          </div>
          <div v-else>
            <Button @click="testPaymentFlow" :disabled="isProcessing" class="w-full">
              <span v-if="isProcessing">Processing...</span>
              <span v-else>Test Stripe Payment Flow</span>
            </Button>
          </div>
          
          <div v-if="testResult" class="mt-4 p-4 rounded border" :class="testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'">
            <h4 class="font-medium" :class="testResult.success ? 'text-green-800' : 'text-red-800'">
              {{ testResult.success ? 'Success!' : 'Error' }}
            </h4>
            <p class="text-sm mt-1" :class="testResult.success ? 'text-green-700' : 'text-red-700'">
              {{ testResult.message }}
            </p>
            <div v-if="testResult.success && testResult.data" class="mt-2 text-xs font-mono bg-white p-2 rounded">
              <pre>{{ JSON.stringify(testResult.data, null, 2) }}</pre>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Current Cart State -->
      <Card v-if="cartStore.totalItems">
        <CardHeader>
          <CardTitle>Current Cart State</CardTitle>
        </CardHeader>
        <CardContent>
          <pre class="text-xs bg-gray-50 p-4 rounded overflow-x-auto">{{ JSON.stringify(cartStore.items, null, 2) }}</pre>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCartStore } from '@/stores/cart'

const cartStore = useCartStore()

const isProcessing = ref(false)
const testResult = ref<any>(null)
const availableRaces = ref<any[]>([])
const loadingRaces = ref(true)

const contactInfo = ref({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+33123456789'
})

// Load available races on mount
onMounted(async () => {
  try {
    const response = await $fetch('/api/races/available')
    if (response.success && response.races.length > 0) {
      availableRaces.value = response.races
    }
  } catch (error) {
    console.error('Failed to load races:', error)
  } finally {
    loadingRaces.value = false
  }
})

const canProceed = computed(() => {
  return cartStore.totalItems > 0 && 
         contactInfo.value.firstName &&
         contactInfo.value.lastName &&
         contactInfo.value.email
})

const addTestItems = () => {
  if (availableRaces.value.length === 0) {
    alert('No races available in database. Please add some races first.')
    return
  }

  // Use the first available race
  const race = availableRaces.value[0]
  
  // Add a test race registration to the cart
  cartStore.addItem({
    id: cartStore.generateId(),
    raceId: race.id,
    raceName: race.name,
    raceDate: race.race_date,
    distance: race.distance,
    price: race.price_cents,
    currency: race.currency,
    organizationId: race.event.organization.id,
    participants: [
      {
        first_name: 'John',
        last_name: 'Doe',
        birthdate: '1990-05-15',
        gender: 'Male',
        emergencyContactName: 'Jane Doe',
        emergencyContactPhone: '+33123456789',
        medicalNotes: 'No allergies',
        extras: [
          {
            id: 'tshirt',
            name: 'T-Shirt M',
            price: 15, // EUR
            quantity: 1
          },
          {
            id: 'meal',
            name: 'Race Meal',
            price: 12, // EUR
            quantity: 1
          }
        ]
      }
    ]
  })
}

const clearCart = () => {
  cartStore.clearCart()
  testResult.value = null
}

const testPaymentFlow = async () => {
  if (!canProceed.value) return
  
  isProcessing.value = true
  testResult.value = null
  
  try {
    // Test the NEW payment intent creation API (no database writes)
    const response = await $fetch('/api/payments/create-payment-intent', {
      method: 'POST',
      body: {
        cartItems: cartStore.items,
        contactInfo: contactInfo.value,
        commissionConfig: cartStore.commissionConfig,
      }
    })

    testResult.value = {
      success: true,
      message: 'Payment intent created successfully! No database records created yet - they will be created after payment success via webhook.',
      data: response
    }

    // Note: Don't clear cart here - it would be cleared after actual payment
    console.log('Payment intent created:', response)

  } catch (error) {
    console.error('Payment test error:', error)
    testResult.value = {
      success: false,
      message: (error as any).data?.message || (error as any).message || 'Failed to create payment intent',
      data: error
    }
  } finally {
    isProcessing.value = false
  }
}

definePageMeta({
  middleware: 'master-mode',
  layout: 'blank',
  auth: false
})
</script>
