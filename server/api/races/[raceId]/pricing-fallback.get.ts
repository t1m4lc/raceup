// server/api/races/[raceId]/pricing-fallback.get.ts
// Fallback pricing API for development when extras table is not available

export default defineEventHandler(async (event) => {
  const raceId = getRouterParam(event, "raceId");

  if (!raceId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Race ID is required",
    });
  }

  // Default pricing structure - this would normally come from the database
  const defaultPricing = {
    race: {
      id: raceId,
      name: "Sample Race",
      price_cents: 5000, // 50 EUR default race price
      currency: "EUR",
    },
    extras: [
      {
        id: "1",
        name: "T-Shirt",
        description: "Official race t-shirt",
        price_cents: 2500,
        currency: "EUR",
        max_quantity: 1,
        available_quantity: 100,
      },
      {
        id: "2",
        name: "Medal",
        description: "Finisher medal",
        price_cents: 1500,
        currency: "EUR",
        max_quantity: 1,
        available_quantity: 100,
      },
      {
        id: "3",
        name: "Certificate",
        description: "Digital certificate",
        price_cents: 500,
        currency: "EUR",
        max_quantity: 1,
        available_quantity: 100,
      },
      {
        id: "4",
        name: "Goody Bag",
        description: "Race goody bag with sponsor items",
        price_cents: 3000,
        currency: "EUR",
        max_quantity: 1,
        available_quantity: 50,
      },
      {
        id: "5",
        name: "Breakfast",
        description: "Pre-race breakfast",
        price_cents: 1200,
        currency: "EUR",
        max_quantity: 1,
        available_quantity: 80,
      },
      {
        id: "6",
        name: "Lunch",
        description: "Post-race lunch",
        price_cents: 1800,
        currency: "EUR",
        max_quantity: 1,
        available_quantity: 80,
      },
      {
        id: "7",
        name: "Pasta Party",
        description: "Pre-race pasta party",
        price_cents: 2200,
        currency: "EUR",
        max_quantity: 1,
        available_quantity: 60,
      },
    ],
  };

  return defaultPricing;
});
