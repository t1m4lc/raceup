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
          <Tabs :model-value="activeTab" @update:model-value="$emit('update:active-tab', $event)" class="w-full">
            <div class="overflow-x-auto">
              <TabsList class="w-max min-w-full mb-2 flex">
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
                  <Input 
                    :id="`birthdate-${index}`"
                    type="date"
                    v-model="participant.birthdate"
                    class="w-full"
                  />
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
          <div class="mb-4">
            <Label for="name-0">Full Name</Label>
            <Input
              id="name-0"
              v-model="participants[0].full_name"
              placeholder="John Doe"
              required
            />
          </div>
          
          <div class="mb-4">
            <Label for="birthdate-0">Birthdate</Label>
            <Input 
              id="birthdate-0"
              type="date"
              v-model="participants[0].birthdate"
              class="w-full"
            />
          </div>
          
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
          
          <div class="mb-4">
            <Alert variant="default" class="bg-muted/50">
              <AlertDescription>
                You'll be able to upload your medical certificate after registration in the ticket details page.
              </AlertDescription>
            </Alert>
          </div>
        </div>
        
        <div class="flex gap-3">
          <Button variant="outline" class="flex-1" @click="$emit('prev-step')">Back</Button>
          <Button class="flex-1" @click="$emit('next-step')">Continue</Button>
        </div>
      </div>
    </div>
    
    <!-- Step 3: Optional Extras -->
    <div v-if="currentStep === 2">
      <div class="mb-4">
        <h3 class="text-lg font-semibold">Optional Extras</h3>
        <p class="text-sm text-muted-foreground">Select any optional extras</p>
      </div>
      
      <div class="space-y-6">
        <!-- Multiple participants: show tabs -->
        <div v-if="participants.length > 1">
          <Tabs :model-value="activeTab" @update:model-value="$emit('update:active-tab', $event)" class="w-full">
            <div class="overflow-x-auto">
              <TabsList class="w-max min-w-full mb-2 flex">
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
                <div class="space-y-4">
                  <div>
                    <Label>Available Extras</Label>
                    <div class="mt-2 space-y-2">
                      <div v-for="extra in availableExtras" :key="extra.id" class="flex items-center space-x-2">
                        <Checkbox 
                          :id="`${extra.id}-${index}`" 
                          :checked="extraSelections[index]?.[extra.id]"
                          @update:checked="(checked: boolean) => {
                            extraSelections[index][extra.id] = checked;
                            $emit('update:extras', index);
                          }"
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
                  :checked="extraSelections[0]?.[extra.id]"
                  @update:checked="(checked: boolean) => {
                    extraSelections[0][extra.id] = checked;
                    $emit('update:extras', 0);
                  }"
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
        
        <div class="flex gap-3">
          <Button variant="outline" class="flex-1" @click="$emit('prev-step')">Back</Button>
          <Button class="flex-1" @click="$emit('add-to-cart')">Add to Cart</Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'

const props = defineProps<{
  currentStep: number
  participants: any[]
  participantCount: number
  activeTab: string
  availableExtras: any[]
  extraSelections: any
  race: any
}>()

const emit = defineEmits<{
  'update:participant-count': [value: number]
  'update:participants': []
  'update:active-tab': [value: string | number]
  'update:extras': [index: number]
  'next-step': []
  'prev-step': []
  'add-to-cart': []
}>()

const { $dayjs } = useNuxtApp()

const formatDate = (date: string) => {
  return $dayjs(date).format('DD MMMM YYYY')
}

const formatPrice = (priceCents: number, currency: string = 'EUR') => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
  }).format(priceCents / 100)
}
</script>
