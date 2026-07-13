// Lightweight anti-replay mitigation for QR payloads that are shown briefly
// per-interaction (consumer's own QR, redemption QR). This is NOT cryptographic
// signing — there's no secret involved, so a forged payload with a fake future
// `exp` would still pass. What this does stop: an old screenshot or exported
// QR image being scanned long after it was captured. Real forgery prevention
// would need a server-side secret (a Supabase Edge Function), which this app
// doesn't have yet — see BRIEF2.md.
export const QR_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

export function withExpiry<T extends object>(payload: T): T & { exp: number } {
  return { ...payload, exp: Date.now() + QR_EXPIRY_MS };
}

export function isExpired(payload: { exp?: number }): boolean {
  return typeof payload.exp !== 'number' || Date.now() > payload.exp;
}
