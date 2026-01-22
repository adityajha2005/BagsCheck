import { NextRequest, NextResponse } from "next/server";
import { fetchAllTokenData } from "@/lib/bags";
import { analyzeToken } from "@/lib/analyze";
import { isValidTokenMint } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokenMint } = body;

    // Validate token mint
    if (!tokenMint || !isValidTokenMint(tokenMint)) {
      return NextResponse.json(
        { error: "Invalid Solana token mint" },
        { status: 400 }
      );
    }

    // Fetch all data in parallel (server-side)
    const rawData = await fetchAllTokenData(tokenMint);

    // Analyze and normalize data
    const analysis = analyzeToken(rawData);

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch token data" },
      { status: 500 }
    );
  }
}
