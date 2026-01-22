"use client";

import { useState } from "react";

interface VerdictCardProps {
  verdict: "HEALTHY" | "CENTRALIZED" | "DORMANT";
  summary: string;
  why: string;
  tokenMint: string;
  pattern: string;
}

const verdictConfig = {
  HEALTHY: {
    color: "text-bags-green",
    bgColor: "bg-bags-green/10",
    borderColor: "border-bags-green/30",
    icon: "✓",
  },
  CENTRALIZED: {
    color: "text-yellow-400",
    bgColor: "bg-yellow-400/10",
    borderColor: "border-yellow-400/30",
    icon: "⚠",
  },
  DORMANT: {
    color: "text-bags-text-secondary",
    bgColor: "bg-bags-bg-card",
    borderColor: "border-bags-border",
    icon: "○",
  },
};

export function VerdictCard({ verdict, summary, why, tokenMint, pattern }: VerdictCardProps) {
  const config = verdictConfig[verdict];
  const [copied, setCopied] = useState(false);

  const handleCopyVerdict = async () => {
    // Format verdict text for CT
    const verdictText = `BagsCheck verdict: ${verdict}
Token: ${tokenMint}
${why}`;

    await navigator.clipboard.writeText(verdictText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const bagsUrl = `https://bags.fm/token/${tokenMint}`;
  // const solscanUrl = `https://solscan.io/token/${tokenMint}`;

  return (
    <div
      className={`${config.bgColor} border ${config.borderColor} p-8 space-y-4 relative rounded-2xl`}
    >
      {/* Verdict Label */}
      <div className="flex items-center gap-3">
        {/* <span className={`text-3xl ${config.color}`}>{config.icon}</span> */}
        <h2 className={`text-3xl font-semibold ${config.color}`}>
          {verdict}
        </h2>
      </div>

      {/* Pattern Label */}
      <div className="inline-flex items-center gap-2 bg-bags-bg-secondary/50 border border-bags-border px-3 py-1.5 rounded-full">
        <span className="text-xs font-medium text-bags-text-muted uppercase tracking-wide">Pattern:</span>
        <span className="text-xs font-semibold text-bags-text-primary">{pattern}</span>
      </div>

      {/* Summary */}
      <p className="text-lg text-bags-text-primary leading-relaxed">
        {summary}
      </p>

      {/* Why this verdict? */}
      <p className="text-sm text-bags-text-secondary">
        <span className="font-bold">Why:</span> {why}
      </p>

      {/* Actions - Bottom Right */}
      <div className="flex items-center gap-3 justify-end pt-2">
        {/* External Links */}
        <a
          href={bagsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex rounded-full items-center gap-15 text-bags-text-secondary hover:opacity-80 transition-opacity"
          title="Open on Bags.fm"
        >
          <img src="/bags-logo.png" alt="Bags.fm" className="w-8 h-8" />
        </a>
      </div>
    </div>
  );
}
