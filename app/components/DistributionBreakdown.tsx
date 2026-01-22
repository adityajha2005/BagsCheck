interface DistributionBreakdownProps {
  creatorShare: number;
  nonCreatorShare: number;
  top1Claimer: number;
  top5Claimers: number;
}

export function DistributionBreakdown({
  creatorShare,
  nonCreatorShare,
  top1Claimer,
  top5Claimers,
}: DistributionBreakdownProps) {
  return (
    <div className="bg-bags-bg-card border border-bags-border p-6">
      <h3 className="text-lg font-medium text-white mb-6">Distribution</h3>
      
      <div className="space-y-4">
        {/* Creator Share */}
        <div className="flex items-center justify-between py-3 border-b border-bags-border">
          <span className="text-bags-text-secondary">Creator share</span>
          <span className="text-xl font-semibold text-white font-mono">
            {creatorShare.toFixed(1)}%
          </span>
        </div>

        {/* Non-Creator Share */}
        <div className="flex items-center justify-between py-3 border-b border-bags-border">
          <span className="text-bags-text-secondary">Non-creator share</span>
          <span className="text-xl font-semibold text-white font-mono">
            {nonCreatorShare.toFixed(1)}%
          </span>
        </div>

        {/* Top 1 Claimer */}
        <div className="flex items-center justify-between py-3 border-b border-bags-border">
          <span className="text-bags-text-secondary">Top 1 claimer</span>
          <span
            className={`text-xl font-semibold font-mono ${
              top1Claimer > 50 ? "text-yellow-400" : "text-bags-green"
            }`}
          >
            {top1Claimer.toFixed(1)}%
          </span>
        </div>

        {/* Top 5 Claimers */}
        <div className="flex items-center justify-between py-3">
          <span className="text-bags-text-secondary">Top 5 claimers</span>
          <span
            className={`text-xl font-semibold font-mono ${
              top5Claimers > 80 ? "text-yellow-400" : "text-bags-green"
            }`}
          >
            {top5Claimers.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}
