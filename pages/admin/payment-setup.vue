<template>
  <div>
    <div class="flex items-center justify-between space-y-2 mb-6">
      <div>
        <h2 class="text-3xl font-bold tracking-tight">Payment Setup</h2>
        <p class="text-muted-foreground">
          Configure Stripe Connect to receive payments for your events
        </p>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center my-12">
      <div class="animate-spin h-12 w-12 border-t-4 border-b-4 border-primary rounded-full"></div>
    </div>

    <div v-else-if="error" class="bg-destructive/20 p-4 rounded-md text-destructive mb-4">
      {{ error }}
    </div>

    <div v-else>
      <!-- Organization Stripe Status -->
      <Card v-if="organization" class="mb-6">
        <CardHeader>
          <CardTitle>{{ organization.name }}</CardTitle>
          <CardDescription>Payment processing status for your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <!-- Current Status -->
            <div class="flex items-center justify-between p-4 border rounded-lg">
              <div class="flex items-center gap-3">
                <div :class="organization.stripe_onboarding_completed ? 'text-green-600' : 'text-orange-500'">
                  <CheckCircle2Icon v-if="organization.stripe_onboarding_completed" class="h-6 w-6" />
                  <AlertCircleIcon v-else class="h-6 w-6" />
                </div>
                <div>
                  <p class="font-medium">Payment Processing</p>
                  <p class="text-sm text-muted-foreground">
                    {{ organization.stripe_onboarding_completed ? 'Ready to receive payments' : 'Setup required to receive payments' }}
                  </p>
                </div>
              </div>
              <Badge :variant="organization.stripe_onboarding_completed ? 'default' : 'secondary'">
                {{ organization.stripe_onboarding_completed ? 'Active' : 'Pending' }}
              </Badge>
            </div>

            <!-- Stripe Account Info -->
            <div v-if="organization.stripe_account_id" class="p-4 bg-muted rounded-lg">
              <p class="text-sm font-medium mb-2">Stripe Account</p>
              <p class="text-xs text-muted-foreground font-mono">{{ organization.stripe_account_id }}</p>
            </div>

            <!-- Setup Actions -->
            <div class="space-y-3">
              <div v-if="!organization.stripe_account_id" class="text-center py-8">
                <CreditCardIcon class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 class="text-lg font-medium mb-2">Payment Setup Required</h3>
                <p class="text-muted-foreground mb-6">
                  To receive payments for your events, you need to set up a Stripe Connect account.
                  This will be handled by the platform administrator.
                </p>
                <Button variant="outline" @click="requestStripeSetup">
                  <MailIcon class="h-4 w-4 mr-2" />
                  Request Payment Setup
                </Button>
              </div>

              <div v-else-if="!organization.stripe_onboarding_completed" class="text-center py-8">
                <AlertCircleIcon class="h-12 w-12 text-orange-500 mx-auto mb-4" />
                <h3 class="text-lg font-medium mb-2">Complete Your Setup</h3>
                <p class="text-muted-foreground mb-6">
                  Your Stripe account has been created but onboarding is not complete.
                  Contact the platform administrator to complete the setup.
                </p>
                <Button variant="outline" @click="contactSupport">
                  <MailIcon class="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </div>

              <div v-else class="text-center py-8">
                <CheckCircle2Icon class="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 class="text-lg font-medium mb-2">Payment Setup Complete</h3>
                <p class="text-muted-foreground mb-6">
                  Your organization is ready to receive payments for events.
                </p>
              </div>
            </div>

            <!-- Payment Info -->
            <div v-if="organization.stripe_onboarding_completed" class="border-t pt-4">
              <h4 class="font-medium mb-3">How payments work:</h4>
              <div class="space-y-2 text-sm text-muted-foreground">
                <div class="flex items-start gap-2">
                  <span class="font-medium text-foreground">1.</span>
                  <span>Participants pay for race registration (race price + platform fee)</span>
                </div>
                <div class="flex items-start gap-2">
                  <span class="font-medium text-foreground">2.</span>
                  <span>Platform fee is deducted automatically</span>
                </div>
                <div class="flex items-start gap-2">
                  <span class="font-medium text-foreground">3.</span>
                  <span>Remaining amount is transferred to your Stripe account</span>
                </div>
                <div class="flex items-start gap-2">
                  <span class="font-medium text-foreground">4.</span>
                  <span>Payouts are handled automatically by Stripe</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- No Organization -->
      <Card v-else>
        <CardContent class="pt-6">
          <div class="text-center py-8">
            <Building2Icon class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 class="text-lg font-medium mb-2">No Organization Found</h3>
            <p class="text-muted-foreground mb-6">
              You need to be a founder of an organization to set up payments.
            </p>
            <Button asChild>
              <NuxtLink to="/organizations">
                Browse Organizations
              </NuxtLink>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { CheckCircle2Icon, AlertCircleIcon, CreditCardIcon, MailIcon, Building2Icon } from 'lucide-vue-next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// State
const user = useSupabaseUser()
const client = useSupabaseClient()
const loading = ref(true)
const error = ref('')
const organization = ref(null)

// Fetch user's organization
const fetchOrganization = async () => {
  if (!user.value) return

  try {
    loading.value = true
    error.value = ''

    const { data, error: fetchError } = await client
      .from('organizations')
      .select('id, name, description, stripe_account_id, stripe_onboarding_completed')
      .eq('founder_id', user.value.id)
      .maybeSingle()

    if (fetchError) throw fetchError

    organization.value = data
  } catch (err: any) {
    error.value = err.message || 'Failed to load organization information'
  } finally {
    loading.value = false
  }
}

// Request Stripe setup
const requestStripeSetup = async () => {
  // This would typically send an email or create a support ticket
  alert('A request has been sent to the platform administrator to set up payment processing for your organization.')
}

// Contact support
const contactSupport = () => {
  // This would open a support form or email
  alert('Please contact support for assistance with completing your payment setup.')
}

onMounted(() => {
  fetchOrganization()
})

definePageMeta({
  layout: 'admin',
  middleware: 'organization-admin'
})
</script>
