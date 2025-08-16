# Organization and Event Structure Changes

This document describes the changes made to the RaceUp platform to introduce organizations and better handle event editions.

## New Data Structure

### Organizations
- Each organization can run multiple events
- Organizations have members with specific roles (founder, admin, volunteer)
- Organizations have their own Stripe account for payments

### Events
- Events are now split into event_roots and event_editions
- An event_root represents the base event concept (e.g., "Paris Marathon")
- Each event_root can have multiple event_editions (e.g., "Paris Marathon 2024", "Paris Marathon 2025")

### Races
- Races are linked to specific event_editions
- Race concepts (types) are tracked in race_roots

### Commission System
- Commission fees are configured at the organization level
- Fees include:
  - Fixed fee (e.g., €1 per transaction)
  - Variable percentage (e.g., 3.5% of transaction)
- Fee allocation can be:
  - Paid by participant
  - Paid by organizer
  - Split between both

## Admin Controls

Commission settings can only be modified by platform administrators through the Supabase backend. Organizations can view their current commission structure but cannot modify it.

## User Experience

The changes are largely transparent to end users, who will see:
1. Clearer organization of events by organizing body
2. More consistent branding across event editions
3. Transparent fee calculation during checkout
4. Ability to browse events by organization
