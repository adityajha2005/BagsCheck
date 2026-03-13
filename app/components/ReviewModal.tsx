/**
 * Review Modal Component
 * 
 * Displays transaction details for user review before signing.
 * Shows all relevant information about the token launch transaction.
 * 
 * Security: Never shows private keys, never auto-signs.
 * Explicitly states the user is launching via Bags protocol.
 */

"use client";

import { useState } from "react";
import { VersionedTransaction } from "@solana/web3.js";
import { FaExclamationTriangle, FaCheckCircle, FaSpinner } from "react-icons/fa";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  tokenInfo: {
    name: string;
    symbol: string;
    description: string;
    imageUrl?: string;
  };
  transactionDetails: {
    tokenMint: string;
    creator: string;
    initialBuyAmount?: string;
    feeRecipients?: Array<{ wallet: string; percentage: number }>;
  };
  serializedTransaction: string;
}

export function ReviewModal({
  isOpen,
  onClose,
  onConfirm,
  tokenInfo,
  transactionDetails,
  serializedTransaction,
}: ReviewModalProps) {
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsSigning(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setIsSigning(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#0c0f14] border border-[#141922] rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#141922]">
          <h2 className="text-xl font-semibold text-white">Review Transaction</h2>
          <p className="text-sm text-[#9aa0a6] mt-1">
            You are launching via <span className="text-[#00ff7f] font-medium">Bags protocol</span>
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Warning Banner */}
          <div className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <FaExclamationTriangle className="text-yellow-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-200">
              <p className="font-medium">Important</p>
              <p className="text-yellow-200/80">
                This transaction will create a new token on Solana. Please verify all details before signing.
              </p>
            </div>
          </div>

          {/* Token Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-[#9aa0a6] uppercase tracking-wide">Token Details</h3>
            <div className="bg-[#07090c] rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                {tokenInfo.imageUrl && (
                  <img
                    src={tokenInfo.imageUrl}
                    alt={tokenInfo.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                )}
                <div>
                  <p className="font-semibold text-white">{tokenInfo.name}</p>
                  <p className="text-sm text-[#9aa0a6]">${tokenInfo.symbol}</p>
                </div>
              </div>
              <p className="text-sm text-[#9aa0a6] line-clamp-2">{tokenInfo.description}</p>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-[#9aa0a6] uppercase tracking-wide">Transaction Details</h3>
            <div className="bg-[#07090c] rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#9aa0a6]">Token Mint</span>
                <span className="text-white font-mono">{formatAddress(transactionDetails.tokenMint)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9aa0a6]">Creator</span>
                <span className="text-white font-mono">{formatAddress(transactionDetails.creator)}</span>
              </div>
              {transactionDetails.initialBuyAmount && (
                <div className="flex justify-between">
                  <span className="text-[#9aa0a6]">Initial Buy</span>
                  <span className="text-white">{transactionDetails.initialBuyAmount} SOL</span>
                </div>
              )}
            </div>
          </div>

          {/* Fee Sharing */}
          {transactionDetails.feeRecipients && transactionDetails.feeRecipients.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-[#9aa0a6] uppercase tracking-wide">Fee Sharing</h3>
              <div className="bg-[#07090c] rounded-lg p-4 space-y-2">
                {transactionDetails.feeRecipients.map((recipient, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-[#9aa0a6] font-mono">{formatAddress(recipient.wallet)}</span>
                    <span className="text-white">{recipient.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security Note */}
          <div className="flex items-start gap-3 p-3 bg-[#00ff7f]/10 border border-[#00ff7f]/20 rounded-lg">
            <FaCheckCircle className="text-[#00ff7f] mt-0.5 flex-shrink-0" />
            <div className="text-sm text-[#00ff7f]">
              <p className="font-medium">Your wallet, your keys</p>
              <p className="text-[#00ff7f]/80">
                You will sign this transaction with your own wallet. We never ask for private keys or auto-sign transactions.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#141922] flex gap-3">
          <button
            onClick={onClose}
            disabled={isSigning}
            className="flex-1 px-4 py-2 bg-[#141922] text-white font-medium rounded-lg hover:bg-[#1a1f2a] transition-colors duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSigning}
            className="flex-1 px-4 py-2 bg-[#00ff7f] text-black font-medium rounded-lg hover:bg-[#00e676] transition-colors duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSigning ? (
              <>
                <FaSpinner className="animate-spin" />
                Signing...
              </>
            ) : (
              "Sign Transaction"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
