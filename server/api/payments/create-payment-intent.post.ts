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

    // Get Supabase client
    const supabase = await serverSupabaseClient<Database>(event);

    // Get the user's profile
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

    // Calculate total amount and validate races (NO tickets created yet)
    let totalPriceCents = 0;
    const validatedCartItems = [];

    // Initialize Stripe
    const stripe = await useServerStripe(event);

    // Process each cart item - VALIDATE ONLY
    for (const cartItem of cartItems) {
      // Get race details to validate and calculate pricing
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

      // Store validated cart item with race data
      validatedCartItems.push({
        ...cartItem,
        race,
        calculatedTotal: itemTotal,
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

    // Check if all races belong to organizations with completed Stripe Connect setup
    const organizationAccounts = new Map();

    for (const item of validatedCartItems) {
      const org = item.race.event.organization;
      if (!organizationAccounts.has(org.id)) {
        // Verify Stripe Connect account is properly set up
        if (!org.stripe_account_id) {
          throw createError({
            statusCode: 400,
            message: `Organization "${org.name}" has not set up payment processing. Please contact the organizer.`,
          });
        }

        if (!org.stripe_onboarding_completed) {
          throw createError({
            statusCode: 400,
            message: `Organization "${org.name}" has not completed payment setup. Please contact the organizer.`,
          });
        }

        organizationAccounts.set(org.id, {
          stripeAccountId: org.stripe_account_id,
          name: org.name,
        });
      }
    }

    // For now, handle single organization. TODO: Support multiple organizations in one payment
    if (organizationAccounts.size > 1) {
      throw createError({
        statusCode: 400,
        message:
          "Cart contains races from multiple organizations. Please checkout each organization separately.",
      });
    }

    // Get the organization's Stripe account
    const firstRace = validatedCartItems[0].race;
    const orgAccount = organizationAccounts.get(
      firstRace.event.organization.id
    );
    const stripeAccountId = orgAccount.stripeAccountId;

    // 🚀 NEW: Create pending order FIRST (before Payment Intent)
    const { data: pendingOrder, error: orderError } = await supabase
      .from("pending_orders")
      .insert({
        user_id: profile.id,
        cart_items: cartItems,
        contact_info: contactInfo,
        commission_config: commissionConfig,
        total_amount_cents: finalAmountCents,
        currency: firstRace.currency,
        status: "pending",
      })
      .select()
      .single();

    if (orderError || !pendingOrder) {
      console.error("Error creating pending order:", orderError);

      // Provide specific error message for missing table
      if (orderError?.code === "42501") {
        throw createError({
          statusCode: 500,
          message:
            "Database setup required: pending_orders table does not exist. Please run migrations.",
        });
      }

      if (orderError?.code === "42P01") {
        throw createError({
          statusCode: 500,
          message:
            "Database table missing: pending_orders table not found. Please run migrations.",
        });
      }

      throw createError({
        statusCode: 500,
        message: "Failed to create order",
      });
    }

    console.log("✅ Pending order created:", pendingOrder.id);

    // Create payment intent with minimal metadata - just the pending order ID
    const paymentIntentData = {
      amount: finalAmountCents,
      currency: firstRace.currency.toLowerCase(),
      receipt_email: contactInfo.email,
      metadata: {
        // 🎯 ONLY store the pending order ID (well under 500 chars!)
        pending_order_id: pendingOrder.id,
        user_id: profile.id,
        user_email: profile.email || contactInfo.email,
      },
    };

    // Add Stripe Connect configuration
    if (stripeAccountId && !stripeAccountId.startsWith("acct_test_")) {
      Object.assign(paymentIntentData, {
        transfer_data: {
          destination: stripeAccountId,
        },
        application_fee_amount: fees.totalFeeCents,
      });
    } else if (stripeAccountId && stripeAccountId.startsWith("acct_test_")) {
      console.log(`Skipping transfer for test account: ${stripeAccountId}`);
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

    // Update pending order with payment intent ID
    await supabase
      .from("pending_orders")
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        status: "processing",
      })
      .eq("id", pendingOrder.id);

    console.log("✅ Payment Intent created:", paymentIntent.id);

    // Return payment details with pending order ID (instead of ticket IDs)
    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      pendingOrderId: pendingOrder.id, // 🆕 For tracking
      amount: finalAmountCents / 100,
      currency: firstRace.currency,
      fees: fees.totalFeeCents / 100,
      message: "Payment intent created. Complete payment to create tickets.",
    };
  } catch (error: any) {
    console.error("Payment intent creation error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to create payment intent",
    });
  }
});
