// Simple in-memory rate limiter (best-effort, not persistent). Suitable for demo.
const buckets = new Map();

export function rateLimit({ key, limit = 20, windowMs = 60_000 }) {
  const now = Date.now();
  const bucket = buckets.get(key) || { count: 0, start: now };
  if (now - bucket.start > windowMs) {
    bucket.count = 0;
    bucket.start = now;
  }
  bucket.count += 1;
  buckets.set(key, bucket);
  const remaining = Math.max(0, limit - bucket.count);
  const resetIn = windowMs - (now - bucket.start);
  const limited = bucket.count > limit;
  return { limited, remaining, resetIn };
}
