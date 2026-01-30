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
    textColor: "text-bags-green",
    leftBorderColor: "border-l-bags-green",
    patternBg: "bg-bags-green/5",
    patternBorder: "border-bags-green/20",
    patternText: "text-bags-green/80",
  },
  CENTRALIZED: {
    textColor: "text-[#f5c842]",
    leftBorderColor: "border-l-[#f5c842]",
    patternBg: "bg-[#f5c842]/5",
    patternBorder: "border-[#f5c842]/20",
    patternText: "text-[#f5c842]/80",
  },
  DORMANT: {
    textColor: "text-bags-text-muted",
    leftBorderColor: "border-l-bags-border",
    patternBg: "bg-bags-bg-secondary/50",
    patternBorder: "border-bags-border",
    patternText: "text-bags-text-muted",
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
      className={`bg-bags-bg-card border border-bags-border ${config.leftBorderColor} border-l-2 p-4 md:p-8 space-y-4 relative rounded-lg`}
    >
      {/* Verdict Label */}
      <div className="flex items-center gap-3">
        <h2 className={`text-3xl font-bold ${config.textColor}`}>
          {verdict}
        </h2>
      </div>

      {/* Pattern Label */}
      <div className={`inline-flex items-center gap-2 ${config.patternBg} border ${config.patternBorder} px-3 py-1.5 rounded-full`}>
        <span className="text-xs font-medium text-bags-text-muted uppercase tracking-wide">Pattern:</span>
        <span className={`text-xs font-semibold ${config.patternText}`}>{pattern}</span>
      </div>

      {/* Summary */}
      <p className="text-lg text-white leading-relaxed">
        {summary}
      </p>

      {/* Why this verdict? */}
      <p className="text-sm text-bags-text-muted">
        <span className="font-semibold text-bags-text-secondary">Why:</span> {why}
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
