<template>
  <div class="space-y-4">
    <!-- "It's me?" Switch for logged-in users - Only for first participant -->
    <!-- Use min-height to maintain consistent spacing -->
    <div class="min-h-[72px]">
      <div v-if="isLoggedIn && index === 0" class="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <div class="space-y-1">
          <div class="flex items-center space-x-2">
            <Switch 
              :id="`its-me-${index}`"
              :checked="participant.isUser"
              @update:checked="toggleUserLink"
            />
            <Label :for="`its-me-${index}`" class="font-medium">It's me?</Label>
          </div>
          <p class="text-sm text-muted-foreground">
            Link this registration to your profile for race history tracking
          </p>
        </div>
      </div>
    </div>

    <!-- First Name and Last Name - Side by Side -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <Label :for="`first-name-${index}`">First Name *</Label>
        <Input
          :id="`first-name-${index}`"
          :model-value="participant.first_name"
          @update:model-value="updateField('first_name', $event)"
          placeholder="John"
          required
          :disabled="participant.isUser && userProfile?.first_name"
        />
      </div>

      <div>
        <Label :for="`last-name-${index}`">Last Name *</Label>
        <Input
          :id="`last-name-${index}`"
          :model-value="participant.last_name"
          @update:model-value="updateField('last_name', $event)"
          placeholder="Doe"
          required
          :disabled="participant.isUser && userProfile?.last_name"
        />
      </div>
    </div>
    
    <!-- Birthdate -->
    <div>
      <Label :for="`birthdate-${index}`">Birth Date *</Label>
      <Input 
        :id="`birthdate-${index}`"
        type="date"
        :model-value="participant.birthdate"
        @update:model-value="updateField('birthdate', $event)"
        required
        :disabled="participant.isUser && userProfile?.date_of_birth"
      />
    </div>
    
    <!-- Gender -->
    <div>
      <Label :for="`gender-${index}`">Gender *</Label>
      <Select 
        :model-value="participant.gender"
        @update:model-value="updateField('gender', $event)"
        :disabled="participant.isUser && !!userProfile?.gender"
      >
        <SelectTrigger :id="`gender-${index}`">
          <SelectValue placeholder="Select gender" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="male">Male</SelectItem>
          <SelectItem value="female">Female</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Emergency Contact with Toggle -->
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h4 class="font-medium">Emergency Contact</h4>
        <div class="flex items-center space-x-2">
          <Switch 
            :id="`emergency-toggle-${index}`"
            :checked="showEmergencyContact"
            @update:checked="toggleEmergencyContact"
          />
          <Label :for="`emergency-toggle-${index}`" class="text-sm">
            Add emergency contact
          </Label>
        </div>
      </div>
      
      <div v-if="showEmergencyContact" class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg">
        <div>
          <Label :for="`emergency-name-${index}`">Emergency contact name</Label>
          <Input
            :id="`emergency-name-${index}`"
            :model-value="participant.emergencyContactName"
            @update:model-value="updateField('emergencyContactName', $event)"
            placeholder="Contact name"
          />
        </div>
        <div>
          <Label :for="`emergency-phone-${index}`">Emergency contact phone</Label>
          <Input
            :id="`emergency-phone-${index}`"
            :model-value="participant.emergencyContactPhone"
            @update:model-value="updateField('emergencyContactPhone', $event)"
            placeholder="Phone number"
            type="tel"
          />
        </div>
      </div>
    </div>

    <!-- Medical Notes with Toggle -->
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h4 class="font-medium">Medical Information</h4>
        <div class="flex items-center space-x-2">
          <Switch 
            :id="`medical-toggle-${index}`"
            :checked="showMedicalNotes"
            @update:checked="toggleMedicalNotes"
          />
          <Label :for="`medical-toggle-${index}`" class="text-sm">
            Add medical notes
          </Label>
        </div>
      </div>
      
      <div v-if="showMedicalNotes" class="p-3 bg-muted/30 rounded-lg">
        <Label :for="`medical-notes-${index}`">Medical Notes</Label>
        <Textarea
          :id="`medical-notes-${index}`"
          :model-value="participant.medicalNotes"
          @update:model-value="updateField('medicalNotes', $event)"
          placeholder="Any medical conditions or allergies the organizers should know about..."
          rows="3"
          class="mt-1"
        />
      </div>
    </div>
    
    <!-- Available Extras section removed - moved to separate step -->
    
    <!-- Note about medical certificate -->
    <Alert>
      <InfoIcon class="h-4 w-4" />
      <AlertTitle>Medical Certificate</AlertTitle>
      <AlertDescription>
        You'll be able to upload your medical certificate after registration in your ticket details.
      </AlertDescription>
    </Alert>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { InfoIcon } from 'lucide-vue-next'
import type { CartParticipant, CartExtra, TicketExtra } from '@/types/participant'

export interface UserProfile {
  id: string
  first_name?: string
  last_name?: string
  email?: string
  date_of_birth?: string
  gender?: string
}

const props = defineProps<{
  participant: CartParticipant
  index: number
  availableExtras: TicketExtra[]
  isLoggedIn?: boolean
  userProfile?: UserProfile
}>()

const emit = defineEmits<{
  'update:participant': [participant: CartParticipant]
}>()

// Reactive state for toggles
const showEmergencyContact = ref(false)
const showMedicalNotes = ref(false)

// Initialize toggles based on existing data
watchEffect(() => {
  showEmergencyContact.value = !!(props.participant.emergencyContactName || props.participant.emergencyContactPhone)
  showMedicalNotes.value = !!props.participant.medicalNotes
})

const updateField = (field: keyof CartParticipant, value: any) => {
  console.log(`Updating field ${field} with value:`, value) // Debug log
  const updatedParticipant = { ...props.participant, [field]: value }
  emit('update:participant', updatedParticipant)
}

const toggleUserLink = (checked: boolean) => {
  console.log(`Toggle user link: ${checked}`) // Debug log
  const updatedParticipant = { ...props.participant }
  
  if (checked && props.userProfile) {
    // Pre-fill with user data
    updatedParticipant.isUser = true
    updatedParticipant.userId = props.userProfile.id
    updatedParticipant.first_name = props.userProfile.first_name || ''
    updatedParticipant.last_name = props.userProfile.last_name || ''
    updatedParticipant.birthdate = props.userProfile.date_of_birth || ''
    updatedParticipant.gender = props.userProfile.gender || ''
  } else {
    // Clear user link
    updatedParticipant.isUser = false
    updatedParticipant.userId = undefined
    if (checked) {
      // If checking but no profile, just clear the form
      updatedParticipant.first_name = ''
      updatedParticipant.last_name = ''
      updatedParticipant.birthdate = ''
      updatedParticipant.gender = ''
    }
  }
  
  emit('update:participant', updatedParticipant)
}

const toggleEmergencyContact = (checked: boolean) => {
  showEmergencyContact.value = checked
  if (!checked) {
    // Clear emergency contact fields when toggled off
    const updatedParticipant = { 
      ...props.participant, 
      emergencyContactName: '',
      emergencyContactPhone: ''
    }
    emit('update:participant', updatedParticipant)
  }
}

const toggleMedicalNotes = (checked: boolean) => {
  showMedicalNotes.value = checked
  if (!checked) {
    // Clear medical notes when toggled off
    const updatedParticipant = { 
      ...props.participant, 
      medicalNotes: ''
    }
    emit('update:participant', updatedParticipant)
  }
}

const formatPrice = (priceCents: number, currency: string = 'EUR') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'EUR',
  }).format(priceCents / 100)
}
</script>
