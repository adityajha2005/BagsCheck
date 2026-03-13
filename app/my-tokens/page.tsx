'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { VersionedTransaction, PublicKey } from '@solana/web3.js';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Loader2, Coins, AlertCircle, RefreshCw, Wallet, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { BagsSDK } from '@bagsfm/bags-sdk';

/**
 * Interface for claimable position from Bags API
 */
interface ClaimablePosition {
  programId?: string;
  isCustomFeeVault: boolean;
  baseMint: string;
  quoteMint?: string | null;
  virtualPool?: string;
  virtualPoolAddress?: string | null;
  virtualPoolClaimableAmount?: number | null;
  virtualPoolClaimableLamportsUserShare?: number | null;
  dammPoolClaimableAmount?: number | null;
  dammPoolClaimableLamportsUserShare?: number | null;
  isMigrated: boolean;
  dammPoolAddress?: string | null;
  dammPositionInfo?: {
    position: string;
    pool: string;
    positionNftAccount: string;
    tokenAMint: string;
    tokenBMint: string;
    tokenAVault: string;
    tokenBVault: string;
  } | null;
  totalClaimableLamportsUserShare: number;
  claimableDisplayAmount?: number | null;
  user?: string | null;
  claimerIndex?: number | null;
  userBps?: number | null;
  customFeeVault?: string | null;
  customFeeVaultClaimerA?: string | null;
  customFeeVaultClaimerB?: string | null;
  customFeeVaultClaimerSide?: 'A' | 'B' | null;
}

/**
 * Interface for claim transaction result
 */
interface ClaimTransactionResult {
  tx: string;
  blockhash: {
    blockhash: string;
    lastValidBlockHeight: number;
  };
}

/**
 * Interface for token metadata
 */
interface TokenMetadata {
  name: string;
  symbol: string;
  uri: string;
  image?: string;
}


/**
 * My Tokens Dashboard Page
 * 
 * Displays all tokens launched by the connected wallet with claimable fees.
 * Allows users to claim fees from virtual pools and DAMM v2 positions.
 */
export default function MyTokensPage() {
  const { publicKey, connected, sendTransaction } = useWallet();
  const { connection } = useConnection();

  // Initialize Bags SDK
  const sdk = useMemo(() => {
    const apiKey = process.env.NEXT_PUBLIC_BAGS_API_KEY || '';
    return new BagsSDK(apiKey, connection, 'confirmed');
  }, [connection]);

  const [positions, setPositions] = useState<ClaimablePosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claimingPosition, setClaimingPosition] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);
  const [totalClaimable, setTotalClaimable] = useState(0);
  const [tokenMetadata, setTokenMetadata] = useState<Record<string, TokenMetadata>>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  /**
   * Fetch claimable positions for the connected wallet
   */
  const fetchPositions = useCallback(async () => {
    if (!publicKey) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/claim/positions?wallet=${publicKey.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch positions');
      }

      if (data.success && Array.isArray(data.response)) {
        setPositions(data.response);

        // Calculate total claimable amount
        const total = data.response.reduce((sum: number, pos: ClaimablePosition) => {
          return sum + (pos.totalClaimableLamportsUserShare || 0);
        }, 0);
        setTotalClaimable(total);
        setLastUpdated(new Date());
      } else {
        setPositions([]);
        setTotalClaimable(0);
      }
    } catch (err) {
      console.error('Error fetching positions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch positions');
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  /**
   * Fetch token metadata for all positions using Jupiter API
   */
  const fetchTokenMetadata = useCallback(async (mints: string[]) => {
    try {
      const metadataPromises = mints.map(async (mint) => {
        try {
          // Use Jupiter API to fetch token metadata
          const response = await fetch(`https://datapi.jup.ag/v1/assets/search?query=${mint}`);

          if (!response.ok) {
            throw new Error('Jupiter API request failed');
          }

          const data = await response.json();

          // Jupiter returns an array, take the first match (exact match for the mint)
          if (data && data.length > 0 && data[0].id === mint) {
            const tokenData = data[0];
            return {
              mint,
              metadata: {
                name: tokenData.name || 'Unknown Token',
                symbol: tokenData.symbol || mint.slice(0, 4).toUpperCase(),
                uri: tokenData.website || '',
                image: tokenData.icon || undefined,
              } as TokenMetadata,
            };
          }

          // Fallback if no match found
          return {
            mint,
            metadata: {
              name: 'Unknown Token',
              symbol: mint.slice(0, 4).toUpperCase(),
              uri: '',
            } as TokenMetadata,
          };
        } catch (e) {
          return {
            mint,
            metadata: {
              name: 'Unknown Token',
              symbol: mint.slice(0, 4).toUpperCase(),
              uri: '',
            } as TokenMetadata,
          };
        }
      });

      const results = await Promise.all(metadataPromises);
      const metadataMap = results.reduce((acc, { mint, metadata }) => {
        acc[mint] = metadata;
        return acc;
      }, {} as Record<string, TokenMetadata>);

      setTokenMetadata(metadataMap);
    } catch (err) {
      console.error('[MyTokens] Error fetching token metadata:', err);
    }
  }, []);

  // Fetch metadata when positions change
  useEffect(() => {
    if (positions.length > 0) {
      const mints = positions.map(p => p.baseMint);
      fetchTokenMetadata(mints);
    }
  }, [positions, fetchTokenMetadata]);

  // Fetch positions when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      // Initial fetch
      fetchPositions();

      // Set up auto-refresh every 60 seconds (1 minute)
      const intervalId = setInterval(() => {
        fetchPositions();
      }, 60000); // 60 seconds

      // Cleanup interval on unmount or wallet disconnect
      return () => {
        clearInterval(intervalId);
      };
    } else {
      setPositions([]);
      setTotalClaimable(0);
    }
  }, [connected, publicKey, fetchPositions]);

  /**
   * Claim fees for a specific position
   */
  const handleClaim = async (position: ClaimablePosition) => {
    if (!publicKey || !sendTransaction || !connection) {
      setError('Wallet not connected or sendTransaction not available');
      return;
    }

    setClaimingPosition(position.baseMint);
    setClaimSuccess(null);
    setError(null);

    try {

      // Use SDK to get claim transactions - handles all V1/V2 complexity automatically
      // Cast to any to work around type mismatch between API position type and SDK type
      const claimTransactions = await sdk.fee.getClaimTransaction(publicKey, position as any);

      if (!claimTransactions || claimTransactions.length === 0) {
        throw new Error('No claim transactions generated - there may be no fees available to claim at this time');
      }


      // Sign and send each transaction
      for (let i = 0; i < claimTransactions.length; i++) {
        const transaction = claimTransactions[i];


        try {
          // Use wallet adapter's sendTransaction
          const signature = await sendTransaction(transaction, connection, {
            skipPreflight: false,  // SDK transactions should simulate properly
            maxRetries: 3,
            preflightCommitment: 'confirmed',
          });


          // Wait for confirmation
          const latestBlockhash = await connection.getLatestBlockhash('confirmed');
          await connection.confirmTransaction({
            signature,
            ...latestBlockhash,
          }, 'confirmed');

        } catch (txError) {
          console.error(`[MyTokens] Failed to send transaction ${i + 1}:`, txError);

          // Check if user rejected
          if (txError instanceof Error && txError.message.includes('User rejected')) {
            throw new Error('Transaction cancelled by user');
          }

          throw new Error(`Transaction ${i + 1} failed: ${txError instanceof Error ? txError.message : 'Unknown error'}`);
        }
      }

      // Show success message
      setClaimSuccess(position.baseMint);

      // Refresh positions
      await fetchPositions();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setClaimSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error claiming fees:', err);
      setError(err instanceof Error ? err.message : 'Failed to claim fees');
    } finally {
      setClaimingPosition(null);
    }
  };

  /**
   * Format lamports to SOL
   */
  const formatSol = (lamports: number) => {
    return (lamports / 1_000_000_000).toFixed(6);
  };

  /**
   * Truncate address for display
   */
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  /**
   * Get explorer link for an address
   */
  const getExplorerLink = (address: string) => {
    return `https://solscan.io/token/${address}`;
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center">
            <Wallet className="w-16 h-16 mx-auto mb-6 text-[#02ff40]" />
            <h1 className="text-3xl font-bold mb-4">My Tokens</h1>
            <p className="text-gray-400 mb-8">
              Connect your wallet to view your launched tokens and claim fees
            </p>
            <WalletMultiButton className="!bg-[#02ff40] !text-black hover:!bg-[#01e63a] !rounded-lg !px-6 !py-3 !font-medium" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl mt-10 font-bold">My Tokens</h1>
            <p className="text-gray-400 mt-1">
              Manage your launched tokens and claim fees
            </p>
          </div>
          <div className="flex items-center gap-4 mt-10">
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2">
              <span className="text-gray-400 text-sm">Total Claimable</span>
              <p className="text-[#02ff40] font-bold text-lg">
                {formatSol(totalClaimable)} SOL
              </p>
            </div>
            <button
              onClick={fetchPositions}
              disabled={loading}
              className="p-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:bg-[#2a2a2a] transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Positions List */}
        {loading && positions.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#02ff40]" />
          </div>
        ) : positions.length === 0 ? (
          <div className="text-center py-16 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl">
            <Coins className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <h3 className="text-xl font-semibold mb-2">No Tokens Found</h3>
            <p className="text-gray-400">
              You haven't launched any tokens yet, or there are no claimable fees.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {positions.map((position) => (
              <div
                key={position.baseMint}
                className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 hover:border-[#3a3a3a] transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Token Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {/* Token Logo */}
                      {tokenMetadata[position.baseMint]?.image ? (
                        <img
                          src={tokenMetadata[position.baseMint].image}
                          alt={tokenMetadata[position.baseMint].name}
                          className="w-12 h-12 rounded-full object-cover border border-[#2a2a2a]"
                          onError={(e) => {
                            // Fallback to colored circle if image fails
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#02ff40] to-[#01e63a] flex items-center justify-center text-white font-bold text-lg">
                          {tokenMetadata[position.baseMint]?.symbol?.[0] || position.baseMint[0]}
                        </div>
                      )}

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">
                            {tokenMetadata[position.baseMint]?.name || 'Loading...'}
                          </h3>
                          {tokenMetadata[position.baseMint]?.symbol && (
                            <span className="text-sm text-gray-400">
                              {tokenMetadata[position.baseMint].symbol}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {truncateAddress(position.baseMint)}
                        </p>
                      </div>


                      {position.isMigrated && (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                          Migrated
                        </span>
                      )}
                    </div>

                    {/* Pool Info */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                      {position.virtualPool && (
                        <span>Virtual Pool: {truncateAddress(position.virtualPool)}</span>
                      )}
                      {position.dammPoolAddress && (
                        <span>DAMM Pool: {truncateAddress(position.dammPoolAddress)}</span>
                      )}
                    </div>
                  </div>

                  {/* Claimable Amounts */}
                  <div className="flex flex-wrap items-center gap-6">
                    {/* Virtual Pool Fees */}
                    {(position.virtualPoolClaimableLamportsUserShare || position.virtualPoolClaimableAmount) && (
                      <div className="text-center">
                        <p className="text-xs text-gray-400 mb-1">Virtual Pool</p>
                        <p className="text-[#02ff40] font-semibold">
                          {formatSol(position.virtualPoolClaimableLamportsUserShare || position.virtualPoolClaimableAmount || 0)} SOL
                        </p>
                      </div>
                    )}

                    {/* DAMM Pool Fees */}
                    {(position.dammPoolClaimableLamportsUserShare || position.dammPoolClaimableAmount) && (
                      <div className="text-center">
                        <p className="text-xs text-gray-400 mb-1">DAMM Pool</p>
                        <p className="text-[#02ff40] font-semibold">
                          {formatSol(position.dammPoolClaimableLamportsUserShare || position.dammPoolClaimableAmount || 0)} SOL
                        </p>
                      </div>
                    )}

                    {/* Total */}
                    <div className="text-center min-w-[100px]">
                      <p className="text-xs text-gray-400 mb-1">Total Claimable</p>
                      <p className="text-xl font-bold text-[#02ff40]">
                        {formatSol(position.totalClaimableLamportsUserShare)} SOL
                      </p>
                    </div>

                    {/* Claim Button */}
                    <button
                      onClick={() => handleClaim(position)}
                      disabled={claimingPosition === position.baseMint || position.totalClaimableLamportsUserShare <= 0}
                      className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${claimSuccess === position.baseMint
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-[#02ff40] text-black hover:bg-[#01e63a]'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {claimingPosition === position.baseMint ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Claiming...
                        </>
                      ) : claimSuccess === position.baseMint ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Claimed!
                        </>
                      ) : (
                        'Claim Fees'
                      )}
                    </button>
                  </div>
                </div>

                {/* User Share Info */}
                {position.userBps && (
                  <div className="mt-4 pt-4 border-t border-[#2a2a2a] text-sm text-gray-400">
                    Your share: {(position.userBps / 100).toFixed(2)}%
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
