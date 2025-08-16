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
            @update:participant-count="participantCount = $event"
            @update:participants="updateParticipantForms"
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
      <DrawerContent class="max-h-[90vh]">
        <DrawerHeader class="pb-2">
          <div class="flex items-center justify-between">
            <DrawerTitle class="text-lg">Register for {{ race?.name }}</DrawerTitle>
            <span class="font-semibold text-primary">{{ formatPrice(race?.price_cents, race?.currency) }}</span>
          </div>
        </DrawerHeader>
        
        <div class="px-4 pb-4">

          <RegistrationSteps 
            :current-step="currentStep"
            :participants="participants"
            :participant-count="participantCount"
            :active-tab="activeTab"
            :available-extras="availableExtras"
            :extra-selections="extraSelections"
            :race="race"
            @update:participant-count="participantCount = $event"
            @update:participants="updateParticipantForms"
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

// Steps configuration
const steps = [
  { title: 'Participants', description: 'How many people?' },
  { title: 'Details', description: 'Personal information' },
  { title: 'Extras', description: 'Optional add-ons' }
]

// State
const currentStep = ref(0)
const participantCount = ref(1)
const participants = ref<Array<{
  full_name: string
  birthdate: string
  gender: string
  extras: string[]
}>>([])
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
    full_name: '',
    birthdate: '',
    gender: '',
    extras: []
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
  const selectedExtras: string[] = []
  Object.entries(extraSelections.value[participantIndex]).forEach(([extraId, selected]) => {
    if (selected) {
      const extra = availableExtras.value.find(e => e.id === extraId)
      if (extra) {
        selectedExtras.push(extra.name)
      }
    }
  })
  participants.value[participantIndex].extras = selectedExtras
}

const addToCart = () => {
  if (!props.race) return
  
  // Generate unique ID for the cart item
  const itemId = Date.now().toString() + Math.random().toString(36).substr(2, 9)
  
  // Create cart item from current registration data
  const cartItem = {
    id: itemId,
    raceId: props.race.id,
    raceName: props.race.name,
    raceDate: props.race.start_time,
    distance: props.race.distance || 0,
    price: props.race.price_cents,
    currency: props.race.currency || 'EUR',
    participants: participants.value,
    organizationId: props.race.organization_id || ''
  }
  
  // Add to cart store
  cartStore.addItem(cartItem)
  
  // Emit events
  emit('added-to-cart')
  emit('update:open', false)
}

// Initialize
updateParticipantForms()
</script>
