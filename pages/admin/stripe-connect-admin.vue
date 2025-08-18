<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Security Check -->
    <div v-if="!isAuthorized" class="flex items-center justify-center min-h-screen">
      <div class="bg-red-50 border border-red-200 p-6 rounded-lg max-w-md">
        <h2 class="text-red-800 font-semibold mb-2">🚫 Access Denied</h2>
        <p class="text-red-600 text-sm">This page is restricted to administrators only.</p>
        <div class="mt-4">
          <NuxtLink to="/login" class="text-blue-600 hover:underline">
            Sign in with authorized account
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Admin Interface -->
    <div v-else class="container mx-auto p-6">
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h1 class="text-2xl font-bold mb-6 text-blue-800">
          🔐 Stripe Connect Admin Panel
        </h1>
        
        <div class="bg-blue-50 p-4 rounded mb-6">
          <p class="text-sm text-blue-700">
            ✅ Welcome {{ user?.email }} - You have admin access
          </p>
        </div>

        <!-- Organizations List -->
        <div class="mb-8">
          <h2 class="text-xl font-semibold mb-4">Organizations & Stripe Status</h2>
          
          <div v-if="loadingOrgs" class="text-center py-4">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          </div>

          <div v-else class="space-y-4">
            <div 
              v-for="org in organizations" 
              :key="org.id"
              class="border rounded-lg p-4 bg-gray-50"
            >
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <h3 class="font-semibold text-lg">{{ org.name }}</h3>
                  <p class="text-sm text-gray-600 mb-2">{{ org.description || 'No description' }}</p>
                  
                  <div class="flex items-center space-x-4">
                    <div class="flex items-center space-x-2">
                      <span class="text-sm font-medium">Stripe Account:</span>
                      <span v-if="org.stripe_account_id" class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                        {{ org.stripe_account_id.substring(0, 20) }}...
                      </span>
                      <span v-else class="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                        No Account
                      </span>
                    </div>
                    
                    <div class="flex items-center space-x-2">
                      <span class="text-sm font-medium">Status:</span>
                      <span 
                        :class="org.stripe_onboarding_completed 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'"
                        class="px-2 py-1 rounded text-xs"
                      >
                        {{ org.stripe_onboarding_completed ? 'Complete' : 'Pending' }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="flex space-x-2">
                  <button
                    v-if="!org.stripe_account_id"
                    @click="createConnectAccount(org)"
                    :disabled="processingOrg === org.id"
                    class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    {{ processingOrg === org.id ? '⏳' : '🔗 Create Account' }}
                  </button>
                  
                  <button
                    v-if="org.stripe_account_id && !org.stripe_onboarding_completed"
                    @click="createOnboardingLink(org)"
                    :disabled="processingOrg === org.id"
                    class="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 disabled:opacity-50"
                  >
                    {{ processingOrg === org.id ? '⏳' : '📋 Complete Setup' }}
                  </button>

                  <button
                    v-if="org.stripe_account_id"
                    @click="checkAccountStatus(org)"
                    :disabled="processingOrg === org.id"
                    class="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 disabled:opacity-50"
                  >
                    {{ processingOrg === org.id ? '⏳' : '🔍 Check Status' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Results & Actions -->
        <div v-if="result" class="mt-6 p-4 rounded-lg" :class="result.success ? 'bg-green-50' : 'bg-red-50'">
          <h3 class="font-semibold" :class="result.success ? 'text-green-800' : 'text-red-800'">
            {{ result.success ? '✅ Success' : '❌ Error' }}
          </h3>
          <p :class="result.success ? 'text-green-700' : 'text-red-700'">{{ result.message }}</p>
          
          <div v-if="result.success && result.onboardingUrl" class="mt-3">
            <a 
              :href="result.onboardingUrl" 
              target="_blank"
              class="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              🔗 Complete Onboarding
            </a>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="mt-8 bg-gray-50 p-4 rounded">
          <h3 class="font-semibold mb-3">⚡ Quick Actions</h3>
          <div class="flex space-x-3">
            <button 
              @click="refreshOrganizations"
              class="bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700"
            >
              🔄 Refresh List
            </button>
            <button 
              @click="testWebhook"
              class="bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700"
            >
              📡 Test Webhook
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Security check
const user = useSupabaseUser()
const supabase = useSupabaseClient()

// CONFIGURE YOUR ADMIN EMAIL HERE 👇
const ADMIN_EMAILS = [
  'your-email@example.com', // Replace with your actual email
  'timothy@yourcompany.com', // Add more emails as needed
]

const isAuthorized = computed(() => {
  return user.value && ADMIN_EMAILS.includes(user.value.email)
})

// Redirect if not logged in
watchEffect(() => {
  if (user.value === null) {
    navigateTo('/login')
  }
})

// Data
const organizations = ref([])
const loadingOrgs = ref(true)
const processingOrg = ref(null)
const result = ref(null)

// Load organizations
const loadOrganizations = async () => {
  try {
    loadingOrgs.value = true
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name, description, stripe_account_id, stripe_onboarding_completed, founder_id')
      .order('created_at', { ascending: false })

    if (error) throw error
    organizations.value = data || []
  } catch (error) {
    console.error('Failed to load organizations:', error)
    result.value = { success: false, message: 'Failed to load organizations' }
  } finally {
    loadingOrgs.value = false
  }
}

// Create Connect account
const createConnectAccount = async (org) => {
  processingOrg.value = org.id
  result.value = null

  try {
    const response = await $fetch('/api/admin/stripe/create-connect-account', {
      method: 'POST',
      body: { organizationId: org.id }
    })

    result.value = {
      success: true,
      message: `Created Stripe account for ${org.name}`,
      onboardingUrl: response.onboardingUrl
    }

    // Refresh the organization data
    await loadOrganizations()
  } catch (error: any) {
    result.value = {
      success: false,
      message: error.data?.message || 'Failed to create Connect account'
    }
  } finally {
    processingOrg.value = null
  }
}

// Create onboarding link
const createOnboardingLink = async (org) => {
  processingOrg.value = org.id
  result.value = null

  try {
    const response = await $fetch('/api/admin/stripe/create-onboarding-link', {
      method: 'POST',
      body: { accountId: org.stripe_account_id }
    })

    result.value = {
      success: true,
      message: 'Onboarding link created',
      onboardingUrl: response.onboardingUrl
    }
  } catch (error: any) {
    result.value = {
      success: false,
      message: error.data?.message || 'Failed to create onboarding link'
    }
  } finally {
    processingOrg.value = null
  }
}

// Check account status
const checkAccountStatus = async (org) => {
  processingOrg.value = org.id
  result.value = null

  try {
    const response = await $fetch('/api/admin/stripe/check-account-status', {
      method: 'POST',
      body: { accountId: org.stripe_account_id }
    })

    result.value = {
      success: true,
      message: `Account status: ${response.status}. Capabilities: ${Object.keys(response.capabilities).join(', ')}`
    }

    // Refresh the organization data
    await loadOrganizations()
  } catch (error: any) {
    result.value = {
      success: false,
      message: error.data?.message || 'Failed to check account status'
    }
  } finally {
    processingOrg.value = null
  }
}

// Refresh organizations
const refreshOrganizations = () => {
  loadOrganizations()
}

// Test webhook
const testWebhook = async () => {
  try {
    await $fetch('/api/admin/stripe/test-webhook', { method: 'POST' })
    result.value = {
      success: true,
      message: 'Webhook test sent. Check your terminal for results.'
    }
  } catch (error: any) {
    result.value = {
      success: false,
      message: 'Failed to test webhook'
    }
  }
}

// Load data on mount
onMounted(() => {
  if (isAuthorized.value) {
    loadOrganizations()
  }
})

// Meta
useHead({
  title: 'Stripe Connect Admin - RaceUp'
})

// Prevent indexing
useServerSeoMeta({
  robots: 'noindex, nofollow'
})
</script>
