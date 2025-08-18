<template>
  <div>
    <!-- Desktop Dialog (≥1024px) -->
    <Dialog :open="open && (mode === 'dialog' || (!mode && !isMobile))" @update:open="(value) => $emit('update:open', value)">
      <DialogContent class="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader class="flex-shrink-0">
          <DialogTitle>Register for {{ race?.name }}</DialogTitle>
          <DialogDescription class="flex items-center gap-4 text-sm">
            <span class="font-medium">{{ formatPrice(race?.price_cents, race?.currency) }}</span>
          </DialogDescription>
        </DialogHeader>
        
        <!-- Stepper -->
        <div class="flex-shrink-0 px-1">
          <div class="flex items-center justify-between mb-6">
            <div v-for="(step, index) in steps" :key="index" class="flex items-center">
              <div 
                :class="[
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                  currentStep >= index 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                ]"
              >
                {{ index + 1 }}
              </div>
              <span 
                :class="[
                  'ml-2 text-sm',
                  currentStep >= index ? 'text-foreground' : 'text-muted-foreground'
                ]"
              >
                {{ step.title }}
              </span>
              <div 
                v-if="index < steps.length - 1" 
                :class="[
                  'w-12 h-0.5 mx-4',
                  currentStep > index ? 'bg-primary' : 'bg-muted'
                ]"
              ></div>
            </div>
          </div>
        </div>
        
        <!-- Content Area -->
        <div class="flex-grow overflow-y-auto px-1">
          <RegistrationSteps 
            :current-step="currentStep"
            :participants="participants"
            :participant-count="participantCount"
            :active-tab="activeTab"
            :available-extras="availableExtras"
            :extra-selections="extraSelections"
            :race="race"
            :is-logged-in="!!user"
            :user-profile="userProfile"
            @update:participant-count="participantCount = $event"
            @update:participants="updateParticipantForms"
            @update:participant="updateParticipant"
            @update:active-tab="activeTab = String($event)"
            @update:extras="updateExtras"
            @next-step="nextStep"
            @prev-step="prevStep"
            @add-to-cart="addToCart"
          />
        </div>
      </DialogContent>
    </Dialog>

    <!-- Mobile Drawer (<1024px) -->
    <Drawer :open="open && (mode === 'drawer' || (!mode && isMobile))" @update:open="(value) => $emit('update:open', value)">
      <DrawerContent class="max-h-[90vh] flex flex-col">
        <DrawerHeader class="pb-2 flex-shrink-0">
          <div class="flex items-center justify-between">
            <DrawerTitle class="text-lg">Register for {{ race?.name }}</DrawerTitle>
            <span class="font-semibold text-primary">{{ formatPrice(race?.price_cents, race?.currency) }}</span>
          </div>
        </DrawerHeader>
        
        <div class="px-4 pb-4 flex-grow overflow-y-auto">

          <RegistrationSteps 
            :current-step="currentStep"
            :participants="participants"
            :participant-count="participantCount"
            :active-tab="activeTab"
            :available-extras="availableExtras"
            :extra-selections="extraSelections"
            :race="race"
            :is-logged-in="!!user"
            :user-profile="userProfile"
            @update:participant-count="participantCount = $event"
            @update:participants="updateParticipantForms"
            @update:participant="updateParticipant"
            @update:active-tab="activeTab = String($event)"
            @update:extras="updateExtras"
            @next-step="nextStep"
            @prev-step="prevStep"
            @add-to-cart="addToCart"
          />
        </div>
      </DrawerContent>
    </Drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import RegistrationSteps from '@/components/cart/RegistrationSteps.vue'
import { useCartStore } from '@/stores/cart'
import type { CartParticipant } from '@/types/participant'

const props = defineProps<{
  open: boolean
  race: any
  mode?: 'dialog' | 'drawer'
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'added-to-cart': []
}>()

// Responsive detection with VueUse
import { useWindowSize } from '@vueuse/core'
const { width } = useWindowSize()
const isMobile = computed(() => width.value < 1024) // lg breakpoint

// Cart store
const cartStore = useCartStore()

// User state
const user = useSupabaseUser()
const userProfile = ref<any>(null) // This would be loaded from a profile API

// Steps configuration
const steps = [
  { title: 'Participants', description: 'How many people?' },
  { title: 'Details', description: 'Personal information' },
  { title: 'Extras', description: 'Optional add-ons' }
]

// State
const currentStep = ref(0)
const participantCount = ref(1)
const participants = ref<CartParticipant[]>([])
const activeTab = ref('participant-0')
const availableExtras = ref([
  { id: 'tshirt', name: 'Event T-Shirt', price_cents: 2500 },
  { id: 'photos', name: 'Race Photos', price_cents: 1500 },
])
const extraSelections = ref<Record<number, Record<string, boolean>>>({})

const formatPrice = (priceCents: number, currency: string = 'EUR') => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
  }).format(priceCents / 100)
}

const nextStep = () => {
  if (currentStep.value < steps.length - 1) {
    currentStep.value++
    // Reset active tab when moving to next step
    if (currentStep.value === 2) {
      activeTab.value = 'participant-0'
    }
  }
}

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const updateParticipantForms = () => {
  const count = participantCount.value
  participants.value = Array.from({ length: count }, (_, index) => ({
    first_name: '',
    last_name: '',
    birthdate: '',
    gender: '',
    extras: [], // Now properly typed as CartExtra[]
    isUser: false,
    emergencyContactName: '',
    emergencyContactPhone: '',
    medicalNotes: ''
  }))
  
  // Reset extra selections
  extraSelections.value = {}
  for (let i = 0; i < count; i++) {
    extraSelections.value[i] = {}
    availableExtras.value.forEach(extra => {
      extraSelections.value[i][extra.id] = false
    })
  }
  
  activeTab.value = 'participant-0'
}

const updateExtras = (participantIndex: number) => {
  // This function is now handled by the individual ParticipantForm components
  // via the new updateParticipant function
}

const updateParticipant = (index: number, updatedParticipant: CartParticipant) => {
  // Use Vue's reactivity to ensure updates are detected
  participants.value = [
    ...participants.value.slice(0, index),
    updatedParticipant,
    ...participants.value.slice(index + 1)
  ]
}

const addToCart = () => {
  if (!props.race) return
  
  // Convert participants to the format expected by the cart store
  const cartParticipants = participants.value.map(participant => {
    return {
      first_name: participant.first_name,
      last_name: participant.last_name,
      birthdate: participant.birthdate,
      gender: participant.gender,
      extras: participant.extras || [], // Keep as CartExtra[] objects
      certificate_url: participant.certificate_url,
      emergencyContactName: participant.emergencyContactName,
      emergencyContactPhone: participant.emergencyContactPhone,
      medicalNotes: participant.medicalNotes
    }
  })
  
  // Generate unique ID for the cart item
  const itemId = Date.now().toString() + Math.random().toString(36).substr(2, 9)
  
  // Create cart item from current registration data
  // Keep the original race price - extras will be handled separately in display
  const cartItem = {
    id: itemId,
    raceId: props.race.id,
    raceName: props.race.name,
    raceDate: props.race.start_time,
    distance: props.race.distance_km || 0,
    price: props.race.price_cents, // Base price per participant
    currency: props.race.currency || 'EUR',
    participants: cartParticipants,
    organizationId: props.race.organization_id || ''
  }
  
  // Add to cart store
  cartStore.addItem(cartItem)
  
  // Open cart after adding item
  cartStore.openCart()
  
  // Emit events
  emit('added-to-cart')
  emit('update:open', false)
}

// Initialize
updateParticipantForms()
</script>
