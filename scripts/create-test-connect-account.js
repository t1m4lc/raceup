// Test script to create a real Stripe Connect account
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

async function createTestConnectAccount() {
  try {
    // Create Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'FR', // or your country
      email: 'timothy.alcaide+test-connect-stripe@gmail.com',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    console.log('✅ Created test account:', account.id);
    
    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: 'http://localhost:3000/stripe/refresh',
      return_url: 'http://localhost:3000/stripe/success', 
      type: 'account_onboarding',
    });

    console.log('🔗 Onboarding URL:', accountLink.url);
    console.log('\n📋 Steps:');
    console.log('1. Open the onboarding URL in your browser');
    console.log('2. Complete the form with test data');
    console.log('3. Use this account ID in your database:', account.id);
    
    return { accountId: account.id, onboardingUrl: accountLink.url };
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createTestConnectAccount();
