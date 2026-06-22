import { NextResponse } from "next/server";
import {
  assertMinimumContributions,
  fetchContributions,
  MinimumContributionsError,
  padContributionGrid,
} from "@/lib/github-contributions";
import { GITHUB_USERNAME_PATTERN } from "@/lib/github-url";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;

const buckets = new Map<string, { count: number; resetAt: number }>();

function clientKey(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const forwardedClient = forwardedFor?.split(",")[0]?.trim();
  return (
    forwardedClient ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "local"
  );
}

function rateLimit(
  key: string,
): { allowed: true } | { allowed: false; retryAfter: number } {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  if (buckets.size > 1000) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
    }
  }

  return { allowed: true };
}

export async function GET(request: Request) {
  const limit = rateLimit(clientKey(request));
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${limit.retryAfter}s.` },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfter) },
      },
    );
  }

  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username")?.trim();

  if (!username || !GITHUB_USERNAME_PATTERN.test(username)) {
    return NextResponse.json(
      { error: "Valid GitHub username required" },
      { status: 400 },
    );
  }

  try {
    const grid = padContributionGrid(await fetchContributions(username));
    assertMinimumContributions(grid);
    return NextResponse.json({ username, weeks: grid });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch contributions";
    return NextResponse.json(
      { error: message },
      { status: error instanceof MinimumContributionsError ? 422 : 502 },
    );
  }
}
