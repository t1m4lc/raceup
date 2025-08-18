<template>
  <div class="stripe-payment-form">
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Loading payment form...</p>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <!-- Payment Element will be mounted here -->
    <form id="payment-form" @submit.prevent="handleSubmit">
      <div id="link-authentication-element" class="mb-4">
        <!-- Link Authentication Element will be mounted here -->
      </div>
      <div id="payment-element" class="mb-4">
        <!-- Payment Element will be mounted here -->
      </div>
      <button 
        type="submit" 
        :disabled="isProcessing || !stripe || !elements"
        class="payment-button"
      >
        <span v-if="isProcessing">
          Processing...
        </span>
        <span v-else>
          Pay now
        </span>
      </button>
      <div v-if="paymentMessage" class="payment-message">
        {{ paymentMessage }}
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps({
  ticketId: {
    type: String,
    required: true
  },
  clientSecret: {
    type: String,
    required: true
  }
});

const emit = defineEmits<{
  'payment-success': [paymentIntent: any]
  'payment-error': [error: any]
}>();

const { stripe, isLoading: stripeLoading } = useClientStripe();
const loading = ref(stripeLoading.value);
const error = ref('');
const elements = ref(null);
const isProcessing = ref(false);
const paymentMessage = ref('');

// Watch for Stripe to load
watch(stripe, async () => {
  if (stripe.value && props.clientSecret) {
    loading.value = true;
    try {
      // Create Elements instance
      elements.value = stripe.value.elements({
        clientSecret: props.clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#4f46e5',
          },
        },
      });

      // Create and mount the Link Authentication Element
      const linkAuthenticationElement = elements.value.create('linkAuthentication');
      linkAuthenticationElement.mount('#link-authentication-element');

      // Create and mount the Payment Element
      const paymentElement = elements.value.create('payment');
      paymentElement.mount('#payment-element');
    } catch (err) {
      console.error('Error creating Stripe elements:', err);
      error.value = 'Failed to initialize payment form. Please try again.';
    } finally {
      loading.value = false;
    }
  }
}, { immediate: true });

// Handle form submission
const handleSubmit = async () => {
  if (!stripe.value || !elements.value) {
    return;
  }

  isProcessing.value = true;
  paymentMessage.value = '';

  try {
    const { error: submitError } = await stripe.value.confirmPayment({
      elements: elements.value,
      confirmParams: {
        return_url: `${window.location.origin}/payment/confirmation/${props.ticketId}`,
      },
      redirect: 'if_required',
    });

    if (submitError) {
      // Show error to customer
      paymentMessage.value = submitError.message || 'An unexpected error occurred.';
      emit('payment-error', submitError);
    } else {
      // The payment has been processed!
      paymentMessage.value = 'Payment successful!';
      emit('payment-success', { ticketId: props.ticketId });
      
      // Navigate to confirmation page
      navigateTo(`/payment/confirmation/${props.ticketId}`);
    }
  } catch (err) {
    console.error('Payment confirmation error:', err);
    paymentMessage.value = 'An unexpected error occurred. Please try again.';
    emit('payment-error', err);
  } finally {
    isProcessing.value = false;
  }
};
</script>

<style scoped>
.stripe-payment-form {
  position: relative;
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.loading-spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border-left-color: #4f46e5;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.payment-button {
  background: #4f46e5;
  color: white;
  border-radius: 4px;
  border: 0;
  padding: 12px 16px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: block;
  width: 100%;
  transition: all 0.2s ease;
}

.payment-button:hover {
  filter: brightness(1.1);
}

.payment-button:disabled {
  opacity: 0.5;
  cursor: default;
}

.payment-message {
  margin-top: 12px;
  text-align: center;
  color: rgb(105, 115, 134);
  font-size: 14px;
}

.error-message {
  color: #ef4444;
  margin: 16px 0;
  padding: 12px;
  border-radius: 4px;
  background-color: #fef2f2;
  border: 1px solid #fee2e2;
}
</style>
