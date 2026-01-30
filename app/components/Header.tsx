"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaPlus, FaCoins, FaBars, FaXmark } from "react-icons/fa6";
import { ConnectWalletButton } from "./ConnectWalletButton";
import { useWallet } from "@solana/wallet-adapter-react";

export function Header() {
  const pathname = usePathname();
  const { connected } = useWallet();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-bags-border">
      <div className="max-w-7xl mx-auto h-16 px-6 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 hover:opacity-80 transition-opacity group"
          onClick={() => setIsMenuOpen(false)}
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

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-3">
          {/* My Tokens Link - Only show when wallet is connected */}
          {connected && (
            <Link
              href="/my-tokens"
              className={`flex items-center gap-2 p-2 px-4 py-2.5 font-medium rounded-full transition-colors ${pathname === "/my-tokens"
                ? "bg-[#2a2a2a] text-[#00ff7f]"
                : "text-gray-300 hover:text-white hover:bg-[#1a1a1a]"
                }`}
            >
              <FaCoins className="text-lg" />
              <span>my tokens</span>
            </Link>
          )}

          {/* New Project Button */}
          <Link
            href="/launch"
            className="flex items-center gap-2 p-2 px-5 py-2.5 bg-[#00ff7f] text-black font-semibold rounded-full hover:bg-[#00e676] transition-colors"
          >
            <FaPlus className="text-lg" />
            <span>new project</span>
          </Link>
          <ConnectWalletButton />
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-white text-2xl p-2 focus:outline-none"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <FaXmark /> : <FaBars />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-black border-b border-bags-border absolute w-full left-0 top-16 px-6 py-4 flex flex-col gap-4 shadow-lg">
          {connected && (
            <Link
              href="/my-tokens"
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname === "/my-tokens"
                ? "bg-[#2a2a2a] text-[#00ff7f]"
                : "text-gray-300 hover:bg-[#1a1a1a] hover:text-white"
                }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <FaCoins className="text-xl" />
              <span className="font-medium text-lg">My Tokens</span>
            </Link>
          )}

          <Link
            href="/launch"
            className="flex items-center gap-3 p-3 bg-[#00ff7f] text-black font-bold rounded-lg hover:bg-[#00e676] transition-colors"
            onClick={() => setIsMenuOpen(false)}
          >
            <FaPlus className="text-xl" />
            <span className="font-medium text-lg">New Project</span>
          </Link>

          <div className="pt-2 border-t border-gray-800 flex justify-center">
            <ConnectWalletButton />
          </div>
        </div>
      )}
    </header>
  );
}
