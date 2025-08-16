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
        <div class="p-5 border-b">
          <SheetHeader>
            <SheetTitle>Your Cart</SheetTitle>
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
                  <div v-for="(participant, participantIndex) in item.participants" :key="participantIndex" class="bg-muted/50 p-4 rounded-md">
                    <div class="flex justify-between">
                      <p class="text-sm font-medium">{{ participant.full_name || 'Unnamed participant' }}</p>
                      <Button variant="ghost" size="icon" @click="() => removeParticipant(item.id, participantIndex)" class="h-6 w-6">
                        <XIcon class="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div class="text-xs text-muted-foreground mt-1 space-y-1">
                      <div class="flex justify-between">
                        <span class="font-medium">Gender:</span>
                        <span>{{ participant.gender }}</span>
                      </div>
                      <div class="flex justify-between" v-if="participant.birthdate">
                        <span class="font-medium">Date of birth:</span>
                        <span>{{ formatDate(participant.birthdate) }}</span>
                      </div>
                      <div v-if="participant.certificate_url" class="flex justify-between">
                        <span class="font-medium">Certificate:</span>
                        <span>Uploaded ✓</span>
                      </div>
                      <div v-if="participant.extras && participant.extras.length > 0" class="mt-2">
                        <p class="font-medium mb-1">Extras:</p>
                        <ul class="list-disc list-inside ml-1">
                          <li v-for="(extra, idx) in participant.extras" :key="idx">
                            {{ extra }}
                          </li>
                        </ul>
                      </div>
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
            <div v-if="totalExtras > 0" class="flex justify-between text-sm">
              <span>Total extras selected</span>
              <span>{{ totalExtras }}</span>
            </div>
            
            <!-- Subtotal -->
            <div class="flex justify-between text-sm pt-2">
              <span>Subtotal</span>
              <span>{{ formattedSubtotalPrice }}</span>
            </div>
            
            <!-- Service Fee -->
            <div class="flex justify-between text-sm">
              <div>
                <span>Service fee</span>
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
import { ShoppingCartIcon, XIcon } from 'lucide-vue-next'
import { computed } from 'vue'
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

const { $dayjs } = useNuxtApp()
const router = useRouter()
const cartStore = useCartStore()

// Extract reactive state properties using storeToRefs
const { items: cartItems, isCartOpen } = storeToRefs(cartStore)
const { 
  totalItems, 
  formattedTotalPrice, 
  formattedSubtotalPrice, 
  formattedFeesAmount,
  feeAllocationLabel
} = storeToRefs(cartStore)

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

const goToCheckout = () => {
  cartStore.closeCart()
  router.push('/checkout')
}
</script>
