// ── Token count formatting ────────────────────────────────────────────────────
// Display helper for the summary panel — the library handles all cost formatting.

export function fmtTokens(n: number | undefined): string {
  if (!n) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}
