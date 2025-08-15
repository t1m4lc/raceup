<template>
  <div>
    <Popover>
      <PopoverTrigger as-child>
        <Button
          variant="outline"
          :class="[
            'w-full justify-start text-left font-normal',
            !modelValue && 'text-muted-foreground'
          ]"
        >
          <CalendarIcon class="mr-2 h-4 w-4" />
          {{ modelValue ? formatDate(modelValue) : 'Select date' }}
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-auto p-0">
        <input 
          type="date" 
          class="w-full p-2 border border-input rounded-md" 
          :value="modelValue" 
          :max="max ? formatDateValue(max) : undefined"
          @input="handleDateChange($event)"
        />
      </PopoverContent>
    </Popover>
  </div>
</template>

<script setup lang="ts">
import { CalendarIcon } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  max: {
    type: Date,
    default: undefined
  }
})

const emit = defineEmits(['update:modelValue'])

const { $dayjs } = useNuxtApp()

const formatDate = (date: string) => {
  return $dayjs(date).format('MMM D, YYYY')
}

const formatDateValue = (date: Date) => {
  return date.toISOString().split('T')[0]
}

const handleDateChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>
