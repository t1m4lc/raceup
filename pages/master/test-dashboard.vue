<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white border-b shadow-sm">
      <div class="container mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <div class="text-2xl">🧪</div>
            <div>
              <h1 class="text-2xl font-bold text-gray-900">RaceUp Testing Dashboard</h1>
              <p class="text-sm text-gray-600">Payment flow testing and system monitoring</p>
            </div>
          </div>
          <Button asChild variant="outline">
            <NuxtLink to="/master">
              <ArrowLeft class="h-4 w-4 mr-2" />
              Back to Master
            </NuxtLink>
          </Button>
        </div>
      </div>
    </div>

    <div class="container mx-auto p-6">
      <!-- Testing Progress -->
      <Card class="mb-8">
        <CardHeader>
          <CardTitle class="flex items-center space-x-2">
            <BarChart3 class="h-5 w-5" />
            <span>Testing Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 class="font-semibold text-green-800">Database Setup</h3>
              <p class="text-sm text-green-600 mb-2">Organizations, Events, Races</p>
              <Badge variant="secondary" class="bg-green-100 text-green-800">✅ Complete</Badge>
            </div>
            <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 class="font-semibold text-blue-800">Stripe Connect</h3>
              <p class="text-sm text-blue-600 mb-2">Payment processing setup</p>
              <Badge variant="secondary" class="bg-blue-100 text-blue-800">✅ Complete</Badge>
            </div>
            <div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 class="font-semibold text-yellow-800">Payment Flow</h3>
              <p class="text-sm text-yellow-600 mb-2">Registration → Payment</p>
              <Badge variant="secondary" class="bg-yellow-100 text-yellow-800">🔄 Testing</Badge>
            </div>
            <div class="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 class="font-semibold text-gray-600">Admin Features</h3>
              <p class="text-sm text-gray-500 mb-2">Management interfaces</p>
              <Badge variant="secondary" class="bg-gray-100 text-gray-600">⏳ Pending</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div class="grid md:grid-cols-2 gap-6 mb-8">
        <!-- Quick Test Links -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center space-x-2">
              <Zap class="h-5 w-5" />
              <span>Quick Tests</span>
            </CardTitle>
            <CardDescription>Test core functionality</CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <Button asChild variant="outline" class="w-full justify-start">
              <NuxtLink to="/master/test-payment">
                <CreditCard class="h-4 w-4 mr-2" />
                Test Payment Flow
              </NuxtLink>
            </Button>
            <Button asChild variant="outline" class="w-full justify-start">
              <NuxtLink to="/">
                <Home class="h-4 w-4 mr-2" />
                View Homepage
              </NuxtLink>
            </Button>
            <Button asChild variant="outline" class="w-full justify-start">
              <NuxtLink to="/master/stripe-connect-manager">
                <Settings class="h-4 w-4 mr-2" />
                Stripe Connect Setup
              </NuxtLink>
            </Button>
          </CardContent>
        </Card>

        <!-- Database Status -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center space-x-2">
              <Database class="h-5 w-5" />
              <span>Database Status</span>
            </CardTitle>
            <CardDescription>Current system data counts</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-2 gap-4">
              <div class="text-center p-3 bg-gray-50 rounded">
                <p class="text-2xl font-bold text-blue-600">{{ dbStats.organizations }}</p>
                <p class="text-sm text-gray-600">Organizations</p>
              </div>
              <div class="text-center p-3 bg-gray-50 rounded">
                <p class="text-2xl font-bold text-green-600">{{ dbStats.races }}</p>
                <p class="text-sm text-gray-600">Races</p>
              </div>
              <div class="text-center p-3 bg-gray-50 rounded">
                <p class="text-2xl font-bold text-purple-600">{{ dbStats.tickets }}</p>
                <p class="text-sm text-gray-600">Tickets</p>
              </div>
              <div class="text-center p-3 bg-gray-50 rounded">
                <p class="text-2xl font-bold text-orange-600">{{ dbStats.payments }}</p>
                <p class="text-sm text-gray-600">Payments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Recent Activities -->
      <Card class="mb-8">
        <CardHeader>
          <CardTitle class="flex items-center space-x-2">
            <Clock class="h-5 w-5" />
            <span>Recent Activities</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-3">
            <div v-for="activity in recentActivities" :key="activity.id" 
                 class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span class="text-sm text-gray-700">{{ activity.description }}</span>
              <span class="text-xs text-gray-500">{{ formatDate(activity.created_at) }}</span>
            </div>
            <div v-if="recentActivities.length === 0" 
                 class="text-center py-6 text-gray-500">
              No recent activities
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Test Commands -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center space-x-2">
            <Terminal class="h-5 w-5" />
            <span>Stripe Testing Commands</span>
          </CardTitle>
          <CardDescription>Useful commands for testing Stripe integration</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
            <div class="mb-3">
              <span class="text-gray-400"># Set up Stripe CLI webhook forwarding:</span>
            </div>
            <div class="mb-4 text-yellow-300">
              stripe listen --forward-to localhost:3001/api/webhooks/stripe-connect
            </div>
            
            <div class="mb-3">
              <span class="text-gray-400"># Test payment cards:</span>
            </div>
            <div class="space-y-1">
              <div class="text-green-400">4242 4242 4242 4242 (Success)</div>
              <div class="text-red-400">4000 0000 0000 0002 (Declined)</div>
              <div class="text-blue-400">4000 0025 0000 3155 (Requires authentication)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { 
  ArrowLeft, 
  BarChart3, 
  Zap, 
  CreditCard, 
  Home, 
  Settings, 
  Database, 
  Clock, 
  Terminal 
} from 'lucide-vue-next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

definePageMeta({
  middleware: 'master-mode',
  layout: 'blank'
})

const supabase = useSupabaseClient()

// Database statistics
const dbStats = ref({
  organizations: 0,
  races: 0,
  tickets: 0,
  payments: 0
})

// Recent activities
const recentActivities = ref([])

// Load database statistics
const loadStats = async () => {
  try {
    const [orgs, races, tickets, payments] = await Promise.all([
      supabase.from('organizations').select('id', { count: 'exact' }),
      supabase.from('races').select('id', { count: 'exact' }),
      supabase.from('tickets').select('id', { count: 'exact' }),
      supabase.from('payments').select('id', { count: 'exact' })
    ])

    dbStats.value = {
      organizations: orgs.count || 0,
      races: races.count || 0,
      tickets: tickets.count || 0,
      payments: payments.count || 0
    }
  } catch (error) {
    console.error('Failed to load stats:', error)
  }
}

// Load recent activities
const loadActivities = async () => {
  try {
    const { data } = await supabase
      .from('payments')
      .select('id, amount, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    recentActivities.value = (data || []).map(payment => ({
      id: payment.id,
      description: `Payment of €${(payment.amount / 100).toFixed(2)} - ${payment.status}`,
      created_at: payment.created_at
    }))
  } catch (error) {
    console.error('Failed to load activities:', error)
  }
}

// Format date
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString()
}

// Load data on mount
onMounted(() => {
  loadStats()
  loadActivities()
  
  // Auto-refresh every 30 seconds (only in browser)
  if (typeof window !== 'undefined') {
    setInterval(() => {
      loadStats()
      loadActivities()
    }, 30000)
  }
})

// Meta
useHead({
  title: 'Testing Dashboard - RaceUp Master Mode'
})
</script>
