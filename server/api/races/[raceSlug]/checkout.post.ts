import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";
import { useServerStripe } from "#stripe/server";
import { calculatePlatformFee } from "~/server/utils/helpers";
import type { Database } from "~/supabase/supabase";

export default defineEventHandler(async (event) => {
  try {
    // Get the race slug from the URL params
    const raceSlug = getRouterParam(event, "raceSlug");
    if (!raceSlug) {
      throw createError({ statusCode: 400, message: "Race slug is required" });
    }

    // Get the current user
    const user = await serverSupabaseUser(event);
    if (!user) {
      throw createError({
        statusCode: 401,
        message: "Unauthorized",
      });
    }

    // Get the user's profile - using user.id directly as profile id
    const supabase = await serverSupabaseClient<Database>(event);
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      throw createError({
        statusCode: 404,
        message: "User profile not found",
      });
    }

    // Parse request body
    const body = await readBody(event);
    const { participants } = body;

    if (
      !participants ||
      !Array.isArray(participants) ||
      participants.length === 0
    ) {
      throw createError({
        statusCode: 400,
        message: "Valid participants array is required",
      });
    }

    // Get the race details
    const { data: race, error: raceError } = await supabase
      .from("races")
      .select("*, event:events(*)")
      .eq("slug", raceSlug)
      .single();

    if (raceError || !race) {
      console.error("Error fetching race:", raceError);
      throw createError({
        statusCode: 404,
        message: "Race not found",
      });
    }

    // Calculate total price (race price * number of participants)
    const totalPriceCents = race.price_cents * participants.length;
    const applicationFeeCents = calculatePlatformFee(totalPriceCents);
    const netAmount = totalPriceCents - applicationFeeCents;

    // Initialize Stripe using the composable
    const stripe = await useServerStripe(event);

    // Create a PaymentIntent with the calculated amount
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: totalPriceCents,
        currency: race.currency,
        application_fee_amount: applicationFeeCents,
        transfer_data: {
          destination: race.event.stripe_account_id,
        },
        metadata: {
          race_id: race.id,
          race_name: race.name,
          event_id: race.event_id,
          event_name: race.event.name,
          purchaser_id: profile.id,
          num_participants: participants.length,
        },
      },
      {
        stripeAccount: race.event.stripe_account_id,
      }
    );

    // Create a ticket in the database
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .insert({
        race_id: race.id,
        purchaser_id: profile.id,
        total_price_cents: totalPriceCents,
        currency: race.currency,
        stripe_payment_intent_id: paymentIntent.id,
        status: "pending",
      })
      .select()
      .single();

    if (ticketError || !ticket) {
      console.error("Error creating ticket:", ticketError);

      // Cancel the payment intent if we couldn't create the ticket
      await stripe.paymentIntents.cancel(paymentIntent.id, {
        stripeAccount: race.event.stripe_account_id,
      });

      throw createError({
        statusCode: 500,
        message: "Failed to create ticket",
      });
    }

    // Create participants for the ticket
    const participantsToInsert = participants.map((participant) => ({
      ticket_id: ticket.id,
      full_name: participant.fullname, // Changed to full_name to match new schema
      birthdate: participant.birthdate,
      gender: participant.gender,
      certificate_url: participant.certificate_url || null,
      certificate_validated: false,
    }));

    const { error: participantsError } = await supabase
      .from("participants")
      .insert(participantsToInsert);

    if (participantsError) {
      console.error("Error creating participants:", participantsError);

      // We'll still return the payment intent, but log the error
      // A background job could reconcile this later
    }

    // Create a payment record
    const { error: paymentError } = await supabase.from("payments").insert({
      ticket_id: ticket.id,
      amount_cents: totalPriceCents,
      application_fee_cents: applicationFeeCents,
      stripe_payment_intent_id: paymentIntent.id,
      status: "pending",
    });

    if (paymentError) {
      console.error("Error creating payment record:", paymentError);
      // We'll still return the payment intent, but log the error
    }

    // Return the client secret and other necessary details
    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      ticketId: ticket.id,
      amount: totalPriceCents / 100, // Convert to base currency unit for display
      currency: race.currency,
      applicationFee: applicationFeeCents / 100, // Convert to base currency unit
    };
  } catch (error: any) {
    console.error("Checkout error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "An error occurred during checkout",
    });
  }
});
