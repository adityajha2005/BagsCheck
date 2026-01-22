/**
 * Validates a Solana token mint address
 * Must be Base58 string, 32-44 characters
 */
export function isValidTokenMint(mint: string): boolean {
  if (!mint || typeof mint !== "string") return false;

  // Check length
  const trimmed = mint.trim();
  if (trimmed.length < 32 || trimmed.length > 44) return false;

  // Check Base58 charset (no 0, O, I, l)
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
  return base58Regex.test(trimmed);
}
