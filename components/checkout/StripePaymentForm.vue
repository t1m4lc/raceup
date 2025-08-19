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
import { ref, watch, nextTick } from 'vue';

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
const elements = ref<any>(null);
const isProcessing = ref(false);
const paymentMessage = ref('');

// Watch for Stripe to load
watch(stripe, async () => {
  if (stripe.value && props.clientSecret) {
    loading.value = true;
    try {
      // Wait for DOM elements to be ready
      await nextTick();
      
      // Check if elements exist before mounting
      const linkElement = document.getElementById('link-authentication-element');
      const paymentElementDiv = document.getElementById('payment-element');
      
      if (!linkElement || !paymentElementDiv) {
        console.error('Payment form elements not found in DOM');
        error.value = 'Payment form not ready. Please refresh the page.';
        return;
      }

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
    paymentMessage.value = 'Payment system not ready. Please try again.';
    return;
  }

  isProcessing.value = true;
  paymentMessage.value = '';
  error.value = '';

  try {
    // Validate form elements before submission
    const { error: validationError } = await elements.value.submit();
    if (validationError) {
      console.error('Form validation error:', validationError);
      
      // Gestion spécifique des erreurs de validation
      let userMessage = validationError.message;
      if (validationError.code === 'incomplete_number') {
        userMessage = 'Veuillez saisir un numéro de carte valide et complet.';
      } else if (validationError.code === 'incomplete_expiry') {
        userMessage = 'Veuillez saisir une date d\'expiration valide.';
      } else if (validationError.code === 'incomplete_cvc') {
        userMessage = 'Veuillez saisir un code de sécurité valide.';
      }
      
      paymentMessage.value = userMessage;
      emit('payment-error', validationError);
      return;
    }

    // Vérifier l'état du payment intent avant la confirmation
    console.log('=== BEFORE PAYMENT CONFIRMATION ===');
    console.log('Client Secret:', props.clientSecret);
    console.log('Ticket ID:', props.ticketId);
    
    // Récupérer l'état actuel du payment intent
    const { paymentIntent: currentPI } = await stripe.value.retrievePaymentIntent(props.clientSecret);
    
    if (!currentPI) {
      paymentMessage.value = 'Unable to retrieve payment information. Please try again.';
      emit('payment-error', { message: 'Payment intent not found' });
      return;
    }
    
    console.log('Payment Intent Status:', currentPI.status);
    console.log('Payment Intent ID:', currentPI.id);
    
    // Si le payment intent est déjà dans un état final, rediriger
    if (currentPI.status === 'succeeded') {
      console.log('Payment already succeeded, redirecting...');
      paymentMessage.value = 'Payment already completed!';
      emit('payment-success', { ticketId: props.ticketId });
      navigateTo(`/payment/confirmation/${props.ticketId}`);
      return;
    }
    
    if (currentPI.status === 'canceled') {
      paymentMessage.value = 'This payment has been canceled. Please start a new payment.';
      emit('payment-error', { message: 'Payment canceled' });
      return;
    }

    const { error: submitError } = await stripe.value.confirmPayment({
      elements: elements.value,
      confirmParams: {
        return_url: `${window.location.origin}/payment/confirmation/${props.ticketId}`,
      },
      redirect: 'if_required',
    });

    if (submitError) {
      // Show error to customer
      console.error('Stripe payment error:', submitError);
      
      // Gestion spécifique des erreurs Stripe
      let userMessage = submitError.message || 'An unexpected error occurred.';
      if (submitError.code === 'payment_intent_unexpected_state') {
        userMessage = 'Ce paiement a déjà été traité ou est dans un état invalide. Veuillez actualiser la page.';
      } else if (submitError.code === 'card_declined') {
        userMessage = 'Votre carte a été refusée. Veuillez vérifier vos informations ou utiliser une autre carte.';
      } else if (submitError.code === 'insufficient_funds') {
        userMessage = 'Fonds insuffisants. Veuillez utiliser une autre carte.';
      }
      
      paymentMessage.value = userMessage;
      emit('payment-error', submitError);
    } else {
      // The payment has been processed!
      console.log('Payment confirmation successful');
      paymentMessage.value = 'Payment successful!';
      emit('payment-success', { ticketId: props.ticketId });
      
      // Navigate to confirmation page with ticket ID
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
