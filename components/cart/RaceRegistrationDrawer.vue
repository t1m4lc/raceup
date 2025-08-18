<template>
  <div>
    <Drawer :open="open" @update:open="(value) => $emit('update:open', value)">
      <DrawerContent class="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle class="text-xl font-semibold">Register for {{ race?.name }}</DrawerTitle>
          <DrawerDescription>
            <span class="text-sm font-medium">{{ formatPrice(race?.price_cents, race?.currency) }}</span>
          </DrawerDescription>
        </DrawerHeader>
        
        <div class="p-4 sm:p-6">
          <div class="space-y-4">
            <!-- Step 1: Number of Participants -->
            <div v-if="currentStep === 0">
              <div class="mb-6">
                <h3 class="text-sm text-muted-foreground">How many people are you registering?</h3>
              </div>
              
              <div class="space-y-6">
                <div>
                  <Label for="participantCount" class="sr-only">Number of participants</Label>
                  <Input 
                    id="participantCount"
                    type="number"
                    min="1"
                    max="10"
                    v-model="participantCount"
                    class="w-full"
                    @change="updateParticipantForms"
                  />
                </div>
                
                <Button class="w-full" @click="nextStep">Continue</Button>
              </div>
            </div>
            
            <!-- Step 2: Participant Details -->
            <div v-if="currentStep === 1">
              <div class="mb-6">
                <h3 class="text-xl font-semibold mb-2">Participant Details</h3>
                <p class="text-sm text-muted-foreground">Fill in the details for each participant</p>
              </div>
              
              <div class="space-y-6">
                <!-- Multiple participants: show tabs -->
                <div v-if="participants.length > 1">
                  <Tabs v-model="activeTab" class="w-full">
                    <div class="overflow-x-auto">
                      <TabsList class="w-max min-w-full mb-4 flex">
                        <TabsTrigger 
                          v-for="(_, index) in participants" 
                          :key="index" 
                          :value="`participant-${index}`"
                          class="flex-shrink-0 min-w-[120px]"
                        >
                          Participant {{ index + 1 }}
                        </TabsTrigger>
                      </TabsList>
                    </div>
                    
                    <div v-for="(participant, index) in participants" :key="index">
                      <TabsContent :value="`participant-${index}`">
                        <!-- Name -->
                        <div class="mb-4">
                          <Label :for="`name-${index}`">Full Name</Label>
                          <Input
                            :id="`name-${index}`"
                            v-model="participant.full_name"
                            placeholder="John Doe"
                            required
                          />
                        </div>
                        
                        <!-- Birthdate -->
                        <div class="mb-4">
                          <Label :for="`birthdate-${index}`">Birthdate</Label>
                          <Popover>
                            <PopoverTrigger as-child>
                              <Button
                                variant="outline"
                                :class="[
                                  'w-full justify-start text-left font-normal',
                                  !participant.birthdate && 'text-muted-foreground'
                                ]"
                              >
                                <CalendarIcon class="mr-2 h-4 w-4" />
                                {{ participant.birthdate ? formatDate(participant.birthdate) : 'Select date' }}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent class="w-auto p-0">
                              <DatePicker 
                                v-model="participant.birthdate"
                                :max="new Date()"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        
                        <!-- Gender -->
                        <div class="mb-4">
                          <Label :for="`gender-${index}`">Gender</Label>
                          <Select v-model="participant.gender">
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <!-- Note about medical certificate -->
                        <div class="mb-4">
                          <Alert variant="default" class="bg-muted/50">
                            <AlertDescription>
                              You'll be able to upload your medical certificate after registration in the ticket details page.
                            </AlertDescription>
                          </Alert>
                        </div>
                      </TabsContent>
                    </div>
                  </Tabs>
                </div>
                
                <!-- Single participant: show form directly -->
                <div v-else-if="participants.length === 1" class="space-y-4">
                  <!-- Name -->
                  <div class="mb-4">
                    <Label for="name-0">Full Name</Label>
                    <Input
                      id="name-0"
                      v-model="participants[0].full_name"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  
                  <!-- Birthdate -->
                  <div class="mb-4">
                    <Label for="birthdate-0">Birthdate</Label>
                    <Popover>
                      <PopoverTrigger as-child>
                        <Button
                          variant="outline"
                          :class="[
                            'w-full justify-start text-left font-normal',
                            !participants[0].birthdate && 'text-muted-foreground'
                          ]"
                        >
                          <CalendarIcon class="mr-2 h-4 w-4" />
                          {{ participants[0].birthdate ? formatDate(participants[0].birthdate) : 'Select date' }}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent class="w-auto p-0">
                        <DatePicker 
                          v-model="participants[0].birthdate"
                          :max="new Date()"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <!-- Gender -->
                  <div class="mb-4">
                    <Label for="gender-0">Gender</Label>
                    <Select v-model="participants[0].gender">
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <!-- Note about medical certificate -->
                  <div class="mb-4">
                    <Alert variant="default" class="bg-muted/50">
                      <AlertDescription>
                        You'll be able to upload your medical certificate after registration in the ticket details page.
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
                
                <Button class="w-full" @click="nextStep">Continue</Button>
              </div>
            </div>
            
            <!-- Step 3: Optional Extras -->
            <div v-if="currentStep === 2">
              <div class="mb-6">
                <h3 class="text-xl font-semibold mb-2">Optional Extras</h3>
                <p class="text-sm text-muted-foreground">Select any optional extras</p>
              </div>
              
              <div class="space-y-6">
                <!-- Multiple participants: show tabs -->
                <div v-if="participants.length > 1">
                  <Tabs v-model="activeTab" class="w-full">
                    <div class="overflow-x-auto">
                      <TabsList class="w-max min-w-full mb-4 flex">
                        <TabsTrigger 
                          v-for="(_, index) in participants" 
                          :key="index" 
                          :value="`extras-${index}`"
                          class="flex-shrink-0 min-w-[120px]"
                        >
                          Participant {{ index + 1 }}
                        </TabsTrigger>
                      </TabsList>
                    </div>
                    
                    <div v-for="(participant, index) in participants" :key="index">
                      <TabsContent :value="`extras-${index}`">
                        <div class="space-y-4">
                          <div>
                            <Label>Available Extras</Label>
                            <div class="mt-2 space-y-2">
                              <div v-for="extra in availableExtras" :key="extra.id" class="flex items-center space-x-2">
                                <Checkbox 
                                  :id="`${extra.id}-${index}`" 
                                  v-model:checked="extraSelections[index][extra.id]"
                                  @update:checked="updateExtras(index)"
                                />
                                <label 
                                  :for="`${extra.id}-${index}`"
                                  class="flex items-center justify-between w-full text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  <span>{{ extra.name }}</span>
                                  <span>{{ formatPrice(extra.price_cents, race?.currency) }}</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    </div>
                  </Tabs>
                </div>
                
                <!-- Single participant: show form directly -->
                <div v-else-if="participants.length === 1" class="space-y-4">
                  <div>
                    <Label>Available Extras</Label>
                    <div class="mt-2 space-y-2">
                      <div v-for="extra in availableExtras" :key="extra.id" class="flex items-center space-x-2">
                        <Checkbox 
                          :id="`${extra.id}-0`" 
                          v-model:checked="extraSelections[0][extra.id]"
                          @update:checked="updateExtras(0)"
                        />
                        <label 
                          :for="`${extra.id}-0`"
                          class="flex items-center justify-between w-full text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          <span>{{ extra.name }}</span>
                          <span>{{ formatPrice(extra.price_cents, race?.currency) }}</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Button class="w-full" @click="addToCart">Add to Cart</Button>
              </div>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useCartStore, type CartParticipant } from '~/stores/cart'
import type { CartExtra } from '~/types/participant'
import { CalendarIcon } from 'lucide-vue-next'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { DatePicker } from '@/components/ui/date-picker'
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'


const props = defineProps({
  open: {
    type: Boolean,
    required: true
  },
  race: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:open', 'added-to-cart'])

const { $dayjs } = useNuxtApp()
const cartStore = useCartStore()

const participantCount = ref(1)
const currentStep = ref(0)
const activeTab = ref('participant-0')

const participants = ref<CartParticipant[]>([])

// Sample extras - in a real app, these would come from the API
const availableExtras = [
  { id: 'tshirt', name: 'Event T-Shirt', price_cents: 1500 },
  { id: 'medal', name: 'Medal Engraving', price_cents: 1000 },
  { id: 'meal', name: 'Post-race Meal', price_cents: 1200 },
]

// Track extras selections
const extraSelections = reactive<{ [index: number]: { [key: string]: boolean } }>({})

// Initialize participant forms


const updateParticipantForms = () => {
  const count = parseInt(participantCount.value.toString())
  
  if (count < participants.value.length) {
    // Remove excess participants
    participants.value = participants.value.slice(0, count)
  } else {
    // Add new participants
    while (participants.value.length < count) {
      const newIndex = participants.value.length
      participants.value.push({
        first_name: '',
        last_name: '',
        birthdate: '',
        gender: '',
        extras: []
      })
      
      // Initialize extras selection for this participant
      if (!extraSelections[newIndex]) {
        extraSelections[newIndex] = {}
        availableExtras.forEach(extra => {
          extraSelections[newIndex][extra.id] = false
        })
      }
    }
  }
}

// Update extras when checkboxes change
const updateExtras = (participantIndex: number) => {
  const selectedExtras: CartExtra[] = []
  
  availableExtras.forEach(extra => {
    if (extraSelections[participantIndex][extra.id]) {
      selectedExtras.push({
        id: extra.id,
        name: extra.name,
        price: extra.price_cents / 100, // Convert cents to euros
        quantity: 1, // Default quantity is 1 for checkboxes
      })
    }
  })
  
  participants.value[participantIndex].extras = selectedExtras
}

// Move to next step
const nextStep = () => {
  if (currentStep.value === 0) {
    currentStep.value = 1
    activeTab.value = 'participant-0'
  } else if (currentStep.value === 1) {
    // Validate participant details
    const allValid = participants.value.every(p => 
      p.first_name && p.last_name && p.birthdate && p.gender
    )
    
    if (!allValid) {
      alert('Please complete all participant details')
      return
    }
    
    currentStep.value = 2
    activeTab.value = 'extras-0'
  }
}

// Move to previous step
const prevStep = () => {
  if (currentStep.value === 1) {
    currentStep.value = 0
  } else if (currentStep.value === 2) {
    currentStep.value = 1
    activeTab.value = 'participant-0'
  }
}

// Add to cart
const addToCart = () => {
  if (!props.race) return
  
  cartStore.addItem({
    id: cartStore.generateId(),
    raceId: props.race.id,
    raceName: props.race.name,
    raceDate: props.race.start_time,
    distance: props.race.distance_km,
    price: props.race.price_cents,
    currency: props.race.currency || 'EUR',
    participants: [...participants.value],
    organizationId: props.race.organizationId
  })
  
  // Reset form
  currentStep.value = 0
  participantCount.value = 1
  participants.value = []
  updateParticipantForms()
  
  // Close drawer
  emit('update:open', false)
  emit('added-to-cart')
  
  // Open cart
  setTimeout(() => {
    cartStore.openCart()
  }, 500)
}

// Medical certificate upload will be handled after registration in the ticket details page

// Format date
const formatDate = (date: string) => {
  if (!date) return ''
  return $dayjs(date).format('MMM D, YYYY')
}

// Format price
const formatPrice = (priceCents: number, currency = 'EUR') => {
  if (!priceCents) return ''
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(priceCents / 100)
}

// Watch for drawer open to initialize participants
watch(() => props.open, (newValue) => {
  if (newValue) {
    updateParticipantForms()
  }
})

// Initialize participants on component mount
updateParticipantForms()
</script>
