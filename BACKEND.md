# RaceUp - Race Ticketing MVP

This is the backend implementation for a race ticketing MVP using Nuxt 3, Supabase, and Stripe Connect.

## Database Schema

The SQL schema is defined in `sql/schema.sql` and includes the following tables:

- `profiles`: Extends auth.users with additional profile information, including roles
- `events`: Contains race events organized by organizers
- `races`: Individual races within events, with pricing information
- `event_volunteers`: Junction table linking volunteers to events
- `tickets`: Purchased tickets for races
- `participants`: Participants linked to tickets
- `payments`: Payment records with Stripe integration

Row-Level Security (RLS) policies are implemented to ensure:

- Organizers can only manage their events
- Volunteers can only check in participants for assigned events
- Users can only see their purchased tickets

## API Endpoints

### Checkout and Payment

- `POST /api/races/[raceSlug]/checkout`: Creates a Stripe payment intent for race registration
- `POST /api/webhooks/stripe`: Webhook handler for Stripe events

### Ticket Management

- `GET /api/tickets/[ticketId]`: Retrieves ticket details with participants

### Admin Functionality

- `GET /api/admin/events/[eventId]/participants`: Lists all participants for an event (organizer only)
- `POST /api/admin/checkin/[participantId]`: Updates participant check-in status (volunteer only)

## Stripe Connect Integration

The system uses Stripe Connect for payments:
- Participant pays full amount
- A percentage (10%) is taken as platform fee
- The rest goes to the organizer's Stripe account

All price handling is done server-side for security.

### Server-Side Stripe Usage

We use the `@unlok-co/nuxt-stripe` module for Stripe integration. The server-side API is accessed via:

```typescript
// Import the composable from the module
import { useServerStripe } from "#stripe/server";

// Inside your event handler
const stripe = await useServerStripe(event);

// Now use the stripe instance
const paymentIntent = await stripe.paymentIntents.create({
  // payment details
});
```

### Client-Side Stripe Usage

The module also provides client-side integration for Stripe Elements:

```typescript
// In your Vue component
const { stripe, isLoading } = useClientStripe();

// Watch for stripe to be loaded
watch(stripe, async () => {
  if (stripe.value) {
    // Create Stripe elements
    const elements = stripe.value.elements({
      // elements options
    });
    
    // Mount payment elements to the DOM
    const paymentElement = elements.create('payment');
    paymentElement.mount('#payment-element');
  }
});
```

## Setup Requirements

Environment variables needed:
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `SUPABASE_SERVICE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLIC_KEY`
- `STRIPE_WEBHOOK_SECRET`

## Getting Started

1. Set up the Supabase schema using the SQL files
2. Run the seed script to add sample data
3. Configure your Stripe Connect account
4. Set the environment variables
5. Start the Nuxt application
