<template>
  <div>
    <Button variant="ghost" size="icon" @click="toggleCart" class="relative">
      <ShoppingCartIcon class="h-5 w-5" />
      <Badge 
        v-if="totalItems > 0" 
        class="absolute -right-1 -top-1 px-1.5 min-w-[1.25rem]"
      >
        {{ totalItems }}
      </Badge>
    </Button>

    <Sheet :open="isCartOpen" @update:open="(open) => updateCartOpen(open)">
      <SheetContent side="right" class="w-full sm:max-w-md p-0 flex flex-col h-full">
        <!-- Fixed Header -->
        <div class="p-3 border-b">
          <SheetHeader>
            <SheetTitle class="text-xl">Your Cart</SheetTitle>
            <SheetDescription v-if="!cartItems.length">
              Your cart is empty
            </SheetDescription>
            <SheetDescription v-else>
              {{ totalItems }} {{ totalItems === 1 ? 'participant' : 'participants' }} 
              {{ cartItems.length > 1 ? `in ${cartItems.length} races` : `in ${cartItems.length} race` }} in your cart
            </SheetDescription>
          </SheetHeader>
        </div>

        <!-- Empty Cart State -->
        <div v-if="!cartItems.length" class="flex items-center justify-center flex-grow p-5">
          <div class="text-center">
            <ShoppingCartIcon class="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 class="mt-4 text-lg font-medium">Your cart is empty</h3>
            <p class="mt-2 text-muted-foreground">
              Start adding races to your cart
            </p>
          </div>
        </div>
        
        <!-- Scrollable Content Area -->
        <div v-else class="flex-grow overflow-hidden flex flex-col">
          <ScrollArea class="flex-grow px-5 py-4">
            <div class="space-y-6">
              <div v-for="item in cartItems" :key="item.id" class="border-b pb-6 mb-6">
                <div class="flex justify-between items-start mb-3">
                  <div>
                    <h3 class="font-medium">{{ item.raceName }}</h3>
                    <p class="text-sm text-muted-foreground">{{ formatDate(item.raceDate) }}</p>
                    <p class="text-sm">{{ item.distance }}km</p>
                  </div>
                  <Button variant="ghost" size="icon" @click="() => removeItem(item.id)">
                    <XIcon class="h-4 w-4" />
                  </Button>
                </div>
                
                <div class="space-y-3 mt-3">
                  <div v-for="(participant, participantIndex) in item.participants" :key="participantIndex" class="bg-muted/50 p-3 rounded-md">
                    <div class="flex justify-between items-start">
                      <div class="flex-1">
                        <p class="font-medium">{{ getParticipantDisplayName(participant) }}</p>
                        <p class="text-xs text-muted-foreground">{{ formatDate(participant.birthdate) }}</p>
                        
                        <!-- Registration price -->
                        <div class="mt-2 space-y-1">
                          <div class="flex justify-between text-sm">
                            <span>Race registration</span>
                            <span class="font-medium">{{ getRegistrationPrice(item.raceId, item.currency) }}</span>
                          </div>
                          
                          <!-- Extras if any -->
                          <div v-if="participant.extras && participant.extras.length > 0">
                            <div v-for="(extra, idx) in participant.extras" :key="idx" class="flex justify-between text-sm">
                              <span>{{ getExtraDisplayName(extra) }}</span>
                              <span class="font-medium">{{ getExtraPrice(extra, item.raceId, item.currency) }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <Button variant="ghost" size="icon" @click="() => removeParticipant(item.id, participantIndex)" class="h-6 w-6">
                        <XIcon class="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
          
        <!-- Fixed Footer - Only show when cart has items -->
        <div v-if="cartItems.length > 0" class="border-t p-5 bg-background">
          <!-- Cart summary with extra information -->
          <div class="space-y-2 mb-4">
            <!-- Subtotal -->
            <div class="flex justify-between text-sm pt-2">
              <span>Subtotal</span>
              <span>{{ formattedSubtotalPrice }}</span>
            </div>
            
            <!-- Service Fee -->
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
                <span class="text-xs text-muted-foreground ml-1">({{ feeAllocationLabel }})</span>
              </div>
              <span>{{ formattedFeesAmount }}</span>
            </div>
            
            <!-- Total -->
            <div class="flex justify-between mt-4 font-medium">
              <span>Total</span>
              <span>{{ formattedTotalPrice }}</span>
            </div>
          </div>
          
          <Button class="w-full mt-4" @click="goToCheckout">
            Proceed to Checkout
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useCartStore, type CartItem } from '~/stores/cart'
import { ShoppingCartIcon, XIcon, HelpCircleIcon } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const { $dayjs } = useNuxtApp()
const router = useRouter()
const cartStore = useCartStore()
const { fetchPricing, getExtraPriceByName, formatPrice: formatPriceUtil } = usePricing()

const isLoading = ref(false)
const pricingData = ref<Map<string, any>>(new Map())

// Extract reactive state properties using storeToRefs
const { items: cartItems, isCartOpen } = storeToRefs(cartStore)
const { 
  totalItems, 
  formattedTotalPrice, 
  formattedSubtotalPrice, 
  formattedFeesAmount,
  feeAllocationLabel
} = storeToRefs(cartStore)

// Load pricing data for all races in cart
const loadPricingData = async () => {
  isLoading.value = true
  for (const item of cartItems.value) {
    if (!pricingData.value.has(item.raceId)) {
      try {
        console.log(`Loading pricing for race ${item.raceId}`)
        const pricing = await fetchPricing(item.raceId)
        console.log(`Pricing loaded for race ${item.raceId}:`, pricing)
        pricingData.value.set(item.raceId, pricing)
      } catch (error) {
        console.error(`Failed to load pricing for race ${item.raceId}:`, error)
        // Set a fallback pricing structure
        pricingData.value.set(item.raceId, {
          race: {
            id: item.raceId,
            name: item.raceName,
            price_cents: item.price || 0,
            currency: item.currency || 'EUR'
          },
          extras: []
        })
      }
    }
  }
  isLoading.value = false
}

// Watch for cart changes and load pricing
watch(cartItems, () => {
  loadPricingData()
}, { immediate: true })

// Compute total extras across all participants
const totalExtras = computed(() => {
  return cartItems.value.reduce((total, item) => {
    return total + item.participants.reduce((itemTotal, participant) => {
      return itemTotal + (participant.extras?.length || 0)
    }, 0)
  }, 0)
})

const updateCartOpen = (open: boolean) => {
  isCartOpen.value = open
}

const toggleCart = () => {
  cartStore.toggleCart()
}

const removeItem = (id: string) => {
  cartStore.removeItem(id)
}

const removeParticipant = (itemId: string, participantIndex: number) => {
  cartStore.removeParticipant(itemId, participantIndex)
}

const formatDate = (date: string) => {
  return $dayjs(date).format('MMM D, YYYY')
}

// Function to get participant display name
const getParticipantDisplayName = (participant: any) => {
  if (participant.first_name && participant.last_name) {
    return `${participant.first_name} ${participant.last_name}`.trim()
  }
  return 'Unnamed participant'
}

// Function to get extra display name (handle both string and object formats)
const getExtraDisplayName = (extra: any) => {
  if (typeof extra === 'string') {
    return extra
  }
  if (extra.name) {
    return extra.quantity > 1 ? `${extra.name} (${extra.quantity}x)` : extra.name
  }
  return 'Unknown extra'
}

// Function to format price
const formatPrice = (priceCents: number, currency: string = 'EUR') => {
  return formatPriceUtil(priceCents, currency)
}

// Function to get extra price from backend data
const getExtraPrice = (extra: any, raceId: string, currency: string = 'EUR') => {
  // For CartExtra objects, use the stored price directly
  if (typeof extra === 'object' && extra.price && extra.quantity) {
    return formatPrice(extra.price * extra.quantity * 100, currency) // Convert euros to cents for formatting
  }
  
  // Fallback to backend pricing for string format
  const pricing = pricingData.value.get(raceId)
  if (!pricing) {
    return formatPrice(0, currency)
  }
  
  let extraName = ''
  let quantity = 1
  
  if (typeof extra === 'string') {
    // Extract quantity from text like "Event T-Shirt (2x)"
    const quantityMatch = extra.match(/\((\d+)x\)/)
    quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1
    // Extract the actual extra name (remove quantity part)
    extraName = extra.replace(/\s*\(\d+x\)/, '').trim()
  } else if (extra.name) {
    extraName = extra.name
    quantity = extra.quantity || 1
  }
  
  const priceCents = getExtraPriceByName(pricing, extraName)
  return formatPrice(priceCents * quantity, currency)
}

// Function to get registration price from backend data
const getRegistrationPrice = (raceId: string, currency: string = 'EUR') => {
  const pricing = pricingData.value.get(raceId)
  if (!pricing) {
    // Fallback to cart item price if pricing not loaded
    const cartItem = cartItems.value.find(item => item.raceId === raceId)
    if (cartItem) {
      return formatPrice(cartItem.price, currency)
    }
    return formatPrice(0, currency)
  }
  
  return formatPrice(pricing.race.price_cents, currency)
}

const goToCheckout = () => {
  cartStore.closeCart()
  router.push('/checkout')
}
</script>
