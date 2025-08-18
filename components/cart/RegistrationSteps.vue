<template>
  <div class="space-y-4">
    <!-- Step 1: Number of Participants -->
    <div v-if="currentStep === 0">
      <div class="mb-4">
        <h3 class="text-lg font-semibold">Number of Participants</h3>
        <p class="text-sm text-muted-foreground">How many people are you registering?</p>
      </div>
      
      <div class="space-y-4">
        <div>
          <Label for="participantCount" class="sr-only">Number of participants</Label>
          <Input 
            id="participantCount"
            type="number"
            min="1"
            max="10"
            :model-value="participantCount"
            @update:model-value="$emit('update:participant-count', Number($event))"
            class="w-full"
            @change="$emit('update:participants')"
          />
        </div>
        
        <Button class="w-full" @click="$emit('next-step')">Continue</Button>
      </div>
    </div>
    
    <!-- Step 2: Participant Details -->
    <div v-if="currentStep === 1">
      <div class="mb-4">
        <h3 class="text-lg font-semibold">Participant Details</h3>
        <p class="text-sm text-muted-foreground">Fill in the details for each participant</p>
      </div>
      
      <div class="space-y-6">
        <!-- Multiple participants: show tabs -->
        <div v-if="participants.length > 1">
          <Tabs :model-value="activeTab" @update:model-value="(value) => $emit('update:active-tab', String(value))" class="w-full">
            <div class="overflow-x-auto">
              <TabsList class="w-max min-w-full mb-2 flex">
                <TabsTrigger 
                  v-for="(_, index) in participants" 
                  :key="index" 
                  :value="`participant-${index}`"
                  class="flex-shrink-0 min-w-[120px]"
                >
                  Participant {{ index + 1 }}
                  <Badge v-if="participants[index].isUser" variant="secondary" class="ml-2">You</Badge>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div v-for="(participant, index) in participants" :key="index">
              <TabsContent :value="`participant-${index}`">
                <ParticipantForm 
                  :participant="participant"
                  :index="index"
                  :available-extras="availableExtras"
                  :is-logged-in="isLoggedIn"
                  :user-profile="userProfile"
                  @update:participant="updateParticipant(index, $event)"
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
        
        <!-- Single participant: direct form -->
        <div v-else-if="participants.length === 1">
          <ParticipantForm 
            :participant="participants[0]"
            :index="0"
            :available-extras="availableExtras"
            :is-logged-in="isLoggedIn"
            :user-profile="userProfile"
            @update:participant="updateParticipant(0, $event)"
          />
        </div>
        
        <div class="flex gap-2">
          <Button variant="outline" @click="$emit('prev-step')" class="flex-1">
            Back
          </Button>
          <Button @click="$emit('next-step')" :disabled="!isStepValid" class="flex-1">
            Continue
          </Button>
        </div>
      </div>
    </div>
    
    <!-- Step 3: Extras Selection -->
    <div v-if="currentStep === 2">
      <div class="mb-4">
        <h3 class="text-lg font-semibold">Optional Extras</h3>
        <p class="text-sm text-muted-foreground">Select any additional items for your participants</p>
      </div>
      
      <div class="space-y-6">
        <!-- Multiple participants: show tabs for extras -->
        <div v-if="participants.length > 1">
          <Tabs :model-value="activeTab" @update:model-value="(value) => $emit('update:active-tab', String(value))" class="w-full">
            <div class="overflow-x-auto">
              <TabsList class="w-max min-w-full mb-2 flex">
                <TabsTrigger 
                  v-for="(_, index) in participants" 
                  :key="index" 
                  :value="`participant-${index}`"
                  class="flex-shrink-0 min-w-[120px]"
                >
                  {{ getFullName(participants[index]) || `Participant ${index + 1}` }}
                  <Badge v-if="participants[index].isUser" variant="secondary" class="ml-2">You</Badge>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div v-for="(participant, index) in participants" :key="index">
              <TabsContent :value="`participant-${index}`">
                <ExtrasSelection
                  :participant="participant"
                  :index="index"
                  :available-extras="availableExtras"
                  @update:participant="updateParticipant(index, $event)"
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
        
        <!-- Single participant: direct extras form -->
        <div v-else-if="participants.length === 1">
          <ExtrasSelection
            :participant="participants[0]"
            :index="0"
            :available-extras="availableExtras"
            @update:participant="updateParticipant(0, $event)"
          />
        </div>
        
        <div class="flex gap-2">
          <Button variant="outline" @click="$emit('prev-step')" class="flex-1">
            Back
          </Button>
          <Button @click="$emit('add-to-cart')" class="flex-1">
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import ParticipantForm from '~/components/cart/ParticipantForm.vue'
import ExtrasSelection from './ExtrasSelection.vue'
import type { CartParticipant, CartExtra, TicketExtra } from '@/types/participant'
import { getFullName } from '@/types/participant'

export interface Race {
  id: string
  name: string
  distance_km: number
  price_cents: number
  currency: string
}

export interface UserProfile {
  id: string
  full_name?: string
  first_name?: string
  last_name?: string
  email?: string
  date_of_birth?: string
  gender?: string
}

const props = defineProps<{
  currentStep: number
  participants: CartParticipant[]
  participantCount: number
  activeTab: string
  availableExtras: TicketExtra[]
  extraSelections?: Record<number, Record<string, boolean>>
  race?: Race
  isLoggedIn?: boolean
  userProfile?: UserProfile
}>()

const emit = defineEmits<{
  'update:participant-count': [value: number]
  'update:participants': []
  'update:participant': [index: number, participant: CartParticipant]
  'update:active-tab': [value: string]
  'update:extras': [participantIndex: number]
  'next-step': []
  'prev-step': []
  'add-to-cart': []
}>()

const isStepValid = computed(() => {
  if (props.currentStep === 1) {
    const isValid = props.participants.every(p => 
      p.first_name.trim() !== '' && 
      p.last_name.trim() !== '' &&
      p.birthdate !== '' && 
      p.gender !== ''
    )
    console.log('Step validation:', isValid, props.participants) // Debug log
    return isValid
  }
  return true
})

const totalExtrasPrice = computed(() => {
  return props.participants.reduce((total, participant) => {
    const participantExtrasPrice = participant.extras.reduce((extrasTotal, extra) => {
      return extrasTotal + (extra.price * extra.quantity)
    }, 0)
    return total + participantExtrasPrice
  }, 0)
})

const updateParticipant = (index: number, updatedParticipant: CartParticipant) => {
  // Emit the updated participant data directly to the parent
  emit('update:participant', index, updatedParticipant)
}

const formatPrice = (priceCents: number, currency: string = 'EUR') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'EUR',
  }).format(priceCents / 100)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>
