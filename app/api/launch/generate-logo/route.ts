/**
 * POST /api/launch/generate-logo
 *
 * Generates a token logo image using xAI (Grok) via OpenAI SDK.
 * This is a separate endpoint from text generation to allow users to
 * generate text first, then decide if they want the AI-generated logo.
 *
 * Body: { logoPrompt: string }
 *
 * Returns: { logo: string } // URL to generated image
 */

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

interface GenerateLogoRequest {
  logoPrompt: string;
}

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 5; // 5 requests per minute

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true };
  }

  if (record.count >= MAX_REQUESTS) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  record.count++;
  return { allowed: true };
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown";

    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Try again in ${rateLimit.retryAfter} seconds.` },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfter),
            "X-RateLimit-Limit": String(MAX_REQUESTS),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server configuration error: XAI_API_KEY not set" },
        { status: 500 }
      );
    }

    const body: GenerateLogoRequest = await request.json();

    if (!body.logoPrompt || typeof body.logoPrompt !== "string" || body.logoPrompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Please provide a logo prompt" },
        { status: 400 }
      );
    }

    // Initialize OpenAI client with xAI base URL
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://api.x.ai/v1",
    });

    // Enhance the prompt for better logo quality
    const enhancedPrompt = `Create a professional cryptocurrency token logo: ${body.logoPrompt}. Clean, modern crypto style, centered composition, suitable for a token icon. High quality, simple design.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s timeout for image generation

    try {
      // Generate logo image using xAI
      const response = await openai.images.generate({
        model: "grok-imagine-image",
        prompt: enhancedPrompt,
      });

      clearTimeout(timeoutId);

      const imageUrl = response.data?.[0]?.url;

      if (!imageUrl) {
        throw new Error("No image URL received from xAI");
      }

      // Fetch the image and convert to base64
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error("Failed to fetch generated image");
      }

      const imageBuffer = await imageResponse.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString("base64");

      return NextResponse.json({
        success: true,
        logo: `data:image/png;base64,${base64Image}`,
      });
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        return NextResponse.json(
          { error: "Request timeout: Image generation took too long" },
          { status: 504 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("Generate logo error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate logo. Please try again.",
      },
      { status: 500 }
    );
  }
}
