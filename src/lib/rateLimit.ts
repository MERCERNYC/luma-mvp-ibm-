/**
 * src/lib/rateLimit.ts
 * ─────────────────────
 * In-memory sliding-window rate limiter for server-side Next.js Route Handlers.
 *
 * IMPORTANT LIMITATION
 * ─────────────────────
 * This limiter stores counters in process memory.  On Vercel and other
 * serverless platforms, multiple concurrent function instances each
 * maintain separate counters.  The effective limit per user is therefore
 * limit × number_of_active_instances — not a hard global cap.
 *
 * This is best-effort protection suitable for a development / MVP environment.
 * For reliable production-wide rate limiting, use a shared store such as
 * Upstash Redis with @upstash/ratelimit.
 *
 * Usage
 * ─────
 *   const limiter = new RateLimiter({ windowMs: 60_000, max: 20 });
 *
 *   export async function POST(req: Request) {
 *     const ip = req.headers.get("x-forwarded-for") ?? "unknown";
 *     if (!limiter.check(ip)) {
 *       return NextResponse.json({ error: "Too many requests." }, { status: 429 });
 *     }
 *     // ... handle request
 *   }
 */

export interface RateLimiterOptions {
  /** Rolling window in milliseconds. */
  windowMs: number;
  /** Maximum requests allowed within the window per key. */
  max: number;
}

export class RateLimiter {
  private readonly windowMs: number;
  private readonly max:      number;
  /** key → array of request timestamps within the current window */
  private readonly store:    Map<string, number[]> = new Map();

  constructor({ windowMs, max }: RateLimiterOptions) {
    this.windowMs = windowMs;
    this.max      = max;
  }

  /**
   * Returns true if the request is allowed, false if the limit is exceeded.
   * Automatically prunes stale entries to prevent unbounded memory growth.
   */
  check(key: string): boolean {
    const now    = Date.now();
    const cutoff = now - this.windowMs;

    const hits = (this.store.get(key) ?? []).filter((t) => t > cutoff);
    hits.push(now);
    this.store.set(key, hits);

    return hits.length <= this.max;
  }

  /** Remove all entries for a key (e.g. after a successful auth). */
  reset(key: string): void {
    this.store.delete(key);
  }
}

// ── Pre-configured limiters ──────────────────────────────────────

/**
 * AI routes (classify, daily-brief, compose-reply):
 * max 30 requests per minute per IP.
 * These routes consume paid watsonx quota.
 */
export const aiRouteLimiter = new RateLimiter({ windowMs: 60_000, max: 30 });

/**
 * Gmail auth routes (OAuth initiation):
 * max 10 requests per minute per IP.
 * Prevents automated token-request floods.
 */
export const authRouteLimiter = new RateLimiter({ windowMs: 60_000, max: 10 });
