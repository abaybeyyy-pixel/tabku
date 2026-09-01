// Robust in-memory rate limiter with Bruteforce Protection
// Supports IP and identifier (Card ID / Account) dual-tracking

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) {
        store.delete(key);
      }
    }
  }, 60000);
}

export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes default
): { allowed: boolean; remaining: number; resetInMs: number; resetMinutes: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    return {
      allowed: true,
      remaining: maxAttempts,
      resetInMs: 0,
      resetMinutes: Math.ceil(windowMs / 60000),
    };
  }

  if (entry.count >= maxAttempts) {
    const resetInMs = entry.resetAt - now;
    return {
      allowed: false,
      remaining: 0,
      resetInMs,
      resetMinutes: Math.max(1, Math.ceil(resetInMs / 60000)),
    };
  }

  return {
    allowed: true,
    remaining: Math.max(0, maxAttempts - entry.count),
    resetInMs: entry.resetAt - now,
    resetMinutes: Math.ceil((entry.resetAt - now) / 60000),
  };
}

export function recordFailedAttempt(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000
): { remaining: number; resetMinutes: number; isLockedOut: boolean } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return {
      remaining: maxAttempts - 1,
      resetMinutes: Math.ceil(windowMs / 60000),
      isLockedOut: maxAttempts <= 1,
    };
  }

  entry.count += 1;
  const resetInMs = entry.resetAt - now;
  const remaining = Math.max(0, maxAttempts - entry.count);

  return {
    remaining,
    resetMinutes: Math.max(1, Math.ceil(resetInMs / 60000)),
    isLockedOut: entry.count >= maxAttempts,
  };
}

export function clearRateLimit(key: string): void {
  store.delete(key);
}

export function getRateLimitKey(identifier: string, action: string): string {
  return `${action}:${identifier.toLowerCase().trim()}`;
}
