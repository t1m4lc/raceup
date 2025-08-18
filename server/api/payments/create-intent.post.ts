import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";
import { useServerStripe } from "#stripe/server";
import type { Database } from "~/supabase/supabase";

export default defineEventHandler(async (event) => {
  try {
    // Get the current user
    const user = await serverSupabaseUser(event);
    if (!user) {
      throw createError({
        statusCode: 401,
        message: "Unauthorized",
      });
    }

    // Get the user's profile
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
    const { cartItems, contactInfo, commissionConfig } = body;

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      throw createError({
        statusCode: 400,
        message: "Valid cart items are required",
      });
    }

    if (!contactInfo || !contactInfo.email) {
      throw createError({
        statusCode: 400,
        message: "Contact information with email is required",
      });
    }

    // Calculate total amount
    let totalPriceCents = 0;
    const tickets = [];

    // Initialize Stripe
    const stripe = await useServerStripe(event);

    // Process each cart item
    for (const cartItem of cartItems) {
      // Get race details
      const { data: race, error: raceError } = await supabase
        .from("races")
        .select(
          `
          *,
          event:events(
            *,
            organization:organizations(*)
          )
        `
        )
        .eq("id", cartItem.raceId)
        .single();

      if (raceError || !race) {
        throw createError({
          statusCode: 404,
          message: `Race not found: ${cartItem.raceId}`,
        });
      }

      // Calculate price for this cart item
      const raceTotal = race.price_cents * cartItem.participants.length;

      // Calculate extras total for this cart item
      const extrasTotal = cartItem.participants.reduce(
        (total: number, participant: any) => {
          if (participant.extras && participant.extras.length > 0) {
            const participantExtrasTotal = participant.extras.reduce(
              (sum: number, extra: any) => {
                return sum + extra.price * extra.quantity * 100; // Convert euros to cents
              },
              0
            );
            return total + participantExtrasTotal;
          }
          return total;
        },
        0
      );

      const itemTotal = raceTotal + extrasTotal;
      totalPriceCents += itemTotal;

      // Create a pending ticket for this cart item
      const { data: ticket, error: ticketError } = await supabase
        .from("tickets")
        .insert({
          race_id: race.id,
          purchaser_id: profile.id,
          total_price_cents: itemTotal,
          currency: race.currency,
          status: "pending",
        })
        .select()
        .single();

      if (ticketError || !ticket) {
        console.error("Error creating ticket:", ticketError);
        throw createError({
          statusCode: 500,
          message: "Failed to create ticket",
        });
      }

      // Create participants for this ticket
      const participantsToInsert = cartItem.participants.map(
        (participant: any) => ({
          ticket_id: ticket.id,
          fullname: `${participant.first_name} ${participant.last_name}`,
          birthdate: participant.birthdate,
          gender: participant.gender,
          emergency_contact_name: participant.emergencyContactName || null,
          emergency_contact_phone: participant.emergencyContactPhone || null,
          medical_notes: participant.medicalNotes || null,
        })
      );

      const { error: participantsError } = await supabase
        .from("participants")
        .insert(participantsToInsert);

      if (participantsError) {
        console.error("Error creating participants:", participantsError);
        throw createError({
          statusCode: 500,
          message: "Failed to create participants",
        });
      }

      tickets.push({
        ticket,
        race,
        participants: cartItem.participants,
      });
    }

    // Apply commission/fees
    const calculateFees = (
      amountCents: number,
      config: {
        fixedFeeCents?: number;
        variablePercent?: number;
        feeAllocation?: "participant" | "organizer" | "split";
      } = {}
    ) => {
      const fixedFeeCents = config.fixedFeeCents ?? 100; // 1 EUR default
      const variablePercent = config.variablePercent ?? 3.5; // 3.5% default
      const feeAllocation = config.feeAllocation ?? "participant";

      const variableFeeCents = Math.floor(
        amountCents * (variablePercent / 100)
      );
      const totalFeeCents = fixedFeeCents + variableFeeCents;

      let finalAmountCents = amountCents;
      if (feeAllocation === "participant") {
        finalAmountCents = amountCents + totalFeeCents;
      } else if (feeAllocation === "split") {
        finalAmountCents = amountCents + Math.floor(totalFeeCents / 2);
      }

      return {
        fixedFeeCents,
        variableFeeCents,
        totalFeeCents,
        feeAllocation,
        finalAmountCents,
        subtotalCents: amountCents,
      };
    };

    const fees = calculateFees(totalPriceCents, commissionConfig);
    const finalAmountCents = fees.finalAmountCents;

    // Get organization's Stripe account (use first race's organization)
    const firstRace = tickets[0].race;
    const stripeAccountId = firstRace.event.organization.stripe_account_id;

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: finalAmountCents,
      currency: firstRace.currency.toLowerCase(),
      receipt_email: contactInfo.email,
      metadata: {
        user_id: profile.id,
        user_email: profile.email || contactInfo.email,
        ticket_ids: tickets.map((t) => t.ticket.id).join(","),
        total_participants: cartItems.reduce(
          (sum, item) => sum + item.participants.length,
          0
        ),
      },
      ...(stripeAccountId && {
        transfer_data: {
          destination: stripeAccountId,
        },
        application_fee_amount: fees.totalFeeCents,
      }),
    });

    // Update tickets with payment intent ID
    for (const { ticket } of tickets) {
      await supabase
        .from("tickets")
        .update({ stripe_payment_intent_id: paymentIntent.id })
        .eq("id", ticket.id);

      // Create payment record
      await supabase.from("payments").insert({
        ticket_id: ticket.id,
        amount_cents: ticket.total_price_cents,
        application_fee_cents: Math.round(fees.totalFeeCents / tickets.length), // Split fee across tickets
        stripe_payment_intent_id: paymentIntent.id,
        status: "pending",
      });
    }

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      ticketIds: tickets.map((t) => t.ticket.id),
      amount: finalAmountCents / 100,
      currency: firstRace.currency,
      fees: fees.totalFeeCents / 100,
    };
  } catch (error: any) {
    console.error("Payment intent creation error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to create payment intent",
    });
  }
});
