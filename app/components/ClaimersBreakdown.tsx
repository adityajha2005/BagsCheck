interface Claimer {
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

interface ClaimersBreakdownProps {
  claimers: Claimer[];
  lifetimeFeesSOL: number;
}

const LAMPORTS_PER_SOL = 1_000_000_000;

function lamportsToSOL(lamports: string): number {
  return parseInt(lamports, 10) / LAMPORTS_PER_SOL;
}

export function ClaimersBreakdown({ claimers, lifetimeFeesSOL }: ClaimersBreakdownProps) {
  // Handle empty or undefined claimers
  if (!claimers || claimers.length === 0) {
    return (
      <div className="bg-bags-bg-card border border-bags-border p-6">
        <h3 className="text-lg font-medium text-white mb-6">Claimers</h3>
        <p className="text-center text-bags-text-secondary py-8">No claimers found</p>
      </div>
    );
  }

  // Calculate total royalty basis points
  const totalRoyaltyBps = claimers.reduce((sum, c) => sum + c.royaltyBps, 0);

  // Sort claimers by royalty percentage (descending)
  const sortedClaimers = [...claimers].sort((a, b) => b.royaltyBps - a.royaltyBps);

  return (
    <div className="bg-bags-bg-card border border-bags-border p-6">
      <h3 className="text-lg font-medium text-white mb-6">Claimers</h3>

      <div className="space-y-3">
        {sortedClaimers.map((claimer, idx) => {
          const royaltyPct = totalRoyaltyBps > 0 ? (claimer.royaltyBps / totalRoyaltyBps) * 100 : 0;
          const claimedSOL = lamportsToSOL(claimer.totalClaimed);
          const hasClaimed = claimedSOL > 0;

          // Get social link if available
          const socialLink =
            claimer.provider === "twitter" && claimer.providerUsername
              ? `https://twitter.com/${claimer.providerUsername}`
              : null;

          // Display name: prefer providerUsername, fallback to username, then wallet
          const displayName = claimer.providerUsername || claimer.username || 
                             `${claimer.wallet.slice(0, 4)}...${claimer.wallet.slice(-4)}`;

          return (
            <div
              key={idx}
              className="flex items-center justify-between p-4 bg-bags-bg-panel border border-bags-border hover:border-bags-border/60 transition-colors"
            >
              {/* Left: Profile info */}
              <div className="flex items-center gap-3">
                {/* Profile picture */}
                {claimer.pfp ? (
                  <img
                    src={claimer.pfp}
                    alt={displayName}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-bags-border" />
                )}

                {/* Name and role */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{displayName}</span>
                    {socialLink && (
                      <a
                        href={socialLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-bags-text-secondary hover:text-bags-green transition-colors text-xs"
                      >
                        𝕏
                      </a>
                    )}
                  </div>
                  <div className="text-xs text-bags-text-muted flex items-center gap-2">
                    <span>{claimer.isCreator ? "Creator" : "Royalty recipient"} • {royaltyPct.toFixed(1)}%</span>
                    {/* Creator Relationship Flag */}
                    <span className="text-bags-text-muted/50">•</span>
                    {claimer.isCreator ? (
                      <span className="text-bags-green/70" title="This is a creator wallet">
                        Creator wallet
                      </span>
                    ) : (
                      <span className="text-bags-text-muted/60" title="This claimer is not the token creator">
                        Not creator
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Claimed amount */}
              <div className="text-right">
                {hasClaimed ? (
                  <>
                    <div className="text-white font-semibold font-mono">
                      {claimedSOL.toFixed(2)} SOL
                    </div>
                    <div className="text-xs text-bags-green">Claimed</div>
                  </>
                ) : (
                  <>
                    <div className="text-bags-text-secondary font-semibold font-mono">
                      0.00 SOL
                    </div>
                    <div className="text-xs text-bags-text-muted">Not claimed</div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-bags-border text-sm text-bags-text-secondary text-center">
        {claimers.length} total claimer{claimers.length === 1 ? "" : "s"} •{" "}
        {claimers.filter((c) => lamportsToSOL(c.totalClaimed) > 0).length} claimed
      </div>
    </div>
  );
}
