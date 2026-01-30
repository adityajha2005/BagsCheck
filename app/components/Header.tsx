"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaPlus, FaCoins } from "react-icons/fa6";
import { ConnectWalletButton } from "./ConnectWalletButton";
import { useWallet } from "@solana/wallet-adapter-react";

export function Header() {
  const pathname = usePathname();
  const { connected } = useWallet();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-bags-border">
      <div className="max-w-7xl mx-auto h-16 px-6 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 hover:opacity-80 transition-opacity group"
        >
          {/* Logo Image */}
          <div className="relative">
            <img
              src="/bagscheck.png"
              alt="BagsCheck"
              className="w-18 h-18 transition-transform group-hover:scale-105"
            />
          </div>

          {/* Text Logo */}
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-white">Bags</span>
            <span className="text-bags-green">Check</span>
          </h1>
        </Link>

        {/* Right side - Navigation + Connect Wallet */}
        <div className="flex items-center gap-3">
          {/* My Tokens Link - Only show when wallet is connected */}
          {connected && (
            <Link
              href="/my-tokens"
              className={`flex items-center gap-2 p-2 md:px-4 md:py-2.5 font-medium rounded-full transition-colors ${pathname === "/my-tokens"
                ? "bg-[#2a2a2a] text-[#00ff7f]"
                : "text-gray-300 hover:text-white hover:bg-[#1a1a1a]"
                }`}
            >
              <FaCoins className="text-lg" />
              <span className="hidden md:inline">my tokens</span>
            </Link>
          )}

          {/* New Project Button */}
          <Link
            href="/launch"
            className="flex items-center gap-2 p-2 md:px-5 md:py-2.5 bg-[#00ff7f] text-black font-semibold rounded-full hover:bg-[#00e676] transition-colors"
          >
            <FaPlus className="text-lg" />
            <span className="hidden md:inline">new project</span>
          </Link>
          <ConnectWalletButton />
        </div>
      </div>
    </header>
  );
}
