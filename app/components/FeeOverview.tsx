interface FeeOverviewProps {
  lifetimeFees: number;
  percentClaimed: number;
  percentUnclaimed: number;
}

export function FeeOverview({
  lifetimeFees,
  percentClaimed,
  percentUnclaimed,
}: FeeOverviewProps) {
  return (
    <div className="bg-bags-bg-card border border-bags-border p-6">
      <div className="grid grid-cols-3 gap-6">
        {/* Lifetime Fees */}
        <div className="space-y-1 text-center">
          <div className="text-2xl font-bold text-white font-mono">
            {lifetimeFees.toLocaleString()} SOL
          </div>
          <div className="text-sm text-bags-text-muted">Lifetime fees</div>
        </div>

        {/* % Claimed */}
        <div className="space-y-1 text-center">
          <div className="text-2xl font-semibold text-bags-green font-mono">
            {percentClaimed.toFixed(1)}%
          </div>
          <div className="text-sm text-bags-text-muted">Claimed</div>
        </div>

        {/* % Unclaimed */}
        <div className="space-y-1 text-center">
          <div className="text-2xl font-semibold text-bags-text-secondary font-mono">
            {percentUnclaimed.toFixed(1)}%
          </div>
          <div className="text-sm text-bags-text-muted">Unclaimed</div>
        </div>
      </div>
    </div>
  );
}
