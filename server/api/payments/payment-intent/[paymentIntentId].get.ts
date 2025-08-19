import { useServerStripe } from "#stripe/server";

export default defineEventHandler(async (event) => {
  try {
    const paymentIntentId = getRouterParam(event, "paymentIntentId");

    console.log("=== PAYMENT INTENT API CALLED ===");
    console.log("Payment Intent ID:", paymentIntentId);

    if (!paymentIntentId) {
      throw createError({
        statusCode: 400,
        message: "Payment Intent ID is required",
      });
    }

    const stripe = await useServerStripe(event);
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    console.log("Stripe Payment Intent retrieved:", {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      application_fee_amount: paymentIntent.application_fee_amount,
    });

    if (!paymentIntent) {
      throw createError({
        statusCode: 404,
        message: "Payment intent not found",
      });
    }

    // Calculer les frais depuis les métadonnées ou depuis l'amount
    const applicationFeeAmount = paymentIntent.application_fee_amount || 0;
    const totalAmount = paymentIntent.amount;
    const fees = applicationFeeAmount / 100; // Convertir en euros

    const result = {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: totalAmount / 100, // Convertir centimes en euros
      currency: paymentIntent.currency.toUpperCase(),
      fees: fees,
      status: paymentIntent.status,
    };

    console.log("API Response:", result);
    return result;
  } catch (error: any) {
    console.error("Error fetching payment intent:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to fetch payment intent details",
    });
  }
});
