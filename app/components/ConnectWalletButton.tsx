/**
 * Connect Wallet Button
 *
 * Displays wallet connection state and opens the wallet modal.
 * Shows connected wallet address when connected.
 * Hover shows SOL balance and disconnect button.
 */

"use client";

import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useCallback, useEffect, useState, useRef } from "react";
import { FaCopy, FaPowerOff } from "react-icons/fa6";

export function ConnectWalletButton() {
  const { connected, publicKey, disconnect } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const [balance, setBalance] = useState<number | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch SOL balance when connected
  useEffect(() => {
    if (connected && publicKey && connection) {
      const fetchBalance = async () => {
        try {
          const bal = await connection.getBalance(publicKey);
          setBalance(bal / 1e9); // Convert lamports to SOL
        } catch (error) {
          console.error("Failed to fetch balance:", error);
        }
      };
      fetchBalance();
      // Refresh balance every 10 seconds
      const interval = setInterval(fetchBalance, 10000);
      return () => clearInterval(interval);
    }
  }, [connected, publicKey, connection]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setShowDropdown(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setShowDropdown(false);
    }, 200); // Small delay to allow moving to dropdown
  };

  const handleClick = useCallback(() => {
    if (!connected) {
      setVisible(true);
    }
  }, [connected, setVisible]);

  const handleDisconnect = useCallback(() => {
    disconnect();
    setShowDropdown(false);
  }, [disconnect]);

  const copyAddress = useCallback(() => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toString());
    }
  }, [publicKey]);

  // Format wallet address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // Format balance for display
  const formatBalance = (bal: number) => {
    return bal.toFixed(2);
  };

  if (!connected || !publicKey) {
    return (
      <button
        onClick={handleClick}
        className="px-6 py-2.5 bg-white text-black font-semibold rounded-full hover:bg-gray-100 transition-colors duration-200"
      >
        log in
      </button>
    );
  }

  return (
    <div 
      className="relative" 
      ref={dropdownRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Connected Button - No PFP */}
      <button
        className="flex items-center gap-3 px-5 py-2.5 bg-[#141922] border border-[#2a2f3a] rounded-full hover:border-[#3a3f4a] transition-colors duration-200 cursor-default"
      >
        {/* Address */}
        <span className="text-white font-semibold">
          ${formatAddress(publicKey.toString())}
        </span>
        
        {/* Divider */}
        <span className="text-[#3a3f4a]">|</span>
        
        {/* Balance */}
        <span className="text-white font-semibold">
          {balance !== null ? `${formatBalance(balance)} SOL` : "... SOL"}
        </span>
      </button>

      {/* Dropdown - Opens on hover */}
      {showDropdown && (
        <div 
          className="absolute right-0 top-full mt-2 w-72 bg-[#0c0f14] border border-[#141922] rounded-xl shadow-2xl overflow-hidden z-50"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Wallet Info */}
          <div className="p-4 border-b border-[#141922]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-semibold">SOL Wallet</span>
              <div className="flex items-center gap-1 text-[#00ff7f]">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
                <span className="font-medium">
                  {balance !== null ? `${balance.toFixed(4)} SOL` : "... SOL"}
                </span>
              </div>
            </div>
            
            {/* Address with copy */}
            <div className="w-full flex items-center justify-center gap-2 text-[#9aa0a6] text-sm">
              <span>{formatAddress(publicKey.toString())}</span>
              <button
                onClick={copyAddress}
                className="p-1 hover:text-white transition-colors cursor-pointer"
                title="Copy address"
              >
                <FaCopy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Disconnect Button */}
          <button
            onClick={handleDisconnect}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-white hover:bg-white-500/10 transition-colors cursor-pointer"
          >
            <FaPowerOff className="w-4 h-4" />
            <span className="font-medium">Disconnect</span>
          </button>
        </div>
      )}
    </div>
  );
}
