import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";
import { useServerStripe } from "#stripe/server";

export default defineEventHandler(async (event) => {
  try {
    console.log("=== Get Payment Intent Details ===");

    const user = await serverSupabaseUser(event);
    if (!user) {
      throw createError({ statusCode: 401, message: "Unauthorized" });
    }

    const body = await readBody(event);
    const { paymentIntentId } = body;

    if (!paymentIntentId) {
      throw createError({
        statusCode: 400,
        message: "Payment Intent ID required",
      });
    }

    const stripe = await useServerStripe(event);

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    console.log("Payment intent retrieved:", {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      metadata: paymentIntent.metadata,
    });

    // Parse cart data from metadata
    const cartData = paymentIntent.metadata.cart_data
      ? JSON.parse(paymentIntent.metadata.cart_data)
      : null;

    // Calculate detailed pricing breakdown
    const supabase = await serverSupabaseClient(event);
    const breakdown = {
      items: [] as any[],
      subtotal: 0,
      fees: 0,
      total: paymentIntent.amount,
      currency: paymentIntent.currency,
    };

    if (!cartData) {
      // Return basic payment intent info if no cart data
      console.warn("No cart data found in payment intent metadata");
      breakdown.subtotal = paymentIntent.amount;
      breakdown.fees = 0;

      return {
        success: true,
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
        },
        breakdown,
      };
    }

    // Process each cart item if cart data exists
    for (const cartItem of cartData.items) {
      console.log("Processing cart item:", cartItem);

      // Get race details
      const { data: race } = await supabase
        .from("races")
        .select("id, name, price_cents, distance, date, event_id")
        .eq("id", cartItem.raceId)
        .single();

      if (!race) {
        console.warn(`Race not found: ${cartItem.raceId}`);
        continue;
      }

      // Get race extras
      const { data: raceExtras } = await supabase
        .from("race_extras")
        .select("id, name, price_cents")
        .eq("race_id", cartItem.raceId);

      const itemBreakdown: any = {
        raceId: race.id,
        raceName: race.name,
        raceDate: race.date,
        distance: race.distance,
        currency: paymentIntent.currency,
        participants: [] as any[],
        itemTotal: 0,
      };

      // Process each participant
      for (const participant of cartItem.participants) {
        const participantBreakdown: any = {
          name: `${participant.firstName} ${participant.lastName}`,
          registrationFee: race.price_cents,
          extras: [] as any[],
          participantTotal: race.price_cents,
        };

        // Process participant extras
        if (participant.extras && participant.extras.length > 0) {
          for (const extraId of participant.extras) {
            const extra = raceExtras?.find((e: any) => e.id === extraId);
            if (extra) {
              participantBreakdown.extras.push({
                id: extra.id,
                name: extra.name,
                price: extra.price_cents,
              });
              participantBreakdown.participantTotal += extra.price_cents;
            }
          }
        }

        itemBreakdown.participants.push(participantBreakdown);
        itemBreakdown.itemTotal += participantBreakdown.participantTotal;
      }

      breakdown.items.push(itemBreakdown);
      breakdown.subtotal += itemBreakdown.itemTotal;
    }

    // Calculate fees (assuming 5% platform fee)
    breakdown.fees = breakdown.total - breakdown.subtotal;

    console.log("Final breakdown:", breakdown);

    return {
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      },
      breakdown,
    };
  } catch (error: any) {
    console.error("Error retrieving payment intent:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to retrieve payment intent",
    });
  }
});
