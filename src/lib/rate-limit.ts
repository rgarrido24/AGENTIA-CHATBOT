/**
 * In-memory sliding window rate limiter.
 * Works per-process. For multi-instance deployments, pair with Redis/Upstash.
 */

type Entry = { hits: number; resetAt: number };

const store = new Map<string, Entry>();

function prune() {
  const now = Date.now();
  if (store.size > 5000) {
    for (const [key, val] of store.entries()) {
      if (val.resetAt < now) store.delete(key);
    }
  }
}

/**
 * Returns true if the request is allowed.
 * @param key     Unique key (e.g. "ip:route:127.0.0.1")
 * @param limit   Maximum hits allowed in the window
 * @param windowMs  Window duration in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  prune();
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || entry.resetAt < now) {
    store.set(key, { hits: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.hits >= limit) return false;
  entry.hits++;
  return true;
}

/** Extract the client IP from Next.js request headers. */
export function getClientIP(headers: Headers | { get(key: string): string | null }): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headers.get('x-real-ip') ??
    '127.0.0.1'
  );
}

/** Brute-force tracker: tracks failed login attempts per key. */
const failStore = new Map<string, { count: number; lockedUntil: number }>();

export function recordFailedLogin(key: string): { locked: boolean; attemptsLeft: number } {
  const now = Date.now();
  const entry = failStore.get(key) ?? { count: 0, lockedUntil: 0 };

  if (entry.lockedUntil > now) return { locked: true, attemptsLeft: 0 };

  entry.count++;
  if (entry.count >= 5) {
    entry.lockedUntil = now + 15 * 60 * 1000; // 15 min lockout
    entry.count = 0;
    failStore.set(key, entry);
    return { locked: true, attemptsLeft: 0 };
  }
  failStore.set(key, entry);
  return { locked: false, attemptsLeft: 5 - entry.count };
}

export function isLoginLocked(key: string): boolean {
  const entry = failStore.get(key);
  if (!entry) return false;
  return entry.lockedUntil > Date.now();
}

export function clearLoginAttempts(key: string): void {
  failStore.delete(key);
}
