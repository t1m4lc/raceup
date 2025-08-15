# RaceUp - Race Ticketing Platform

RaceUp is a race ticketing platform built with Nuxt 3, Supabase, Stripe Connect, and Shadcn-Vue. It allows race organizers to create and manage race events, and participants to register and purchase tickets.

## Features

- User authentication with Supabase Auth
- Event and race management for organizers
- Ticket purchasing with Stripe Connect
- Participant management and check-in
- Responsive UI with Shadcn-Vue components

## Prerequisites

- Node.js (v18+)
- npm or yarn
- Supabase account
- Stripe account with Connect enabled

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/raceup.git
cd raceup
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment setup

Copy the environment example file and update it with your own values:

```bash
cp .env.example .env
```

Edit `.env` with your Supabase and Stripe credentials:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
```

### 4. Database Setup

#### Using Supabase CLI

1. Install the Supabase CLI:

```bash
npm install -g supabase
```

2. Login to Supabase:

```bash
supabase login
```

3. Link your project:

```bash
supabase link --project-ref your-project-ref
```

4. Push the database schema:

```bash
supabase db push
```

5. Seed the database:

```bash
supabase db reset && supabase db seed ./supabase/seed.sql
```

#### Manual Setup

1. Open the Supabase dashboard for your project
2. Go to the SQL Editor
3. Copy the contents of `./supabase/schema.sql` and execute it
4. Copy the contents of `./supabase/seed.sql`, update the UUIDs as needed, and execute it

### 5. Start the development server

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`.

## Testing the Application

### User Registration & Login

1. Go to `http://localhost:3000/login`
2. Sign up with your email and password
3. Verify your email if required by your Supabase settings

### Purchasing a Ticket

1. Browse to `http://localhost:3000` to see available events
2. Click on an event to view available races
3. Select a race and fill in participant details
4. Complete the checkout process with Stripe test card:
   - Card number: `4242 4242 4242 4242`
   - Expiration: Any future date
   - CVC: Any 3 digits
   - Postal code: Any 5 digits

### Admin Functions

1. Login with an organizer account
2. Go to `http://localhost:3000/admin` to access organizer functions
3. Manage events, participants, and check-ins

## Stripe Webhook Testing

To test Stripe webhooks locally:

1. Install Stripe CLI: [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
2. Login to your Stripe account:

```bash
stripe login
```

3. Forward events to your local server:

```bash
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

4. Copy the webhook signing secret and add it to your `.env` file as `STRIPE_WEBHOOK_SECRET`

## Testing the Application

For detailed testing scenarios and instructions, please see the [TESTING.md](./TESTING.md) file.

You can use the provided test seed data to quickly set up a test environment:

#### Option 1: Minimal Testing (Events & Races Only)
```bash
# Using Supabase CLI
supabase db seed ./minimal-seed.sql

# Or using the SQL Editor in the Supabase dashboard
# Copy and paste the contents of minimal-seed.sql
```

#### Option 2: Complete Testing (With Users, Tickets, etc.)
1. First, create users in Supabase Authentication
2. Get the user UUIDs from the Supabase dashboard
3. Edit `test-seed.sql` and replace `YOUR_ACTUAL_AUTH_USER_ID` with real UUIDs
4. Run the seed file:
```bash
# Using Supabase CLI
supabase db seed ./test-seed.sql

# Or using the SQL Editor in the Supabase dashboard
# Copy and paste the edited contents of test-seed.sql
```
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
