const store = new Map<string, { count: number; resetAt: number }>();

const TIER_LIMITS: Record<string, number> = {
  free: 20,
  pro: 100,
  enterprise: 500,
};

export function checkRateLimit(key: string, tier: string = "free"): { allowed: boolean; remaining: number; resetAt: number } {
  const limit = TIER_LIMITS[tier] || TIER_LIMITS.free;
  const now = Date.now();
  const windowMs = 60_000;

  const entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  entry.count += 1;
  if (entry.count > limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 60_000);
