<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Master Mode Header -->
    <div class="bg-white border-b shadow-sm">
      <div class="container mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <div class="text-2xl">⚡</div>
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Master Mode</h1>
              <p class="text-sm text-gray-600">{{ user?.email }} | Super Admin Access</p>
            </div>
          </div>
          <Badge variant="destructive" class="text-xs">
            RESTRICTED ACCESS
          </Badge>
        </div>
      </div>
    </div>

    <div class="container mx-auto p-6">
      <!-- Quick Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent class="p-6">
            <div class="flex items-center space-x-2">
              <Building2 class="h-8 w-8 text-blue-600" />
              <div>
                <p class="text-2xl font-bold text-gray-900">{{ stats.organizations }}</p>
                <p class="text-sm text-gray-600">Organizations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent class="p-6">
            <div class="flex items-center space-x-2">
              <Trophy class="h-8 w-8 text-green-600" />
              <div>
                <p class="text-2xl font-bold text-gray-900">{{ stats.races }}</p>
                <p class="text-sm text-gray-600">Races</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent class="p-6">
            <div class="flex items-center space-x-2">
              <Ticket class="h-8 w-8 text-purple-600" />
              <div>
                <p class="text-2xl font-bold text-gray-900">{{ stats.tickets }}</p>
                <p class="text-sm text-gray-600">Tickets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent class="p-6">
            <div class="flex items-center space-x-2">
              <CreditCard class="h-8 w-8 text-orange-600" />
              <div>
                <p class="text-2xl font-bold text-gray-900">{{ stats.payments }}</p>
                <p class="text-sm text-gray-600">Payments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Master Mode Tools -->
      <div class="grid md:grid-cols-2 gap-6">
        
        <!-- Stripe Connect Management -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center space-x-2">
              <CreditCard class="h-5 w-5" />
              <span>Stripe Connect</span>
            </CardTitle>
            <CardDescription>Manage Stripe Connect accounts for organizations</CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <Button asChild variant="outline" class="w-full justify-start">
              <NuxtLink to="/master/stripe-connect-manager">
                <Link class="h-4 w-4 mr-2" />
                Connect Account Manager
              </NuxtLink>
            </Button>
            <Button asChild variant="outline" class="w-full justify-start">
              <NuxtLink to="/master/stripe-connect-setup">
                <Settings class="h-4 w-4 mr-2" />
                Stripe Connect Setup
              </NuxtLink>
            </Button>
          </CardContent>
        </Card>

        <!-- Testing & Administration -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center space-x-2">
              <TestTube class="h-5 w-5" />
              <span>Tests & Admin</span>
            </CardTitle>
            <CardDescription>Payment testing and data management</CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <Button asChild variant="outline" class="w-full justify-start">
              <NuxtLink to="/master/test-dashboard">
                <BarChart3 class="h-4 w-4 mr-2" />
                Test Dashboard
              </NuxtLink>
            </Button>
            <Button asChild variant="outline" class="w-full justify-start">
              <NuxtLink to="/master/test-payment">
                <Wallet class="h-4 w-4 mr-2" />
                Payment Flow Test
              </NuxtLink>
            </Button>
            <Button 
              @click="createTestData"
              variant="outline" 
              class="w-full justify-start"
              :disabled="creatingData"
            >
              <Database class="h-4 w-4 mr-2" />
              {{ creatingData ? 'Creating...' : 'Create Test Data' }}
            </Button>
          </CardContent>
        </Card>
      </div>

      <!-- Recent Activity -->
      <Card class="mt-8">
        <CardHeader>
          <CardTitle class="flex items-center space-x-2">
            <Clock class="h-5 w-5" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-3">
            <div v-for="activity in recentActivities" :key="activity.id" class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span class="text-sm text-gray-700">{{ activity.description }}</span>
              <span class="text-xs text-gray-500">{{ formatDate(activity.created_at) }}</span>
            </div>
            <div v-if="recentActivities.length === 0" class="text-center py-6 text-gray-500">
              No recent activities
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { 
  AlertTriangle, 
  Building2, 
  Trophy, 
  Ticket, 
  CreditCard,
  Link,
  TestTube,
  BarChart3,
  Wallet,
  Settings,
  Database,
  Clock
} from 'lucide-vue-next'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

definePageMeta({
  middleware: 'master-mode',
  layout: 'blank'
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const stats = ref({
  organizations: 0,
  races: 0,
  tickets: 0,
  payments: 0
})

const recentActivities = ref([])
const creatingData = ref(false)

onMounted(async () => {
  await loadStats()
  await loadRecentActivities()
})

async function loadStats() {
  try {
    const [orgsRes, racesRes, ticketsRes, paymentsRes] = await Promise.all([
      supabase.from('organizations').select('id', { count: 'exact', head: true }),
      supabase.from('races').select('id', { count: 'exact', head: true }),
      supabase.from('tickets').select('id', { count: 'exact', head: true }),
      supabase.from('payments').select('id', { count: 'exact', head: true })
    ])
    
    stats.value = {
      organizations: orgsRes.count || 0,
      races: racesRes.count || 0,
      tickets: ticketsRes.count || 0,
      payments: paymentsRes.count || 0
    }
  } catch (error) {
    console.error('Error loading stats:', error)
  }
}

async function loadRecentActivities() {
  try {
    const { data } = await supabase
      .from('payments')
      .select('id, amount, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    
    recentActivities.value = data?.map(payment => ({
      id: payment.id,
      description: `Payment of €${(payment.amount / 100).toFixed(2)} - ${payment.status}`,
      created_at: payment.created_at
    })) || []
  } catch (error) {
    console.error('Error loading recent activities:', error)
  }
}

async function createTestData() {
  creatingData.value = true
  try {
    const response = await $fetch('/api/master/create-test-data', {
      method: 'POST'
    })
    
    if (response.success) {
      await loadStats()
      alert('Test data created successfully!')
    } else {
      alert(response.message || 'Failed to create test data')
    }
  } catch (error) {
    console.error('Error creating test data:', error)
    alert('Error creating test data')
  } finally {
    creatingData.value = false
  }
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleString()
}
</script>
