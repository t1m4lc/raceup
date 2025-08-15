<template>
  <div>
    <div class="flex items-center justify-between space-y-2 mb-6">
      <div>
        <Button variant="outline" asChild class="mb-3">
          <NuxtLink to="/admin/events">
            <ArrowLeftIcon class="mr-2 h-4 w-4" />
            Back to Events
          </NuxtLink>
        </Button>
        <h2 class="text-3xl font-bold tracking-tight">{{ event?.name || 'Event Participants' }}</h2>
        <p class="text-muted-foreground">
          Manage participants for this event
        </p>
      </div>
      <div class="flex items-center space-x-2">
        <Button variant="outline">
          <DownloadIcon class="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>
    </div>
    
    <div v-if="loading" class="flex justify-center my-12">
      <div class="animate-spin h-12 w-12 border-t-4 border-b-4 border-primary rounded-full"></div>
    </div>
    
    <div v-else-if="error" class="bg-destructive/20 p-4 rounded-md text-destructive mb-4">
      {{ error }}
    </div>
    
    <div v-else>
      <div class="rounded-md border mb-4">
        <DataTable 
          :columns="columns" 
          :data="participants" 
          :filter-key="searchKey"
        >
          <template #search>
            <div class="flex items-center py-4">
              <Input
                placeholder="Search participants..."
                class="max-w-sm"
                v-model="searchKey"
              />
            </div>
          </template>
          
          <template #rowData="{ row, column }">
            <template v-if="column.key === 'name'">
              <div class="flex items-center">
                <Avatar class="h-8 w-8 mr-2">
                  <AvatarFallback>
                    {{ getInitials(row.name) }}
                  </AvatarFallback>
                </Avatar>
                <div class="flex flex-col">
                  <div>{{ row.name }}</div>
                  <div class="text-xs text-muted-foreground">
                    {{ row.gender }} • {{ formatDate(row.birthdate, 'YYYY-MM-DD') }}
                  </div>
                </div>
              </div>
            </template>
            
            <template v-else-if="column.key === 'race'">
              {{ row.race.name }} ({{ row.race.distance }}km)
            </template>
            
            <template v-else-if="column.key === 'certificate'">
              <div class="flex items-center gap-2">
                <Switch 
                  :checked="row.certificateValidated" 
                  @update:checked="updateCertificateStatus(row.id, $event)"
                  :disabled="isCertificateUpdating(row.id)"
                />
                <span class="text-xs">
                  {{ row.certificateValidated ? 'Validated' : 'Pending' }}
                </span>
                <Button v-if="row.certificateUrl" variant="ghost" size="icon" @click="viewCertificate(row)">
                  <FileIcon class="h-4 w-4" />
                </Button>
              </div>
            </template>
            
            <template v-else-if="column.key === 'checkin'">
              <Badge v-if="row.checkedIn" variant="default">
                {{ formatDate(row.checkedIn) }}
              </Badge>
              <Badge v-else variant="outline">Not Checked In</Badge>
            </template>
            
            <template v-else-if="column.key === 'actions'">
              <div class="flex items-center justify-end gap-2">
                <Button variant="ghost" size="icon" @click="showParticipantDetails(row)">
                  <EyeIcon class="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" @click="showCheckInDialog(row)">
                  <CheckSquareIcon class="h-4 w-4" />
                </Button>
              </div>
            </template>
          </template>
        </DataTable>
      </div>
      
      <div class="flex items-center space-x-2 text-sm text-muted-foreground">
        <UsersIcon class="h-4 w-4" />
        <span>{{ participants.length }} Participants</span>
      </div>
    </div>
    
    <!-- Certificate Preview Dialog -->
    <Dialog :open="!!selectedCertificate" @update:open="selectedCertificate = null">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Medical Certificate</DialogTitle>
          <DialogDescription>
            {{ selectedCertificate?.name }}'s medical certificate
          </DialogDescription>
        </DialogHeader>
        <div class="py-4 flex justify-center">
          <img v-if="selectedCertificate?.certificateUrl" 
            :src="selectedCertificate.certificateUrl" 
            alt="Medical Certificate" 
            class="max-h-[400px] max-w-full object-contain"
          />
          <a v-if="selectedCertificate?.certificateUrl" 
            :href="selectedCertificate.certificateUrl" 
            target="_blank"
            class="mt-4 text-sm text-blue-600 hover:underline">
            Open in new tab
          </a>
        </div>
        <DialogFooter>
          <Button @click="selectedCertificate = null">Close</Button>
          <Button v-if="selectedCertificate && !selectedCertificate.certificateValidated"
            variant="default"
            @click="updateCertificateStatus(selectedCertificate.id, true)">
            Mark as Valid
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
    <!-- Check-in Dialog -->
    <Dialog :open="!!selectedForCheckIn" @update:open="selectedForCheckIn = null">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Participant Check-in</DialogTitle>
          <DialogDescription>
            Record participant check-in for the event
          </DialogDescription>
        </DialogHeader>
        <div class="py-4 space-y-4">
          <div v-if="selectedForCheckIn">
            <div class="mb-4">
              <div class="font-medium">{{ selectedForCheckIn.name }}</div>
              <div class="text-sm text-muted-foreground">
                {{ selectedForCheckIn.gender }} • {{ formatDate(selectedForCheckIn.birthdate, 'YYYY-MM-DD') }}
              </div>
            </div>
            
            <div class="space-y-2">
              <div class="flex items-center space-x-2">
                <FileIcon class="h-4 w-4 text-muted-foreground" />
                <span class="text-sm">
                  Medical Certificate: 
                  <Badge :variant="selectedForCheckIn.certificateValidated ? 'default' : 'destructive'">
                    {{ selectedForCheckIn.certificateValidated ? 'Validated' : 'Not Validated' }}
                  </Badge>
                </span>
              </div>
              
              <div v-if="!selectedForCheckIn.certificateValidated" class="flex items-center space-x-2">
                <Switch 
                  :checked="certificateValidateOnCheckIn" 
                  @update:checked="certificateValidateOnCheckIn = $event" 
                />
                <Label>Validate certificate now</Label>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="selectedForCheckIn = null">Cancel</Button>
          <Button 
            :disabled="selectedForCheckIn && !selectedForCheckIn.certificateValidated && !certificateValidateOnCheckIn"
            @click="confirmCheckIn"
          >
            Confirm Check-in
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from '#imports'
import { 
  ArrowLeftIcon,
  DownloadIcon,
  FileIcon,
  UsersIcon,
  EyeIcon,
  CheckSquareIcon,
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { DataTable } from '@/components/ui/data-table'

const route = useRoute()
const eventId = computed(() => route.params.eventId as string)
const { $dayjs } = useNuxtApp()
const client = useSupabaseClient()
const user = useSupabaseUser()

const event = ref<any>(null)
const participants = ref<any[]>([])
const loading = ref(true)
const error = ref('')
const searchKey = ref('')
const updatingCertificates = ref<Set<string>>(new Set())
const selectedCertificate = ref<any>(null)
const selectedForCheckIn = ref<any>(null)
const certificateValidateOnCheckIn = ref(false)

// Define table columns
const columns = [
  {
    key: 'name',
    label: 'Participant',
    sortable: true,
  },
  {
    key: 'race',
    label: 'Race',
    sortable: true,
  },
  {
    key: 'certificate',
    label: 'Certificate',
    sortable: true,
  },
  {
    key: 'checkin',
    label: 'Check-in',
    sortable: true,
  },
  {
    key: 'actions',
    label: 'Actions',
    sortable: false,
  },
]

// Format date using dayjs
const formatDate = (date: string, format = 'MMM D, YYYY') => {
  return $dayjs(date).format(format)
}

// Get initials from name
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

// Check if certificate is currently being updated
const isCertificateUpdating = (participantId: string) => {
  return updatingCertificates.value.has(participantId)
}

// Update certificate validation status
const updateCertificateStatus = async (participantId: string, status: boolean) => {
  // Add to updating set
  updatingCertificates.value.add(participantId)
  
  try {
    // Update in Supabase
    const { error: updateError } = await client
      .from('participants')
      .update({
        certificate_validated: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', participantId)
    
    if (updateError) throw updateError
    
    // Update local state
    const participant = participants.value.find(p => p.id === participantId)
    if (participant) {
      participant.certificateValidated = status
    }
    
    // Also update in selectedCertificate if it's the same
    if (selectedCertificate.value?.id === participantId) {
      selectedCertificate.value.certificateValidated = status
    }
    
    // Also update in selectedForCheckIn if it's the same
    if (selectedForCheckIn.value?.id === participantId) {
      selectedForCheckIn.value.certificateValidated = status
    }
  } catch (err: any) {
    console.error('Error updating certificate status:', err)
    alert('Failed to update certificate status')
  } finally {
    // Remove from updating set
    updatingCertificates.value.delete(participantId)
  }
}

// View certificate
const viewCertificate = (participant: any) => {
  selectedCertificate.value = participant
}

// Show participant details
const showParticipantDetails = (participant: any) => {
  // This could open a more detailed view or navigate to a details page
  alert(`Showing details for ${participant.name}`)
}

// Show check-in dialog
const showCheckInDialog = (participant: any) => {
  selectedForCheckIn.value = { ...participant }
  certificateValidateOnCheckIn.value = false
}

// Confirm check-in
const confirmCheckIn = async () => {
  if (!selectedForCheckIn.value) return
  
  try {
    // If we need to validate certificate
    if (certificateValidateOnCheckIn.value && !selectedForCheckIn.value.certificateValidated) {
      await updateCertificateStatus(selectedForCheckIn.value.id, true)
    }
    
    // Record check-in
    const { error: checkInError } = await client
      .from('participants')
      .update({
        checkin_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedForCheckIn.value.id)
    
    if (checkInError) throw checkInError
    
    // Update local state
    const participant = participants.value.find(p => p.id === selectedForCheckIn.value.id)
    if (participant) {
      participant.checkedIn = formatDate(new Date().toISOString())
    }
    
    // Close dialog
    selectedForCheckIn.value = null
  } catch (err: any) {
    console.error('Error checking in participant:', err)
    alert('Failed to check in participant')
  }
}

// Fetch event and participants data
const fetchData = async () => {
  if (!eventId.value) return
  
  loading.value = true
  error.value = ''
  
  try {
    // Fetch event details
    const { data: eventData, error: eventError } = await client
      .from('events')
      .select('*')
      .eq('id', eventId.value)
      .single()
    
    if (eventError) throw eventError
    event.value = eventData
    
    // Fetch participants
    const response = await $fetch(`/api/admin/events/${eventId.value}/participants`, {
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    participants.value = response.participants || []
    
    // Subscribe to realtime updates
    const participantsChannel = client
      .channel('participants-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'participants',
          filter: `ticket.race.event_id=eq.${eventId.value}`
        },
        (payload) => {
          // Update the participant in the local state
          const updatedParticipant = payload.new as any
          const index = participants.value.findIndex(p => p.id === updatedParticipant.id)
          
          if (index !== -1) {
            // Update specific fields
            participants.value[index].certificateValidated = updatedParticipant.certificate_validated
            
            if (updatedParticipant.checkin_at) {
              participants.value[index].checkedIn = formatDate(updatedParticipant.checkin_at)
            }
          }
        }
      )
      .subscribe()
    
    // Cleanup function to unsubscribe when component is destroyed
    onUnmounted(() => {
      client.removeChannel(participantsChannel)
    })
  } catch (err: any) {
    console.error('Error fetching data:', err)
    error.value = err.message || 'Failed to load event participants'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})

// This is needed for layout
definePageMeta({
  layout: 'admin'
})
</script>
