/**
 * Bags.fm API Client
 * Minimal, typed functions for each endpoint
 */

const BAGS_API_BASE = "https://public-api-v2.bags.fm/api/v1";

// API Response Types based on Bags API documentation

interface BagsAPISuccessResponse<T> {
  success: true;
  response: T;
}

interface BagsAPIErrorResponse {
  success: false;
  error: string;
}

type BagsAPIResponse<T> = BagsAPISuccessResponse<T> | BagsAPIErrorResponse;

interface ClaimStat {
  username?: string; // Bags internal username, may be absent
  pfp?: string; // Profile picture URL, when available
  royaltyBps: number;
  isCreator: boolean;
  wallet: string;
  totalClaimed: string; // lamports as string
  provider?:
    | "apple"
    | "google"
    | "email"
    | "solana"
    | "twitter"
    | "tiktok"
    | "kick"
    | "instagram"
    | "onlyfans"
    | "github"; // May be unknown or null
  providerUsername?: string | null; // Provider username, when available
}

interface ClaimEvent {
  wallet: string;
  isCreator: boolean;
  amount: string; // lamports as string
  signature: string;
  timestamp: string | number; // Can be ISO 8601 string OR Unix timestamp in seconds
}

interface ClaimEventsResponse {
  events: ClaimEvent[];
}

interface Creator {
  username?: string; // Bags internal username, may be absent
  pfp?: string; // Profile picture URL, when available
  royaltyBps: number;
  isCreator: boolean;
  wallet: string;
  provider?:
    | "apple"
    | "google"
    | "email"
    | "solana"
    | "twitter"
    | "tiktok"
    | "kick"
    | "instagram"
    | "onlyfans"
    | "github"; // May be unknown or null
  providerUsername?: string | null; // Provider username, when available
}

// Helper to make authenticated requests
async function bagsRequest<T>(
  endpoint: string,
  params: Record<string, string>
): Promise<T> {
  const apiKey = process.env.BAGS_API_KEY;
  if (!apiKey) {
    throw new Error("BAGS_API_KEY not configured");
  }

  const url = new URL(`${BAGS_API_BASE}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  // Add timeout (30 seconds)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        "x-api-key": apiKey,
      },
      cache: "no-store", // No caching for v1
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data: BagsAPIResponse<T> = await response.json();

    if (!data.success) {
      // Extract error message from API response
      const errorMessage = data.error || "Unknown API error";
      throw new Error(`Bags API error (${response.status}): ${errorMessage}`);
    }

    return data.response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timeout: The API took too long to respond. Please try again.");
    }
    throw error;
  }
}

// API Functions

export async function getLifetimeFees(tokenMint: string): Promise<string> {
  return bagsRequest<string>("/token-launch/lifetime-fees", { tokenMint });
}

export async function getClaimStats(tokenMint: string): Promise<ClaimStat[]> {
  return bagsRequest<ClaimStat[]>("/token-launch/claim-stats", { tokenMint });
}

export async function getClaimEvents(
  tokenMint: string,
  limit?: number
): Promise<ClaimEventsResponse> {
  const params: Record<string, string> = { tokenMint };
  if (limit) params.limit = limit.toString();

  return bagsRequest<ClaimEventsResponse>("/fee-share/token/claim-events", params);
}

// Get claim events using time-based filtering (for accurate 24h counts)
export async function getClaimEventsTimeRange(
  tokenMint: string,
  fromUnixSeconds: number,
  toUnixSeconds: number
): Promise<ClaimEventsResponse> {
  const params: Record<string, string> = {
    tokenMint,
    mode: "time",
    from: fromUnixSeconds.toString(),
    to: toUnixSeconds.toString(),
  };

  return bagsRequest<ClaimEventsResponse>("/fee-share/token/claim-events", params);
}

export async function getCreators(tokenMint: string): Promise<Creator[]> {
  return bagsRequest<Creator[]>("/token-launch/creator/v3", { tokenMint });
}

// Parallel fetch all data
export async function fetchAllTokenData(tokenMint: string) {
  // Calculate time range for last 24 hours (API uses Unix seconds, not milliseconds)
  const nowUnixSeconds = Math.floor(Date.now() / 1000);
  const oneDayAgoUnixSeconds = nowUnixSeconds - (24 * 60 * 60);

  const [lifetimeFees, claimStats, claimEvents24h, claimEventsRecent, creators] = await Promise.all([
    getLifetimeFees(tokenMint),
    getClaimStats(tokenMint),
    getClaimEventsTimeRange(tokenMint, oneDayAgoUnixSeconds, nowUnixSeconds), // Last 24h for activity
    getClaimEvents(tokenMint, 100), // Last 100 events for last claim timestamp
    getCreators(tokenMint),
  ]);

  return {
    lifetimeFees,
    claimStats,
    // Merge both event lists (24h for count, recent for last timestamp)
    claimEvents: {
      events: claimEvents24h.events, // Use 24h events for accurate count
    },
    claimEventsRecent: claimEventsRecent, // Keep recent events for last claim timestamp
    creators,
  };
}
