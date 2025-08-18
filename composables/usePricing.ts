// composables/usePricing.ts
export const usePricing = () => {
  const cache = new Map<string, any>();

  const fetchPricing = async (raceId: string) => {
    // Check cache first
    if (cache.has(raceId)) {
      return cache.get(raceId);
    }

    try {
      const data = await $fetch(`/api/races/${raceId}/pricing`);

      // Cache the result
      cache.set(raceId, data);

      return data;
    } catch (error) {
      console.error("Failed to fetch pricing:", error);
      throw error;
    }
  };

  const getExtraPriceByName = (pricing: any, extraName: string) => {
    if (!pricing?.extras) return 0;

    const extra = pricing.extras.find((e: any) => e.name === extraName);
    return extra?.price_cents || 0;
  };

  const formatPrice = (priceCents: number, currency: string = "EUR") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "EUR",
    }).format(priceCents / 100);
  };

  const calculateParticipantTotal = (pricing: any, participant: any) => {
    if (!pricing) return 0;

    let total = pricing.race.price_cents; // Base race price

    if (participant.extras && participant.extras.length > 0) {
      for (const extraName of participant.extras) {
        total += getExtraPriceByName(pricing, extraName);
      }
    }

    return total;
  };

  const calculateItemTotal = (pricing: any, item: any) => {
    if (!pricing) return 0;

    let total = 0;

    for (const participant of item.participants) {
      total += calculateParticipantTotal(pricing, participant);
    }

    return total;
  };

  return {
    fetchPricing,
    getExtraPriceByName,
    formatPrice,
    calculateParticipantTotal,
    calculateItemTotal,
    cache,
  };
};
