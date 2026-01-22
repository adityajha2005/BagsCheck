/**
 * Data normalization and verdict logic
 * Converts raw Bags API responses into component-ready data
 */

// Constants
const LAMPORTS_PER_SOL = 1_000_000_000;
const DORMANT_FEE_THRESHOLD_SOL = 0.1; // Less than 0.1 SOL = dormant
const CENTRALIZED_TOP1_THRESHOLD = 50; // Top 1 claimer > 50%
const CENTRALIZED_TOP5_THRESHOLD = 80; // Top 5 claimers > 80%

// Types

export type Verdict = "HEALTHY" | "CENTRALIZED" | "DORMANT";

export type Pattern = 
  | "Single-extractor"
  | "Creator-heavy"
  | "Broad distribution"
  | "Abandoned fees"
  | "Multi-claimer balance";

export interface ClaimerInfo {
  username?: string; // Bags internal username, may be absent
  pfp?: string; // Profile picture URL, when available
  royaltyBps: number;
  isCreator: boolean;
  wallet: string;
  totalClaimed: string;
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

export interface TokenAnalysis {
  // Fee metrics
  lifetimeFeesSOL: number;
  claimedPct: number;
  unclaimedPct: number;

  // Distribution
  creatorSharePct: number;
  nonCreatorSharePct: number;
  top1ClaimerPct: number;
  top5ClaimerPct: number;

  // Activity
  claimCount24h: number;
  totalClaimers: number;
  lastClaimTimestamp?: string; // ISO 8601 string from API
  activityStatus: "Active" | "Quiet" | "Dead";

  // Claimers detail
  claimers: ClaimerInfo[];

  // Verdict
  verdict: Verdict;
  summary: string;
  why: string; // Micro-explanation for verdict
  pattern: Pattern; // Distribution pattern label
}

// Helpers

function lamportsToSOL(lamports: string): number {
  return parseInt(lamports, 10) / LAMPORTS_PER_SOL;
}

function getClaimCount24h(events: Array<{ timestamp: string | number }>): number {
  if (!events || events.length === 0) return 0;
  
  // Events are already filtered by the API using time mode
  // Just validate and count them
  const MIN_VALID_TIMESTAMP = new Date("2020-01-01").getTime();

  return events.filter((event) => {
    if (!event.timestamp) return false;
    
    // Handle both Unix timestamp (number in seconds) and ISO 8601 string
    let timestampMs: number;
    if (typeof event.timestamp === "number") {
      // Unix timestamp in seconds, convert to milliseconds
      timestampMs = event.timestamp * 1000;
    } else {
      // ISO 8601 string
      timestampMs = new Date(event.timestamp).getTime();
    }
    
    // Validate timestamp
    if (isNaN(timestampMs) || timestampMs <= 0) return false;
    if (timestampMs < MIN_VALID_TIMESTAMP) return false;
    
    return true;
  }).length;
}

function getLastClaimTimestamp(events: Array<{ timestamp: string | number }>): string | undefined {
  if (!events || events.length === 0) return undefined;

  // Events are typically sorted newest first
  // Return the first valid timestamp (convert to ISO 8601 string if needed)
  for (const event of events) {
    if (!event.timestamp) {
      continue;
    }
    
    // Handle both Unix timestamp (number in seconds) and ISO 8601 string
    let timestampMs: number;
    let isoString: string;
    
    if (typeof event.timestamp === "number") {
      // Unix timestamp in seconds, convert to milliseconds
      timestampMs = event.timestamp * 1000;
      isoString = new Date(timestampMs).toISOString();
    } else if (typeof event.timestamp === "string") {
      if (event.timestamp.trim() === "") continue;
      const dateObj = new Date(event.timestamp);
      timestampMs = dateObj.getTime();
      isoString = event.timestamp; // Already ISO string
    } else {
      continue;
    }
    
    // Check if parsing was successful and within valid range
    if (isNaN(timestampMs) || timestampMs <= 0) {
      continue;
    }
    
    const MIN_VALID_TIMESTAMP = new Date("2020-01-01").getTime();
    const MAX_VALID_TIMESTAMP = Date.now() + 86400000;
    
    if (timestampMs > MIN_VALID_TIMESTAMP && timestampMs < MAX_VALID_TIMESTAMP) {
      return isoString; // Return ISO 8601 string format
    }
  }
  
  return undefined;
}

function getActivityStatus(
  claimCount24h: number,
  lastClaimTimestamp?: string
): "Active" | "Quiet" | "Dead" {
  if (!lastClaimTimestamp) return "Dead";

  const timestamp = new Date(lastClaimTimestamp).getTime();
  if (isNaN(timestamp)) return "Dead";

  const hoursSinceLastClaim = (Date.now() - timestamp) / (1000 * 60 * 60);

  if (claimCount24h >= 5) return "Active";
  if (claimCount24h >= 1 || hoursSinceLastClaim < 48) return "Quiet";
  return "Dead";
}

function calculateVerdict(
  lifetimeFeesSOL: number,
  top1ClaimerPct: number,
  top5ClaimerPct: number,
  claimStats: any[]
): { verdict: Verdict; summary: string; why: string } {
  // DORMANT: No meaningful fees or no claimers
  if (lifetimeFeesSOL < DORMANT_FEE_THRESHOLD_SOL || claimStats.length === 0) {
    return {
      verdict: "DORMANT",
      summary: "Minimal fee activity. Token has not generated meaningful revenue.",
      why: lifetimeFeesSOL < DORMANT_FEE_THRESHOLD_SOL
        ? `Lifetime fees (${lifetimeFeesSOL.toFixed(2)} SOL) below threshold`
        : "No claimers found",
    };
  }

  // CENTRALIZED: Top wallets dominate
  if (top1ClaimerPct > CENTRALIZED_TOP1_THRESHOLD) {
    return {
      verdict: "CENTRALIZED",
      summary: `Single wallet controls ${top1ClaimerPct.toFixed(1)}% of claimed fees. Highly concentrated distribution.`,
      why: `Top 1 wallet controls ${top1ClaimerPct.toFixed(1)}% of claimed fees`,
    };
  }

  if (top5ClaimerPct > CENTRALIZED_TOP5_THRESHOLD) {
    return {
      verdict: "CENTRALIZED",
      summary: `Top 5 wallets control ${top5ClaimerPct.toFixed(1)}% of claimed fees. Distribution is heavily concentrated.`,
      why: `Top 5 wallets control ${top5ClaimerPct.toFixed(1)}% of claimed fees`,
    };
  }

  // HEALTHY: Well distributed
  return {
    verdict: "HEALTHY",
    summary: "Fees are well distributed across multiple claimers. No single wallet dominates.",
    why: `Top 1 wallet: ${top1ClaimerPct.toFixed(1)}%, Top 5: ${top5ClaimerPct.toFixed(1)}%`,
  };
}

function determinePattern(
  verdict: Verdict,
  creatorSharePct: number,
  top1ClaimerPct: number,
  totalClaimers: number,
  claimedPct: number,
  claimers: ClaimerInfo[]
): Pattern {
  // Abandoned fees: High unclaimed percentage
  if (claimedPct < 30 && totalClaimers > 0) {
    return "Abandoned fees";
  }

  // Single-extractor: One wallet dominates (>70%)
  if (top1ClaimerPct > 70) {
    return "Single-extractor";
  }

  // Creator-heavy: Creator takes majority (>60%)
  if (creatorSharePct > 60) {
    return "Creator-heavy";
  }

  // Broad distribution: Many claimers with relatively balanced distribution
  if (totalClaimers >= 5 && top1ClaimerPct < 40) {
    return "Broad distribution";
  }

  // Multi-claimer balance: Multiple claimers with no single dominant party
  if (totalClaimers >= 2 && top1ClaimerPct < 60) {
    return "Multi-claimer balance";
  }

  // Default based on verdict
  if (verdict === "DORMANT") {
    return "Abandoned fees";
  }

  return "Creator-heavy";
}

// Main analysis function

export function analyzeToken(rawData: {
  lifetimeFees: string;
  claimStats: ClaimerInfo[];
  claimEvents: {
    events: Array<{ timestamp: string }>;
  };
  claimEventsRecent: {
    events: Array<{ timestamp: string }>;
  };
  creators: ClaimerInfo[];
}): TokenAnalysis {
  // Merge creators (full config) with claimStats (actual claims)
  // Use creators as the base to ensure we show ALL configured claimers
  // Filter out creators with 0 royaltyBps (they're not actually fee claimers)
  const claimStatsMap = new Map(
    rawData.claimStats.map(stat => [stat.wallet, stat])
  );

  const allClaimers: ClaimerInfo[] = rawData.creators
    .filter(creator => creator.royaltyBps > 0) // Only show claimers who actually earn fees
    .map(creator => {
      const claimData = claimStatsMap.get(creator.wallet);
      // If this claimer has claim data, use it; otherwise set totalClaimed to "0"
      return {
        ...creator,
        totalClaimed: claimData?.totalClaimed || "0"
      };
    });

  // Convert lifetime fees
  const lifetimeFeesSOL = lamportsToSOL(rawData.lifetimeFees);

  // Calculate total claimed
  const totalClaimedLamports = allClaimers.reduce(
    (sum, stat) => sum + parseInt(stat.totalClaimed, 10),
    0
  );

  const totalClaimedSOL = totalClaimedLamports / LAMPORTS_PER_SOL;

  // Calculate claimed/unclaimed percentages
  const claimedPct = lifetimeFeesSOL > 0 ? (totalClaimedSOL / lifetimeFeesSOL) * 100 : 0;
  const unclaimedPct = 100 - claimedPct;

  // Calculate creator vs non-creator share based on royalty configuration
  const totalRoyaltyBps = allClaimers.reduce((sum, stat) => sum + stat.royaltyBps, 0);
  
  const creatorRoyaltyBps = allClaimers
    .filter((stat) => stat.isCreator)
    .reduce((sum, stat) => sum + stat.royaltyBps, 0);

  const creatorSharePct = totalRoyaltyBps > 0 ? (creatorRoyaltyBps / totalRoyaltyBps) * 100 : 0;
  const nonCreatorSharePct = 100 - creatorSharePct;

  // Calculate distribution based on royalty configuration (royaltyBps), not actual claims
  // This shows the INTENDED distribution, not who has claimed so far
  // Sort claimers by royalty percentage (descending)
  const sortedByRoyalty = [...allClaimers].sort((a, b) => b.royaltyBps - a.royaltyBps);

  // Calculate top 1 and top 5 percentages based on configured royalties
  const top1ClaimerPct =
    totalRoyaltyBps > 0 && sortedByRoyalty.length > 0
      ? (sortedByRoyalty[0].royaltyBps / totalRoyaltyBps) * 100
      : 0;

  const top5RoyaltyBps = sortedByRoyalty
    .slice(0, 5)
    .reduce((sum, stat) => sum + stat.royaltyBps, 0);

  const top5ClaimerPct = totalRoyaltyBps > 0 ? (top5RoyaltyBps / totalRoyaltyBps) * 100 : 0;

  // Activity metrics
  // Use 24h events for count, recent events for last timestamp
  const claimCount24h = getClaimCount24h(rawData.claimEvents.events);
  const lastClaimTimestamp = getLastClaimTimestamp(rawData.claimEventsRecent.events);
  const totalClaimers = allClaimers.length;
  const activityStatus = getActivityStatus(claimCount24h, lastClaimTimestamp);

  // Verdict
  const { verdict, summary, why } = calculateVerdict(
    lifetimeFeesSOL,
    top1ClaimerPct,
    top5ClaimerPct,
    allClaimers
  );

  // Pattern
  const pattern = determinePattern(
    verdict,
    creatorSharePct,
    top1ClaimerPct,
    totalClaimers,
    claimedPct,
    allClaimers
  );

  return {
    lifetimeFeesSOL,
    claimedPct,
    unclaimedPct,
    creatorSharePct,
    nonCreatorSharePct,
    top1ClaimerPct,
    top5ClaimerPct,
    claimCount24h,
    totalClaimers,
    lastClaimTimestamp,
    activityStatus,
    claimers: allClaimers,
    verdict,
    summary,
    why,
    pattern,
  };
}
