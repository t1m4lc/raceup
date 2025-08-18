<template>
  <div class="space-y-4">
    <div v-if="availableExtras.length === 0" class="text-center py-8">
      <p class="text-muted-foreground">No extras available for this race.</p>
    </div>
    
    <div v-else class="space-y-4">
      <div class="mb-4">
        <h4 class="font-medium text-lg">
          Extras for {{ getFullName(participant) || `Participant ${index + 1}` }}
        </h4>
        <p class="text-sm text-muted-foreground">
          Select any additional items you'd like to add to your registration
        </p>
      </div>
      
      <div class="space-y-3">
        <div 
          v-for="extra in availableExtras" 
          :key="extra.id"
          class="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div class="flex-1">
            <div class="flex items-center justify-between mb-1">
              <h5 class="font-medium">{{ extra.name }}</h5>
              <span class="text-sm font-semibold text-primary">
                {{ formatPrice(extra.price_cents) }}
              </span>
            </div>
            <p v-if="extra.description" class="text-sm text-muted-foreground">
              {{ extra.description }}
            </p>
          </div>
          
          <div class="ml-4 flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              :disabled="getExtraQuantity(extra.id) <= 0"
              @click="updateExtraQuantity(extra.id, getExtraQuantity(extra.id) - 1)"
              class="h-8 w-8 p-0"
            >
              -
            </Button>
            <span class="w-8 text-center text-sm font-medium">
              {{ getExtraQuantity(extra.id) }}
            </span>
            <Button
              variant="outline"
              size="sm"
              :disabled="getExtraQuantity(extra.id) >= (extra.max_quantity || 5)"
              @click="updateExtraQuantity(extra.id, getExtraQuantity(extra.id) + 1)"
              class="h-8 w-8 p-0"
            >
              +
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { CartParticipant, CartExtra, TicketExtra } from '@/types/participant'
import { getFullName } from '@/types/participant'

const props = defineProps<{
  participant: CartParticipant
  index: number
  availableExtras: TicketExtra[]
}>()

const emit = defineEmits<{
  'update:participant': [participant: CartParticipant]
}>()

const selectedExtras = computed(() => {
  return props.participant.extras?.filter(extra => extra.quantity > 0) || []
})

const extrasTotal = computed(() => {
  return selectedExtras.value.reduce((total, extra) => {
    return total + (extra.price * extra.quantity)
  }, 0)
})

const getExtraQuantity = (extraId: string): number => {
  const extra = props.participant.extras?.find(e => e.id === extraId)
  return extra?.quantity || 0
}

const updateExtraQuantity = (extraId: string, quantity: number) => {
  const updatedParticipant = { ...props.participant }
  
  if (!updatedParticipant.extras) {
    updatedParticipant.extras = []
  }
  
  const existingExtraIndex = updatedParticipant.extras.findIndex(e => e.id === extraId)
  const availableExtra = props.availableExtras.find(e => e.id === extraId)
  
  if (!availableExtra) return
  
  if (quantity <= 0) {
    // Remove extra if quantity is 0 or less
    if (existingExtraIndex >= 0) {
      updatedParticipant.extras.splice(existingExtraIndex, 1)
    }
  } else {
    // Update or add extra
    const extraData: CartExtra = {
      id: extraId,
      name: availableExtra.name,
      price: availableExtra.price_cents / 100, // Convert cents to euros
      quantity: quantity,
      maxQuantity: availableExtra.max_quantity
    }
    
    if (existingExtraIndex >= 0) {
      updatedParticipant.extras[existingExtraIndex] = extraData
    } else {
      updatedParticipant.extras.push(extraData)
    }
  }
  
  emit('update:participant', updatedParticipant)
}

const formatPrice = (cents: number, currency: string = 'EUR'): string => {
  const amount = typeof cents === 'number' ? cents / 100 : cents
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency
  }).format(amount)
}
</script>
