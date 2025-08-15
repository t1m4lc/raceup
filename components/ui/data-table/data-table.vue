<template>
  <div>
    <div class="flex items-center justify-between pb-4">
      <!-- Search Input -->
      <slot name="search">
        <div class="flex items-center py-4">
          <Input
            placeholder="Filter..."
            class="max-w-sm"
            v-model="searchValue"
          />
        </div>
      </slot>
      
      <div class="flex items-center space-x-2">
        <slot name="actions"></slot>
      </div>
    </div>
    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              v-for="column in columns" 
              :key="column.key" 
              :class="{ 'cursor-pointer': column.sortable }"
              @click="column.sortable ? toggleSort(column.key) : null"
            >
              <div class="flex items-center space-x-1">
                <span>{{ column.label }}</span>
                <template v-if="column.sortable">
                  <ArrowDownIcon v-if="sortKey === column.key && sortOrder === 'asc'" class="h-4 w-4" />
                  <ArrowUpIcon v-else-if="sortKey === column.key && sortOrder === 'desc'" class="h-4 w-4" />
                  <ArrowUpDownIcon v-else class="h-4 w-4 opacity-50" />
                </template>
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="row in filteredAndSortedData" :key="getRowKey(row)">
            <TableCell v-for="column in columns" :key="column.key">
              <slot name="rowData" :row="row" :column="column">
                {{ row[column.key] }}
              </slot>
            </TableCell>
          </TableRow>
          <TableRow v-if="filteredAndSortedData.length === 0">
            <TableCell :colspan="columns.length" class="h-24 text-center">
              No results found.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ArrowUpIcon, ArrowDownIcon, ArrowUpDownIcon } from 'lucide-vue-next'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'

interface Column {
  key: string
  label: string
  sortable?: boolean
}

const props = defineProps<{
  columns: Column[]
  data: any[]
  filterKey?: string
}>()

// Local refs for sorting and filtering
const sortKey = ref('')
const sortOrder = ref<'asc' | 'desc'>('asc')
const searchValue = ref('')

// Watch external filter key
watch(() => props.filterKey, (newValue) => {
  if (newValue !== undefined) {
    searchValue.value = newValue
  }
})

// Toggle sort order
const toggleSort = (key: string) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
}

// Get row key - uses row id if available, otherwise use index
const getRowKey = (row: any) => {
  return row.id ? row.id : JSON.stringify(row)
}

// Filter and sort data
const filteredAndSortedData = computed(() => {
  // Filter data
  let result = [...props.data]
  
  if (searchValue.value) {
    const searchString = searchValue.value.toLowerCase()
    result = result.filter(row => {
      return Object.keys(row).some(key => {
        const value = row[key]
        if (value === null || value === undefined) return false
        
        // Handle nested objects for search
        if (typeof value === 'object') {
          return JSON.stringify(value).toLowerCase().includes(searchString)
        }
        
        return String(value).toLowerCase().includes(searchString)
      })
    })
  }
  
  // Sort data
  if (sortKey.value) {
    result.sort((a, b) => {
      const aValue = a[sortKey.value]
      const bValue = b[sortKey.value]
      
      // Handle null/undefined values
      if (aValue === undefined || aValue === null) return sortOrder.value === 'asc' ? -1 : 1
      if (bValue === undefined || bValue === null) return sortOrder.value === 'asc' ? 1 : -1
      
      // Compare based on types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder.value === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue)
      }
      
      // Default comparison
      return sortOrder.value === 'asc' 
        ? (aValue > bValue ? 1 : -1) 
        : (aValue > bValue ? -1 : 1)
    })
  }
  
  return result
})
</script>
