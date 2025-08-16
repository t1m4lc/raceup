<template>
  <div class="container max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
    <h1 class="text-3xl font-bold mb-8">Checkout</h1>

    <div v-if="!cartItems.length" class="py-16 flex flex-col items-center justify-center">
      <ShoppingCartIcon class="h-12 w-12 text-muted-foreground mb-4" />
      <p class="text-xl font-medium mb-2">Your cart is empty</p>
      <p class="text-muted-foreground mb-6">Add races to your cart before proceeding to checkout</p>
      <Button asChild>
        <NuxtLink to="/">Browse Events</NuxtLink>
      </Button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="md:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
            <CardDescription>Review your race registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-6">
              <div v-for="item in cartItems" :key="item.id" class="border-b pb-4 last:border-b-0 last:pb-0">
                <div class="flex justify-between items-start">
                  <div>
                    <h3 class="font-medium">{{ item.raceName }}</h3>
                    <p class="text-sm text-muted-foreground">{{ formatDate(item.raceDate) }}</p>
                    <p class="text-sm">{{ item.distance }}km</p>
                    
                    <div class="mt-3">
                      <p class="text-sm font-medium mb-2">Participants:</p>
                      <ul class="space-y-2 pl-2">
                        <li v-for="(participant, index) in item.participants" :key="index" class="text-sm">
                          <span class="font-medium">{{ participant.full_name }}</span>
                          <div v-if="participant.extras && participant.extras.length > 0" class="text-xs text-muted-foreground mt-1">
                            Extras: {{ participant.extras.join(', ') }}
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="font-medium">{{ formatPrice(item.price * item.participants.length, item.currency) }}</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      class="h-8 px-2 mt-2"
                      @click="removeItem(item.id)"
                    >
                      <XIcon class="h-3 w-3 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Enter your contact details</CardDescription>
          </CardHeader>
          <CardContent>
            <form>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="space-y-2">
                  <Label for="firstName">First Name</Label>
                  <Input id="firstName" v-model="contactInfo.firstName" />
                </div>
                <div class="space-y-2">
                  <Label for="lastName">Last Name</Label>
                  <Input id="lastName" v-model="contactInfo.lastName" />
                </div>
              </div>
              <div class="space-y-2 mt-4">
                <Label for="email">Email</Label>
                <Input id="email" type="email" v-model="contactInfo.email" />
              </div>
              <div class="space-y-2 mt-4">
                <Label for="phone">Phone</Label>
                <Input id="phone" type="tel" v-model="contactInfo.phone" />
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <div>
        <div class="sticky top-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span>Subtotal</span>
                  <span>{{ formattedSubtotalPrice }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <div class="flex items-center gap-1">
                    <span>Service fee</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircleIcon class="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent class="max-w-xs">
                          <p>Software service fees to support platform maintenance, security, and customer support.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span>{{ formattedFeesAmount }}</span>
                </div>
                <div class="border-t pt-2 mt-2">
                  <div class="flex justify-between font-medium">
                    <span>Total</span>
                    <span>{{ formattedTotalPrice }}</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                class="w-full"
                :disabled="!canProceed"
                @click="proceedToPayment"
              >
                <span v-if="isProcessing">
                  <div class="animate-spin h-4 w-4 border-t-2 border-b-2 border-primary-foreground rounded-full mr-2"></div>
                  Processing...
                </span>
                <span v-else>
                  Proceed to Payment
                </span>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useCartStore, type CartItem } from '~/stores/cart'
import { 
  ShoppingCartIcon,
  XIcon,
  HelpCircleIcon
} from 'lucide-vue-next'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const { $dayjs } = useNuxtApp()
const router = useRouter()
const cartStore = useCartStore()
const client = useSupabaseClient()
const user = useSupabaseUser()

// Extract reactive state properties using storeToRefs
const { items: cartItems } = storeToRefs(cartStore)
const { 
  formattedTotalPrice, 
  formattedSubtotalPrice, 
  formattedFeesAmount,
} = storeToRefs(cartStore)

const isProcessing = ref(false)
const userProfile = ref<any>(null)

const contactInfo = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: ''
})

// Fetch user profile data and prefill contact info
const loadUserProfile = async () => {
  if (!user.value) return
  
  try {
    // Fetch user profile from profiles table
    const { data: profile, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', user.value.id)
      .single()
    
    if (error) {
      console.warn('Could not fetch user profile:', error)
      // Fallback to auth user metadata
      const fullName = user.value.user_metadata?.full_name || ''
      const nameParts = fullName.split(' ')
      
      contactInfo.value = {
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: user.value.email || '',
        phone: ''
      }
    } else if (profile) {
      userProfile.value = profile
      
      // Parse full name from profile
      const fullName = (profile as any).full_name || ''
      const nameParts = fullName.split(' ')
      
      contactInfo.value = {
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: (profile as any).email || user.value.email || '',
        phone: (profile as any).phone || ''
      }
    }
  } catch (err) {
    console.error('Error loading user profile:', err)
    // Fallback to auth user metadata
    const fullName = user.value.user_metadata?.full_name || ''
    const nameParts = fullName.split(' ')
    
    contactInfo.value = {
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      email: user.value.email || '',
      phone: ''
    }
  }
}

// Watch for user changes and load profile
watch(user, (newUser) => {
  if (newUser) {
    loadUserProfile()
  }
}, { immediate: true })

const canProceed = computed(() => {
  return cartItems.value.length > 0 &&
    contactInfo.value.firstName.trim() !== '' &&
    contactInfo.value.lastName.trim() !== '' &&
    contactInfo.value.email.trim() !== '' &&
    contactInfo.value.phone.trim() !== ''
})

const removeItem = (itemId: string) => {
  cartStore.removeItem(itemId)
}

const formatDate = (date: string) => {
  return $dayjs(date).format('MMM D, YYYY')
}

const formatPrice = (priceCents: number, currency: string = 'EUR') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'EUR',
  }).format(priceCents / 100)
}

const proceedToPayment = async () => {
  if (!canProceed.value) return
  
  isProcessing.value = true
  
  try {
    // In a real application, you would call your API to create a Stripe payment intent
    // For demo purposes, we'll simulate this with a timeout
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Redirect to payment confirmation
    router.push('/payment/confirmation/demo')
  } catch (error) {
    console.error('Payment processing error:', error)
  } finally {
    isProcessing.value = false
  }
}
</script>
