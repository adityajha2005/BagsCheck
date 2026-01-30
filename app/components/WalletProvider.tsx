/**
 * Wallet Provider Component
 * 
 * Wraps the app with Solana wallet adapter context.
 * Configured for mainnet with Phantom wallet support.
 * 
 * TODO: AI Feature Hook - Wallet analytics and insights
 * This is where AI could provide portfolio analysis,
 * transaction history insights, or risk assessments.
 */

"use client";

import { ReactNode, useMemo } from "react";
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { clusterApiUrl, Connection } from "@solana/web3.js";

// Import wallet adapter CSS
import "@solana/wallet-adapter-react-ui/styles.css";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  // Use mainnet endpoint
  // For production, consider using a dedicated RPC provider like Helius, QuickNode, or Alchemy
  const endpoint = useMemo(() => {
    // Check for custom RPC endpoint in env
    if (process.env.NEXT_PUBLIC_SOLANA_RPC_URL) {
      return process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
    }
    // Fallback to public mainnet endpoint
    return clusterApiUrl("mainnet-beta");
  }, []);

  // Create connection with commitment level
  const connection = useMemo(() => {
    return new Connection(endpoint, {
      commitment: "confirmed",
      wsEndpoint: undefined, // Disable WebSocket for now
    });
  }, [endpoint]);

  // Configure wallets
  const wallets = useMemo(
    () => [
      // new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      // TODO: Add more wallets as needed (Solflare, Backpack, etc.)
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}
