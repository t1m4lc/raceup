<template>
  <div class="container max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold">Extras Management</h1>
        <p class="text-muted-foreground mt-2">Manage extras for your race events</p>
      </div>
      <Button @click="showCreateDialog = true">
        <PlusIcon class="h-4 w-4 mr-2" />
        Add Extra
      </Button>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full"></div>
    </div>

    <!-- Extras List -->
    <div v-else-if="extras.length > 0" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card v-for="extra in extras" :key="extra.id" class="relative">
          <div v-if="!extra.is_active" class="absolute top-2 right-2">
            <Badge variant="destructive">Inactive</Badge>
          </div>
          
          <CardHeader>
            <div class="flex items-start justify-between">
              <div>
                <CardTitle class="text-lg">{{ extra.name }}</CardTitle>
                <CardDescription>{{ extra.short_description }}</CardDescription>
              </div>
              <Badge :variant="getCategoryVariant(extra.category)">
                {{ extra.category }}
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium">Price:</span>
                <span class="font-bold">{{ formatPrice(extra.price_cents, extra.currency) }}</span>
              </div>

              <div class="flex justify-between items-center">
                <span class="text-sm font-medium">Max per participant:</span>
                <span>{{ extra.max_quantity_per_participant }}</span>
              </div>

              <div class="flex justify-between items-center">
                <span class="text-sm font-medium">Stock:</span>
                <span>
                  <span class="font-medium">{{ extra.current_sold_quantity }}</span>
                  <span class="text-muted-foreground">
                    / {{ extra.total_available_quantity || '∞' }}
                  </span>
                </span>
              </div>

              <div class="flex justify-between items-center">
                <span class="text-sm font-medium">Revenue:</span>
                <span class="font-medium text-green-600">
                  {{ formatPrice(extra.current_sold_quantity * extra.price_cents, extra.currency) }}
                </span>
              </div>

              <div v-if="extra.description" class="pt-2 border-t">
                <p class="text-sm text-muted-foreground">{{ extra.description }}</p>
              </div>
            </div>
          </CardContent>

          <CardFooter class="flex gap-2">
            <Button variant="outline" size="sm" @click="editExtra(extra)">
              <EditIcon class="h-3 w-3 mr-1" />
              Edit
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              @click="toggleExtraStatus(extra)"
              :class="extra.is_active ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'"
            >
              {{ extra.is_active ? 'Disable' : 'Enable' }}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="text-center py-12">
      <PackageIcon class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 class="text-lg font-medium mb-2">No extras found</h3>
      <p class="text-muted-foreground mb-6">Create your first extra to get started</p>
      <Button @click="showCreateDialog = true">
        <PlusIcon class="h-4 w-4 mr-2" />
        Add Extra
      </Button>
    </div>

    <!-- Create/Edit Extra Dialog -->
    <Dialog v-model:open="showCreateDialog">
      <DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{{ editingExtra ? 'Edit Extra' : 'Create New Extra' }}</DialogTitle>
          <DialogDescription>
            {{ editingExtra ? 'Update the extra details' : 'Add a new extra for your race' }}
          </DialogDescription>
        </DialogHeader>

        <form @submit.prevent="saveExtra" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="name">Name *</Label>
              <Input id="name" v-model="extraForm.name" required />
            </div>

            <div class="space-y-2">
              <Label for="short_description">Short Description</Label>
              <Input id="short_description" v-model="extraForm.short_description" />
            </div>
          </div>

          <div class="space-y-2">
            <Label for="description">Description</Label>
            <Textarea id="description" v-model="extraForm.description" rows="3" />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="space-y-2">
              <Label for="price">Price (EUR) *</Label>
              <Input 
                id="price" 
                type="number" 
                step="0.01" 
                min="0" 
                v-model="extraForm.price_eur" 
                required 
              />
            </div>

            <div class="space-y-2">
              <Label for="max_quantity">Max per participant *</Label>
              <Input 
                id="max_quantity" 
                type="number" 
                min="1" 
                v-model="extraForm.max_quantity_per_participant" 
                required 
              />
            </div>

            <div class="space-y-2">
              <Label for="total_quantity">Total stock</Label>
              <Input 
                id="total_quantity" 
                type="number" 
                min="0" 
                v-model="extraForm.total_available_quantity" 
                placeholder="Leave empty for unlimited"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="category">Category</Label>
              <Select v-model="extraForm.category">
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apparel">Apparel</SelectItem>
                  <SelectItem value="food">Food & Drink</SelectItem>
                  <SelectItem value="digital">Digital</SelectItem>
                  <SelectItem value="merchandise">Merchandise</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="award">Award</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-2">
              <Label for="display_order">Display Order</Label>
              <Input 
                id="display_order" 
                type="number" 
                min="0" 
                v-model="extraForm.display_order" 
              />
            </div>
          </div>

          <div class="flex items-center space-x-2">
            <Checkbox id="is_active" v-model="extraForm.is_active" />
            <Label for="is_active">Active</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" @click="showCreateDialog = false">
              Cancel
            </Button>
            <Button type="submit" :disabled="isSaving">
              <span v-if="isSaving">Saving...</span>
              <span v-else>{{ editingExtra ? 'Update' : 'Create' }}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { PlusIcon, EditIcon, PackageIcon } from 'lucide-vue-next'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const route = useRoute()
const raceId = route.params.raceId as string

const isLoading = ref(true)
const isSaving = ref(false)
const extras = ref([])
const showCreateDialog = ref(false)
const editingExtra = ref(null)

const extraForm = ref({
  name: '',
  description: '',
  short_description: '',
  price_eur: 0,
  max_quantity_per_participant: 1,
  total_available_quantity: null,
  category: '',
  display_order: 0,
  is_active: true
})

const formatPrice = (priceCents: number, currency: string = 'EUR') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(priceCents / 100)
}

const getCategoryVariant = (category: string) => {
  const variants = {
    'apparel': 'secondary',
    'food': 'default',
    'digital': 'outline',
    'merchandise': 'secondary',
    'service': 'default',
    'premium': 'destructive',
    'award': 'default'
  }
  return variants[category] || 'outline'
}

const loadExtras = async () => {
  isLoading.value = true
  try {
    const { data } = await $fetch(`/api/admin/races/${raceId}/extras`)
    extras.value = data?.extras || []
  } catch (error) {
    console.error('Failed to load extras:', error)
  } finally {
    isLoading.value = false
  }
}

const resetForm = () => {
  extraForm.value = {
    name: '',
    description: '',
    short_description: '',
    price_eur: 0,
    max_quantity_per_participant: 1,
    total_available_quantity: null,
    category: '',
    display_order: 0,
    is_active: true
  }
  editingExtra.value = null
}

const editExtra = (extra: any) => {
  editingExtra.value = extra
  extraForm.value = {
    name: extra.name,
    description: extra.description || '',
    short_description: extra.short_description || '',
    price_eur: extra.price_cents / 100,
    max_quantity_per_participant: extra.max_quantity_per_participant,
    total_available_quantity: extra.total_available_quantity,
    category: extra.category || '',
    display_order: extra.display_order || 0,
    is_active: extra.is_active
  }
  showCreateDialog.value = true
}

const saveExtra = async () => {
  isSaving.value = true
  try {
    const payload = {
      ...extraForm.value,
      price_cents: Math.round(extraForm.value.price_eur * 100)
    }
    delete payload.price_eur

    if (editingExtra.value) {
      // Update existing extra
      await $fetch(`/api/admin/races/${raceId}/extras/${editingExtra.value.id}`, {
        method: 'PUT',
        body: payload
      })
    } else {
      // Create new extra
      await $fetch(`/api/admin/races/${raceId}/extras`, {
        method: 'POST',
        body: payload
      })
    }

    showCreateDialog.value = false
    resetForm()
    await loadExtras()
  } catch (error) {
    console.error('Failed to save extra:', error)
  } finally {
    isSaving.value = false
  }
}

const toggleExtraStatus = async (extra: any) => {
  try {
    await $fetch(`/api/admin/races/${raceId}/extras/${extra.id}`, {
      method: 'PUT',
      body: {
        is_active: !extra.is_active
      }
    })
    await loadExtras()
  } catch (error) {
    console.error('Failed to toggle extra status:', error)
  }
}

onMounted(() => {
  loadExtras()
})

definePageMeta({
  middleware: ['auth'],
  layout: 'admin'
})
</script>
