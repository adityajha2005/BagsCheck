"use client";

import { KeyboardEvent } from "react";
import { FaSearchDollar } from "react-icons/fa";

interface TokenInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (tokenMint: string) => void;
  loading?: boolean;
}

export function TokenInput({
  value,
  onChange,
  onSubmit,
  loading = false,
}: TokenInputProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && value.trim() && !loading) {
      onSubmit(value.trim());
    }
  };

  const handleSubmit = () => {
    if (value.trim() && !loading) {
      onSubmit(value.trim());
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={loading ? "Loading..." : "Paste token CA"}
          disabled={loading}
          className="w-full h-16 bg-bags-bg-secondary border border-bags-border text-white text-lg px-6 pr-14 focus:outline-none focus:border-bags-green focus:ring-1 focus:ring-bags-green/30 caret-bags-green transition-all placeholder:text-bags-text-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {loading ? (
          <div className="absolute right-6 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-bags-green/30 border-t-bags-green rounded-full animate-spin" />
          </div>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!value.trim() || loading}
            className="absolute right-6 top-1/2 -translate-y-1/2 text-bags-text-secondary hover:text-bags-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Search"
            type="button"
          >
            <FaSearchDollar />
          </button>
        )}
      </div>

      {/* Helper Text */}
      <p className="text-sm text-bags-text-muted text-center">
        Solana token mint address
      </p>
    </div>
  );
}
