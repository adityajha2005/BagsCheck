"use client";

import { useState } from "react";
import {
  Header,
  TokenInput,
  VerdictCard,
  FeeOverview,
  DistributionBreakdown,
  ClaimActivity,
  ClaimersBreakdown,
} from "./components";
import { isValidTokenMint } from "@/lib/validation";
import type { TokenAnalysis } from "@/lib/analyze";

export default function Home() {
  const [tokenMint, setTokenMint] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<TokenAnalysis | null>(null);

  const handleInputChange = (value: string) => {
    setTokenMint(value);
    // Clear validation error when user types
    if (validationError) setValidationError(null);
  };

  const handleSubmit = async (mint: string) => {
    // Validate token mint
    if (!isValidTokenMint(mint)) {
      setValidationError("Invalid Solana token mint");
      return;
    }

    setLoading(true);
    setError(null);
    setValidationError(null);
    setAnalysis(null);

    try {
      // Call server-side API route
      const response = await fetch("/api/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tokenMint: mint }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch token data");
      }

      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (err) {
      console.error("Failed to fetch token data:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch token data. Please try again."
      );
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      {/* Main Content */}
      <main className="pt-16 min-h-screen">
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Token Input - Always visible */}
          <div className="mb-12">
            <TokenInput
              value={tokenMint}
              onChange={handleInputChange}
              onSubmit={handleSubmit}
              loading={loading}
            />
            {/* Validation Error */}
            {validationError && (
              <p className="text-sm text-bags-accent-red mt-2 text-center">
                {validationError}
              </p>
            )}
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-8 p-6 bg-bags-accent-red/10 border border-bags-accent-red/30 text-bags-accent-red">
              {error}
            </div>
          )}

          {/* Results - Only show after successful fetch */}
          {analysis && !loading && (
            <div className="space-y-6">
              {/* Verdict Card */}
              <VerdictCard
                verdict={analysis.verdict}
                summary={analysis.summary}
                why={analysis.why}
                tokenMint={tokenMint}
                pattern={analysis.pattern}
              />

              {/* Fee Overview */}
              <FeeOverview
                lifetimeFees={analysis.lifetimeFeesSOL}
                percentClaimed={analysis.claimedPct}
                percentUnclaimed={analysis.unclaimedPct}
              />

              {/* Distribution Breakdown */}
              <DistributionBreakdown
                creatorShare={analysis.creatorSharePct}
                nonCreatorShare={analysis.nonCreatorSharePct}
                top1Claimer={analysis.top1ClaimerPct}
                top5Claimers={analysis.top5ClaimerPct}
              />

              {/* Claimers Breakdown */}
              <ClaimersBreakdown
                claimers={analysis.claimers}
                lifetimeFeesSOL={analysis.lifetimeFeesSOL}
              />

              {/* Claim Activity */}
              <ClaimActivity
                claimCount24h={analysis.claimCount24h}
                totalClaimers={analysis.totalClaimers}
                lastClaimTimestamp={analysis.lastClaimTimestamp}
                status={analysis.activityStatus}
              />
            </div>
          )}

          {/* Empty State - Show when no results yet */}
          {/* {!analysis && !loading && !error && (
            <div className="text-center py-20">
              <p className="text-bags-text-muted">
                Enter a token address to get started
              </p>
            </div>
          )} */}
        </div>
      </main>
    </div>
  );
}
