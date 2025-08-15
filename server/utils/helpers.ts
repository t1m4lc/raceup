/**
 * Helper functions for server-side code
 */

/**
 * Calculates the platform fee for a transaction
 * Uses a percentage-based approach with a minimum fee
 *
 * @param amount - The transaction amount in cents
 * @returns The platform fee in cents
 */
export function calculatePlatformFee(amount: number): number {
  // Set platform fee to 5% with a minimum of €0.50
  const feePercentage = 0.05;
  const minimumFee = 50; // 50 cents

  const calculatedFee = Math.round(amount * feePercentage);
  return Math.max(calculatedFee, minimumFee);
}

/**
 * Validates if a user has a specific role
 *
 * @param userRoles - Array of user roles
 * @param requiredRole - Role to check for
 * @returns Boolean indicating if the user has the required role
 */
export function hasRole(userRoles: string[], requiredRole: string): boolean {
  return userRoles.includes(requiredRole);
}

/**
 * Formats a price from cents to a decimal with currency symbol
 *
 * @param priceCents - Price in cents
 * @param currency - Currency code (default: EUR)
 * @returns Formatted price string
 */
export function formatPrice(
  priceCents: number,
  currency: string = "EUR"
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(priceCents / 100);
}

/**
 * Formats a date string into a readable format
 *
 * @param date - The date string to format
 * @param format - The format pattern (default: 'MMM D, YYYY')
 * @returns Formatted date string
 */
export function formatDate(
  date: string,
  format: string = "MMM D, YYYY"
): string {
  const dayjs = require("dayjs");
  return dayjs(date).format(format);
}
