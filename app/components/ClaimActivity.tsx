"use client";

interface ClaimActivityProps {
  claimCount24h: number;
  totalClaimers: number;
  lastClaimTimestamp?: string; // ISO 8601 string from API
  status: "Active" | "Quiet" | "Dead";
}

const statusConfig = {
  Active: {
    color: "text-bags-green",
    bgColor: "bg-bags-green/10",
    borderColor: "border-bags-green/30",
  },
  Quiet: {
    color: "text-yellow-400",
    bgColor: "bg-yellow-400/10",
    borderColor: "border-yellow-400/30",
  },
  Dead: {
    color: "text-bags-text-secondary",
    bgColor: "bg-bags-bg-panel",
    borderColor: "border-bags-border",
  },
};

function formatTimestamp(isoString?: string): { text: string; days: number | null } {
  if (!isoString) return { text: "No claims yet", days: null };

  try {
    const date = new Date(isoString);
    const timestamp = date.getTime();

    // Validate timestamp
    if (isNaN(timestamp) || timestamp <= 0) {
      return { text: "No claims yet", days: null };
    }

    // Check if after 2020-01-01
    const MIN_VALID_TIMESTAMP = new Date("2020-01-01").getTime();
    if (timestamp < MIN_VALID_TIMESTAMP) {
      return { text: "No claims yet", days: null };
    }

    const now = Date.now();
    const diff = now - timestamp;

    // Calculate time difference
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    // Always show relative time
    if (seconds < 60) return { text: "Just now", days: 0 };
    if (minutes < 60) return { text: `${minutes}m ago`, days: 0 };
    if (hours < 24) return { text: `${hours}h ago`, days: 0 };
    if (days < 7) return { text: `${days}d ago`, days };
    if (days < 30) return { text: `${weeks}w ago`, days };
    if (days < 365) return { text: `${days}d ago`, days };
    if (years < 2) return { text: `${months}mo ago`, days };
    return { text: `${days}d ago`, days };
  } catch {
    return { text: "No claims yet", days: null };
  }
}

function getRecencyHeatColor(days: number | null): string {
  if (days === null) return "text-bags-text-secondary";
  if (days === 0) return "text-bags-green";
  if (days <= 7) return "text-bags-green";
  if (days <= 30) return "text-yellow-400";
  if (days <= 90) return "text-yellow-500";
  if (days <= 180) return "text-orange-400";
  return "text-bags-text-secondary";
}

export function ClaimActivity({
  claimCount24h,
  totalClaimers,
  lastClaimTimestamp,
  status,
}: ClaimActivityProps) {
  const config = statusConfig[status];
  const { text: lastClaimText, days: lastClaimDays } = formatTimestamp(lastClaimTimestamp);
  const recencyColor = getRecencyHeatColor(lastClaimDays);

  return (
    <div className="bg-bags-bg-card border border-bags-border p-6">
      <h3 className="text-lg font-medium text-white mb-6">Claim Activity</h3>

      <div className="grid grid-cols-3 gap-6">
        {/* Status */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            {/* <div
              className={`inline-flex items-center gap-2 ${config.bgColor} border ${config.borderColor} px-3 py-1.5 rounded`}
            > */}
              <div className={`w-2 h-2 rounded-full ${config.color.replace("text-", "bg-")}`} />
              <span className={`text-xl font-bold ${config.color}`}>{status}</span>
            </div>
          {/* </div> */}
          <div className="text-xs text-bags-text-muted">Status</div>
        </div>

        {/* Claims 24h */}
        <div className="text-center space-y-1">
          <div className="text-2xl font-bold text-white font-mono">{claimCount24h}</div>
          <div className="text-xs text-bags-text-muted">Claims (24h)</div>
        </div>

        {/* Total Claimers */}
        <div className="text-center space-y-1">
          <div className="text-2xl font-bold text-white font-mono">{totalClaimers}</div>
          <div className="text-xs text-bags-text-muted">Total claimers</div>
        </div>
      </div>

      {/* Last Claim - Enhanced with recency heat */}
      <div className="mt-6 pt-4 border-t border-bags-border text-center">
        <div className="text-sm text-bags-text-secondary">
          Last claim:{" "}
          <span className={`font-medium ${recencyColor}`}>{lastClaimText}</span>
        </div>
      </div>
    </div>
  );
}
