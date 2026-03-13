

import { NextRequest, NextResponse } from "next/server";

const BAGS_API_BASE = "https://public-api-v2.bags.fm/api/v1";

interface LaunchTransactionRequest {
  tokenMint: string;
  wallet: string;
  ipfs: string;
  configKey: string;
  initialBuyAmount?: string;
  tipWallet?: string;
  tipAmount?: string;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.BAGS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server configuration error: BAGS_API_KEY not set" },
        { status: 500 }
      );
    }

    const body: LaunchTransactionRequest = await request.json();

    // Validate required fields
    if (!body.tokenMint) {
      return NextResponse.json(
        { error: "tokenMint is required" },
        { status: 400 }
      );
    }

    if (!body.wallet) {
      return NextResponse.json(
        { error: "wallet is required" },
        { status: 400 }
      );
    }

    if (!body.ipfs) {
      return NextResponse.json(
        { error: "ipfs (metadata URL) is required" },
        { status: 400 }
      );
    }



    // Validate Solana address format (base58, 32-44 chars)
    const solanaAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    if (!solanaAddressRegex.test(body.wallet)) {
      return NextResponse.json(
        { error: "Invalid wallet address" },
        { status: 400 }
      );
    }

    if (!solanaAddressRegex.test(body.tokenMint)) {
      return NextResponse.json(
        { error: "Invalid token mint address" },
        { status: 400 }
      );
    }

    // Convert initial buy amount from SOL string to lamports (number)
    let initialBuyLamports = 0;
    if (body.initialBuyAmount) {
      const amount = parseFloat(body.initialBuyAmount);
      if (isNaN(amount) || amount < 0) {
        return NextResponse.json(
          { error: "Invalid initial buy amount" },
          { status: 400 }
        );
      }
      // Max 10 SOL for safety
      if (amount > 10) {
        return NextResponse.json(
          { error: "Initial buy amount too large (max 10 SOL)" },
          { status: 400 }
        );
      }
      initialBuyLamports = Math.floor(amount * 1e9);
    }

    // Validate optional tip fields
    let tipLamports: number | undefined;
    if (body.tipWallet && !solanaAddressRegex.test(body.tipWallet)) {
      return NextResponse.json(
        { error: "Invalid tip wallet address" },
        { status: 400 }
      );
    }

    if (body.tipAmount) {
      const tipAmount = parseFloat(body.tipAmount);
      if (isNaN(tipAmount) || tipAmount < 0) {
        return NextResponse.json(
          { error: "Invalid tip amount" },
          { status: 400 }
        );
      }
      tipLamports = Math.floor(tipAmount * 1e9);
    }



    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      // Build request body for Bags API
      const bagsRequestBody: {
        tokenMint: string;
        wallet: string;
        ipfs: string;
        configKey?: string; // Made optional
        initialBuyLamports: number;
        tipWallet?: string;
        tipLamports?: number;
      } = {
        tokenMint: body.tokenMint,
        wallet: body.wallet,
        ipfs: body.ipfs,
        configKey: body.configKey,
        initialBuyLamports,
      };

      // Add optional tip fields if provided
      if (body.tipWallet) {
        bagsRequestBody.tipWallet = body.tipWallet;
      }
      if (tipLamports !== undefined) {
        bagsRequestBody.tipLamports = tipLamports;
      }

      const response = await fetch(
        `${BAGS_API_BASE}/token-launch/create-launch-transaction`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
          body: JSON.stringify(bagsRequestBody),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Bags API error:", errorText);
        return NextResponse.json(
          { error: `Bags API error: ${response.status} - ${errorText}` },
          { status: response.status }
        );
      }

      const data = await response.json();

      if (!data.success) {
        return NextResponse.json(
          { error: data.error || "Unknown error from Bags API" },
          { status: 502 }
        );
      }

      // Handle response structure: can be { response: "txString" } or { response: { transaction: "txString" } }
      const transaction = typeof data.response === 'string'
        ? data.response
        : data.response?.transaction;

      if (!transaction) {
        return NextResponse.json(
          { error: "Invalid response from Bags API: missing transaction" },
          { status: 502 }
        );
      }

      // Return the serialized transaction
      return NextResponse.json({
        success: true,
        transaction: transaction,
        // Include additional info for the UI
        tokenMint: body.tokenMint,
      });

    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        return NextResponse.json(
          { error: "Request timeout: The API took too long to respond" },
          { status: 504 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("Create launch transaction error:", error);
    return NextResponse.json(
      { error: "Failed to create launch transaction. Please try again." },
      { status: 500 }
    );
  }
}
