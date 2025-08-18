<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white border-b shadow-sm">
      <div class="container mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <Button variant="ghost" @click="$router.push('/master')">
              <ArrowLeft class="h-4 w-4" />
            </Button>
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Stripe Connect Manager</h1>
              <p class="text-sm text-gray-600">Create and manage Stripe Connect accounts</p>
            </div>
          </div>
          <Badge variant="outline" class="text-xs">
            Master Mode
          </Badge>
        </div>
      </div>
    </div>

    <div class="container mx-auto p-6">
      <!-- Create New Account Section -->
      <Card class="mb-8">
        <CardHeader>
          <CardTitle class="flex items-center space-x-2">
            <Rocket class="h-5 w-5" />
            <span>Create New Connect Account</span>
          </CardTitle>
          <CardDescription>Set up Stripe Connect accounts for organizations</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="grid md:grid-cols-2 gap-6">
            <!-- Organization Selection -->
            <div class="space-y-2">
              <Label>Select Organization</Label>
              <Select v-model="selectedOrgId">
                <SelectTrigger>
                  <SelectValue placeholder="Choose organization..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem 
                    v-for="org in organizations" 
                    :key="org.id" 
                    :value="org.id"
                    :disabled="!!org.stripe_account_id"
                  >
                    {{ org.name }} 
                    <span v-if="org.stripe_account_id" class="text-green-600 ml-2">(Connected)</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <!-- Account Details -->
            <div class="space-y-2">
              <Label for="test-email">Test Email</Label>
              <Input 
                id="test-email"
                v-model="testEmail" 
                type="email" 
                placeholder="organizer@example.com"
              />
            </div>
          </div>

          <div class="mt-6 flex space-x-4">
            <Button 
              @click="createConnectAccount" 
              :disabled="!selectedOrgId || !testEmail || loading"
            >
              <CreditCard class="h-4 w-4 mr-2" />
              <span v-if="loading">Creating...</span>
              <span v-else>Create Connect Account</span>
            </Button>
            
            <Button 
              @click="useTestAccount"
              :disabled="!selectedOrgId"
              variant="outline"
            >
              <Zap class="h-4 w-4 mr-2" />
              Use Pre-made Test Account
            </Button>
          </div>

          <!-- Creation Result -->
          <Alert v-if="result" class="mt-6" variant="default">
            <CheckCircle class="h-4 w-4" />
            <AlertTitle>Success!</AlertTitle>
            <AlertDescription>
              {{ result.message }}
              <div v-if="result.onboardingUrl" class="mt-3">
                <Button asChild size="sm">
                  <a :href="result.onboardingUrl" target="_blank">
                    Complete Onboarding
                    <ExternalLink class="h-3 w-3 ml-1" />
                  </a>
                </Button>
              </div>
            </AlertDescription>
          </Alert>

          <Alert v-if="error" class="mt-6" variant="destructive">
            <XCircle class="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{{ error }}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <!-- Existing Connections -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center space-x-2">
            <Building2 class="h-5 w-5" />
            <span>Existing Connections</span>
          </CardTitle>
          <CardDescription>Manage organization Stripe Connect accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Stripe Account ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="org in organizations" :key="org.id">
                  <TableCell class="font-medium">{{ org.name }}</TableCell>
                  <TableCell>
                    <code v-if="org.stripe_account_id" class="text-xs bg-gray-100 px-2 py-1 rounded">
                      {{ org.stripe_account_id }}
                    </code>
                    <span v-else class="text-gray-400">-</span>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      v-if="org.stripe_onboarding_completed" 
                      variant="default"
                      class="bg-green-100 text-green-800"
                    >
                      <CheckCircle class="h-3 w-3 mr-1" />
                      Complete
                    </Badge>
                    <Badge 
                      v-else-if="org.stripe_account_id" 
                      variant="secondary"
                      class="bg-yellow-100 text-yellow-800"
                    >
                      <Clock class="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                    <Badge 
                      v-else 
                      variant="outline"
                    >
                      <XCircle class="h-3 w-3 mr-1" />
                      No Account
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div class="flex space-x-2">
                      <Button 
                        v-if="org.stripe_account_id && !org.stripe_onboarding_completed"
                        @click="generateOnboardingLink(org)"
                        size="sm"
                        variant="outline"
                      >
                        <Settings class="h-3 w-3 mr-1" />
                        Complete Setup
                      </Button>
                      <Button 
                        v-if="org.stripe_account_id"
                        @click="testTransfer(org)"
                        size="sm"
                        variant="outline"
                      >
                        <ArrowRightLeft class="h-3 w-3 mr-1" />
                        Test Transfer
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { 
  ArrowLeft, 
  Rocket, 
  CreditCard, 
  Zap, 
  CheckCircle, 
  XCircle, 
  ExternalLink,
  Building2,
  Clock,
  Settings,
  ArrowRightLeft
} from 'lucide-vue-next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

definePageMeta({
  middleware: 'master-mode'
})

const supabase = useSupabaseClient()

// State
const organizations = ref([])
const selectedOrgId = ref('')
const testEmail = ref('organizer@example.com')
const loading = ref(false)
const result = ref(null)
const error = ref(null)

// Load organizations
const loadOrganizations = async () => {
  try {
    const { data } = await supabase
      .from('organizations')
      .select('*')
      .order('name')
    
    organizations.value = data || []
  } catch (err) {
    console.error('Failed to load organizations:', err)
  }
}

// Create Connect account
const createConnectAccount = async () => {
  loading.value = true
  error.value = null
  result.value = null

  try {
    const response = await $fetch('/api/master/create-connect-account', {
      method: 'POST',
      body: {
        organizationId: selectedOrgId.value,
        email: testEmail.value
      }
    })
    
    result.value = response
    await loadOrganizations() // Refresh list
  } catch (err) {
    error.value = err.data?.message || err.message || 'Failed to create account'
  } finally {
    loading.value = false
  }
}

// Use pre-made test account
const useTestAccount = async () => {
  try {
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        stripe_account_id: 'acct_1032D82eZvKYlo2C',
        stripe_onboarding_completed: true
      })
      .eq('id', selectedOrgId.value)

    if (updateError) throw updateError

    result.value = {
      message: 'Successfully connected organization to pre-made test account!',
      accountId: 'acct_1032D82eZvKYlo2C'
    }
    
    await loadOrganizations()
  } catch (err) {
    error.value = err.message || 'Failed to update organization'
  }
}

// Generate onboarding link
const generateOnboardingLink = async (org) => {
  try {
    const response = await $fetch('/api/master/generate-onboarding-link', {
      method: 'POST',
      body: { accountId: org.stripe_account_id }
    })
    
    window.open(response.url, '_blank')
  } catch (err) {
    error.value = err.data?.message || 'Failed to generate onboarding link'
  }
}

// Test transfer
const testTransfer = async (org) => {
  try {
    const response = await $fetch('/api/master/test-transfer', {
      method: 'POST',
      body: { 
        organizationId: org.id,
        amount: 1000 // €10.00 test transfer
      }
    })
    
    result.value = {
      message: `Test transfer of €10.00 sent to ${org.name}!`,
      transferId: response.transferId
    }
  } catch (err) {
    error.value = err.data?.message || 'Failed to create test transfer'
  }
}

onMounted(() => {
  loadOrganizations()
})
</script>
