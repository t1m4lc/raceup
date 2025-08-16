import { serverSupabaseClient } from "#supabase/server";
import { H3Event } from "h3";

/**
 * Commission calculator - Frontend utility to calculate commission fees
 * This function mirrors the backend calculation logic for consistency
 * and should be used to display fees to users before payment submission
 */
export async function calculateCommission(
  event: H3Event,
  organizationId: string,
  amountCents: number
): Promise<{
  fixedFeeCents: number;
  variableFeeCents: number;
  totalFeeCents: number;
  feeAllocation: "participant" | "organizer" | "split";
  finalAmountCents: number;
}> {
  // Default values (fallback)
  let fixedFeeCents = 100; // 1 EUR
  let variablePercent = 3.5; // 3.5%
  let feeAllocation: "participant" | "organizer" | "split" = "participant";

  // Try to get organization-specific commission config
  try {
    const client = await serverSupabaseClient(event);
    const { data, error } = await client
      .from("commission_configs")
      .select("fixed_amount_cents, variable_percent, fee_allocation")
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .single();

    if (!error && data) {
      const config = data as unknown as {
        fixed_amount_cents: number;
        variable_percent: number;
        fee_allocation: string;
      };
      fixedFeeCents = config.fixed_amount_cents;
      variablePercent = config.variable_percent;
      feeAllocation = config.fee_allocation as
        | "participant"
        | "organizer"
        | "split";
    }
  } catch (error) {
    console.error("Error fetching commission config:", error);
    // Use defaults on error
  }

  // Calculate fees
  const variableFeeCents = Math.floor(amountCents * (variablePercent / 100));
  const totalFeeCents = fixedFeeCents + variableFeeCents;

  // Calculate final amount based on fee allocation
  let finalAmountCents = amountCents;

  // If participant pays fee, add it to final amount
  if (feeAllocation === "participant") {
    finalAmountCents = amountCents + totalFeeCents;
  }
  // If split, add half to final amount
  else if (feeAllocation === "split") {
    finalAmountCents = amountCents + Math.floor(totalFeeCents / 2);
  }
  // If organizer pays fee, final amount is unchanged

  return {
    fixedFeeCents,
    variableFeeCents,
    totalFeeCents,
    feeAllocation,
    finalAmountCents,
  };
}
