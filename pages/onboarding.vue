<script setup lang="ts">
definePageMeta({
 layout: 'blank'
})

import { ref, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { CalendarIcon, UserIcon, PhoneIcon, TrophyIcon } from 'lucide-vue-next'

const currentStep = ref(1)
const totalSteps = 3
const isSubmitting = ref(false)

// Form data
const formData = ref({
 firstName: '',
 lastName: '',
 dateOfBirth: '',
 gender: '',
 phoneNumber: ''
})

// Form validation
const isStepValid = computed(() => {
 switch (currentStep.value) {
  case 1:
   return formData.value.firstName.trim() !== '' && formData.value.lastName.trim() !== ''
  case 2:
   return formData.value.dateOfBirth !== '' && formData.value.gender !== ''
  case 3:
   return formData.value.phoneNumber.trim() !== ''
  default:
   return false
 }
})

const canProceed = computed(() => isStepValid.value)

// Navigation functions
const nextStep = () => {
 if (currentStep.value < totalSteps && canProceed.value) {
  currentStep.value++
 }
}

const prevStep = () => {
 if (currentStep.value > 1) {
  currentStep.value--
 }
}

// Submit function
const submitForm = async () => {
 if (!canProceed.value) return

 isSubmitting.value = true

 try {
  const response = await $fetch('/api/onboarding', {
   method: 'POST',
   body: formData.value
  })

  if (response.success) {
   await navigateTo('/')
  }
 } catch (error) {
  console.error('Error submitting onboarding:', error)
  // Handle error (show toast, etc.)
 } finally {
  isSubmitting.value = false
 }
}

// Clean motivational messages for each step (no emojis)
const stepMessages: Record<number, string> = {
 1: "Welcome to RaceUp! Let's get your runner profile started",
 2: "Personal details for race categories and records",
 3: "Contact info for race updates and notifications"
}

const stepIcons: Record<number, any> = {
 1: UserIcon,
 2: CalendarIcon,
 3: PhoneIcon
}

const genderOptions = [
 { value: 'male', label: 'Male' },
 { value: 'female', label: 'Female' }
]
</script>

<template>
 <div class="min-h-screen bg-white flex items-center justify-center p-4">
  <div class="w-full max-w-2xl">
   <Card class="border-2">
    <CardHeader class="text-center">
     <div class="flex justify-center mb-4">
      <div class="p-3 bg-gray-100 rounded-full">
       <component :is="stepIcons[currentStep]" class="h-8 w-8 text-black" />
      </div>
     </div>
     <CardTitle class="text-2xl text-black">{{ stepMessages[currentStep] }}</CardTitle>
     <CardDescription class="text-base text-gray-600">
      <span v-if="currentStep === 1">Your basic information for race registration</span>
      <span v-else-if="currentStep === 2">Required for age categories and race records</span>
      <span v-else>Stay connected with race updates and results</span>
     </CardDescription>
    </CardHeader>

     <CardContent class="space-y-6">
      <!-- Step 1: Name -->
      <div v-if="currentStep === 1" class="space-y-4">
       <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="space-y-2">
         <Label for="firstName" class="text-sm font-medium text-black">First Name</Label>
         <Input id="firstName" v-model="formData.firstName" placeholder="Enter your first name" class="h-11 border-gray-300 focus:border-black" required />
        </div>
        <div class="space-y-2">
         <Label for="lastName" class="text-sm font-medium text-black">Last Name</Label>
         <Input id="lastName" v-model="formData.lastName" placeholder="Enter your last name" class="h-11 border-gray-300 focus:border-black" required />
        </div>
       </div>
       <div class="text-sm text-gray-600">
        <p>Your name will appear on race bibs and certificates</p>
       </div>
      </div>

      <!-- Step 2: Date of Birth & Gender -->
      <div v-if="currentStep === 2" class="space-y-4">
       <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="space-y-2">
         <Label for="dateOfBirth" class="text-sm font-medium text-black">Date of Birth</Label>
         <Input 
           id="dateOfBirth" 
           v-model="formData.dateOfBirth" 
           type="date" 
           class="h-11 border-gray-300 focus:border-black" 
           required 
         />
        </div>
        <div class="space-y-2">
         <Label for="gender" class="text-sm font-medium text-black">Gender</Label>
         <Select v-model="formData.gender" required>
          <SelectTrigger class="h-11 border-gray-300 focus:border-black">
           <SelectValue placeholder="Select gender" />
          </SelectTrigger>
          <SelectContent>
           <SelectItem v-for="option in genderOptions" :key="option.value" :value="option.value">
            {{ option.label }}
           </SelectItem>
          </SelectContent>
         </Select>
        </div>
       </div>
       <div class="text-sm text-gray-600">
        <p>Used for age group categories and race rankings</p>
       </div>
      </div>

      <!-- Step 3: Phone Number -->
      <div v-if="currentStep === 3" class="space-y-4">
       <div class="space-y-2">
        <Label for="phoneNumber" class="text-sm font-medium text-black">Phone Number</Label>
        <Input id="phoneNumber" v-model="formData.phoneNumber" type="tel" placeholder="+1 (555) 123-4567" class="h-11 border-gray-300 focus:border-black" required />
       </div>
       <div class="text-sm text-gray-600">
        <p>For race day communications and emergency contact</p>
        <p>We respect your privacy and won't spam you</p>
       </div>
      </div>

      <!-- Navigation Buttons -->
      <div class="flex flex-col sm:flex-row gap-3 pt-6">
       <Button v-if="currentStep > 1" @click="prevStep" variant="outline" class="flex-1 h-11 border-gray-300 text-black hover:bg-gray-50">
        Previous Step
       </Button>

       <Button v-if="currentStep < totalSteps" @click="nextStep" :disabled="!canProceed" class="flex-1 h-11 bg-black text-white hover:bg-gray-800">
        Continue
       </Button>

       <Button v-if="currentStep === totalSteps" @click="submitForm" :disabled="!canProceed || isSubmitting" class="flex-1 h-11 bg-black text-white hover:bg-gray-800">
        <div v-if="isSubmitting" class="flex items-center gap-2">
         <div class="animate-spin h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></div>
         Setting up your profile...
        </div>
        <div v-else class="flex items-center gap-2">
         Complete Registration
         <TrophyIcon class="h-4 w-4" />
        </div>
       </Button>
      </div>
     </CardContent>
    </Card>
   </div>
  </div>
 </template>
