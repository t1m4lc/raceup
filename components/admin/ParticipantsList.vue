<template>
  <div>
    <div v-if="loading" class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
    
    <div v-else-if="participants.length === 0" class="text-center py-8">
      <p class="text-muted-foreground">No participants found.</p>
    </div>
    
    <div v-else class="space-y-2">
      <div 
        v-for="participant in participants" 
        :key="participant.id"
        class="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
        @click="$emit('select-participant', participant)"
      >
        <div class="flex items-center space-x-4">
          <Avatar>
            <AvatarFallback>
              {{ getInitials(participant.participant) }}
            </AvatarFallback>
          </Avatar>
          
          <div class="space-y-1">
            <p class="font-medium">{{ getDisplayName(participant.participant) }}</p>
            <div class="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{{ participant.ticket.race.name }}</span>
              <span>Ticket #{{ participant.ticket_number }}</span>
              <span class="capitalize">{{ participant.participant.gender }}</span>
            </div>
          </div>
        </div>
        
        <div class="flex items-center gap-3">
          <!-- Medical Status -->
          <div class="flex items-center gap-1">
            <div :class="participant.participant.certificate_url ? 'text-green-600' : 'text-orange-500'">
              <CheckCircle2Icon v-if="participant.participant.certificate_url" class="h-4 w-4" />
              <AlertCircleIcon v-else class="h-4 w-4" />
            </div>
            <span class="text-xs">
              {{ participant.medical_validated ? 'Validated' : 'Pending' }}
            </span>
          </div>
          
          <!-- Check-in Status -->
          <Badge :variant="getStatusVariant(participant)">
            {{ getStatusLabel(participant) }}
          </Badge>
          
          <!-- Actions -->
          <Button 
            variant="outline" 
            size="sm"
            @click.stop="$emit('select-participant', participant)"
          >
            <EyeIcon class="h-4 w-4 mr-1" />
            View
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2Icon, AlertCircleIcon, EyeIcon } from 'lucide-vue-next'
import { getDisplayName, getInitials } from '@/utils/nameHelpers'

interface Participant {
  id: string
  ticket_number: string
  status: string
  checked_in_at: string | null
  medical_validated: boolean
  participant: {
    id: string
    first_name: string
    last_name: string
    gender: string
    birthdate: string
    certificate_url: string | null
  }
  ticket: {
    id: string
    race: {
      id: string
      name: string
      distance_km: number
    }
  }
}

const props = defineProps<{
  participants: Participant[]
  loading: boolean
}>()

const emit = defineEmits<{
  'select-participant': [participant: Participant]
}>()

const getStatusVariant = (participant: Participant): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (participant.checked_in_at) {
    return 'default'
  } else if (participant.status === 'valid') {
    return 'outline'
  } else {
    return 'destructive'
  }
}

const getStatusLabel = (participant: Participant): string => {
  if (participant.checked_in_at) {
    return 'Checked In'
  } else if (participant.status === 'valid') {
    return 'Pending'
  } else {
    return participant.status.charAt(0).toUpperCase() + participant.status.slice(1)
  }
}
</script>
