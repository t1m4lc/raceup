<template>
  <div class="container mx-auto p-6">
    <h1 class="text-2xl font-bold mb-6">🧪 Stripe Connect Test Setup</h1>
    
    <div class="bg-blue-50 p-4 rounded mb-6">
      <h2 class="text-lg font-semibold mb-2">📋 What this does:</h2>
      <ul class="list-disc list-inside space-y-1 text-sm">
        <li>Creates a real Stripe Connect Express account (in test mode)</li>
        <li>Updates "Trail Runners Club" organization with this account</li>
        <li>Gives you an onboarding URL to complete setup</li>
        <li>After onboarding, transfers will work in test mode!</li>
      </ul>
    </div>

    <div v-if="loading" class="text-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      <p class="mt-2">Creating test Connect account...</p>
    </div>

    <div v-else-if="result" class="space-y-4">
      <div class="bg-green-50 p-4 rounded">
        <h3 class="font-semibold text-green-800">✅ Success!</h3>
        <p class="text-green-700">{{ result.message }}</p>
        <p class="text-sm text-green-600 mt-2">Account ID: {{ result.accountId }}</p>
      </div>

      <div class="bg-yellow-50 p-4 rounded">
        <h3 class="font-semibold text-yellow-800">🔗 Next Step: Complete Onboarding</h3>
        <p class="text-yellow-700 mb-3">Click the button below to complete Stripe Express onboarding:</p>
        <a 
          :href="result.onboardingUrl" 
          target="_blank"
          class="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Complete Stripe Onboarding
        </a>
      </div>

      <div class="bg-gray-50 p-4 rounded">
        <h3 class="font-semibold text-gray-800">🧪 After Onboarding:</h3>
        <ol class="list-decimal list-inside space-y-1 text-sm text-gray-700 mt-2">
          <li>The organization will be marked as "onboarding completed"</li>
          <li>You can test real transfers in test mode</li>
          <li>Go back to test-payment and try the payment flow</li>
          <li>Money will transfer from platform to organizer (in test mode)</li>
        </ol>
      </div>
    </div>

    <div v-else-if="error" class="bg-red-50 p-4 rounded">
      <h3 class="font-semibold text-red-800">❌ Error</h3>
      <p class="text-red-700">{{ error }}</p>
    </div>

    <div v-else class="text-center">
      <button 
        @click="createTestAccount"
        class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
      >
        🚀 Create Test Connect Account
      </button>
    </div>

    <div class="mt-8 bg-gray-50 p-4 rounded">
      <h3 class="font-semibold mb-2">💡 Alternative: Use Test Account IDs</h3>
      <p class="text-sm text-gray-600 mb-2">
        If you want to skip onboarding, you can use Stripe's special test account IDs:
      </p>
      <div class="bg-gray-800 text-green-400 p-2 rounded font-mono text-xs">
        acct_1032D82eZvKYlo2C (US Express account)<br>
        acct_1BnETx2s3IyWQdC7 (FR Express account)
      </div>
      <p class="text-xs text-gray-500 mt-2">
        These are special Stripe test accounts that work for transfers without onboarding.
      </p>
    </div>
  </div>
</template>

<script setup>
const loading = ref(false)
const result = ref(null)
const error = ref(null)

const createTestAccount = async () => {
  loading.value = true
  error.value = null
  result.value = null

  try {
    const response = await $fetch('/api/admin/create-test-connect-account', {
      method: 'POST'
    })
    
    result.value = response
  } catch (err) {
    error.value = err.data?.message || err.message || 'Failed to create account'
  } finally {
    loading.value = false
  }
}

useHead({
  title: 'Stripe Connect Test Setup - RaceUp'
})

definePageMeta({
  middleware: 'master-mode'
})
</script>
