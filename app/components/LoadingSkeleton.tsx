"use client";

export function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Verdict Card Skeleton */}
      <div className="bg-bags-bg-card border border-bags-border p-8 rounded-2xl space-y-4">
        <div className="h-8 bg-bags-bg-secondary rounded w-1/4"></div>
        <div className="h-4 bg-bags-bg-secondary rounded w-1/3"></div>
        <div className="h-4 bg-bags-bg-secondary rounded w-full"></div>
        <div className="h-4 bg-bags-bg-secondary rounded w-2/3"></div>
      </div>

      {/* Fee Overview Skeleton */}
      <div className="bg-bags-bg-card border border-bags-border p-6 space-y-4">
        <div className="h-6 bg-bags-bg-secondary rounded w-1/4"></div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="h-8 bg-bags-bg-secondary rounded w-3/4"></div>
            <div className="h-4 bg-bags-bg-secondary rounded w-1/2"></div>
          </div>
          <div className="space-y-2">
            <div className="h-8 bg-bags-bg-secondary rounded w-3/4"></div>
            <div className="h-4 bg-bags-bg-secondary rounded w-1/2"></div>
          </div>
          <div className="space-y-2">
            <div className="h-8 bg-bags-bg-secondary rounded w-3/4"></div>
            <div className="h-4 bg-bags-bg-secondary rounded w-1/2"></div>
          </div>
        </div>
      </div>

      {/* Distribution Breakdown Skeleton */}
      <div className="bg-bags-bg-card border border-bags-border p-6 space-y-4">
        <div className="h-6 bg-bags-bg-secondary rounded w-1/3"></div>
        <div className="space-y-3">
          <div className="h-4 bg-bags-bg-secondary rounded w-full"></div>
          <div className="h-4 bg-bags-bg-secondary rounded w-5/6"></div>
          <div className="h-4 bg-bags-bg-secondary rounded w-4/6"></div>
        </div>
      </div>

      {/* Claimers Breakdown Skeleton */}
      <div className="bg-bags-bg-card border border-bags-border p-6 space-y-4">
        <div className="h-6 bg-bags-bg-secondary rounded w-1/4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-bags-bg-panel border border-bags-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-bags-bg-secondary rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-bags-bg-secondary rounded w-24"></div>
                  <div className="h-3 bg-bags-bg-secondary rounded w-32"></div>
                </div>
              </div>
              <div className="h-6 bg-bags-bg-secondary rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Claim Activity Skeleton */}
      <div className="bg-bags-bg-card border border-bags-border p-6 space-y-4">
        <div className="h-6 bg-bags-bg-secondary rounded w-1/3"></div>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center space-y-2">
            <div className="h-8 bg-bags-bg-secondary rounded w-16 mx-auto"></div>
            <div className="h-3 bg-bags-bg-secondary rounded w-12 mx-auto"></div>
          </div>
          <div className="text-center space-y-2">
            <div className="h-8 bg-bags-bg-secondary rounded w-8 mx-auto"></div>
            <div className="h-3 bg-bags-bg-secondary rounded w-16 mx-auto"></div>
          </div>
          <div className="text-center space-y-2">
            <div className="h-8 bg-bags-bg-secondary rounded w-8 mx-auto"></div>
            <div className="h-3 bg-bags-bg-secondary rounded w-20 mx-auto"></div>
          </div>
        </div>
        <div className="h-4 bg-bags-bg-secondary rounded w-1/3 mx-auto"></div>
      </div>
    </div>
  );
}
