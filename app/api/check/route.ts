import { NextRequest, NextResponse } from "next/server";
import { fetchAllTokenData } from "@/lib/bags";
import { analyzeToken } from "@/lib/analyze";
import { isValidTokenMint } from "@/lib/validation";

// Simple in-memory rate limiting (light)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute per IP

function getRateLimitKey(request: NextRequest): string {
  // Get IP from headers (works with Vercel, Cloudflare, etc.)
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "unknown";
  return ip;
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    // Reset or create new record
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitKey = getRateLimitKey(request);
  if (!checkRateLimit(rateLimitKey)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429 }
    );
  }
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
    
    // Handle specific error types with user-friendly messages
    let errorMessage = "Failed to fetch token data. Please try again.";
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes("timeout")) {
        errorMessage = "Request timeout: The API took too long to respond. Please try again in a moment.";
        statusCode = 504;
      } else if (error.message.includes("Bags API error")) {
        errorMessage = error.message;
        statusCode = 502;
      } else if (error.message.includes("BAGS_API_KEY")) {
        errorMessage = "Server configuration error. Please contact support.";
        statusCode = 500;
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}
