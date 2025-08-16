// composables/useCommission.ts

/**
 * Client-side utility to estimate commission fees
 * This is a simpler version of the server-side calculateCommission function
 * It's used for immediate UI feedback before server validation
 */
export function useCommission() {
  // Calculate commission fees based on amount and fee structure
  const calculateFees = (
    amountCents: number,
    config: {
      fixedFeeCents?: number;
      variablePercent?: number;
      feeAllocation?: "participant" | "organizer" | "split";
    } = {}
  ) => {
    // Default values if not provided
    const fixedFeeCents = config.fixedFeeCents ?? 100; // 1 EUR default
    const variablePercent = config.variablePercent ?? 3.5; // 3.5% default
    const feeAllocation = config.feeAllocation ?? "participant";

    // Calculate fees
    const variableFeeCents = Math.floor(amountCents * (variablePercent / 100));
    const totalFeeCents = fixedFeeCents + variableFeeCents;

    // Calculate final amount based on fee allocation
    let finalAmountCents = amountCents;

    if (feeAllocation === "participant") {
      finalAmountCents = amountCents + totalFeeCents;
    } else if (feeAllocation === "split") {
      finalAmountCents = amountCents + Math.floor(totalFeeCents / 2);
    }
    // If organizer pays fee, final amount is unchanged

    return {
      fixedFeeCents,
      variableFeeCents,
      totalFeeCents,
      feeAllocation,
      finalAmountCents,
      subtotalCents: amountCents,
    };
  };

  // Format currency amounts
  const formatCurrency = (amountCents: number, currency: string = "EUR") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amountCents / 100);
  };

  return {
    calculateFees,
    formatCurrency,
  };
}
