/**
 * POST /api/launch/generate-metadata
 *
 * Generates token metadata (name, symbol, description) and logo prompt using Blackbox AI.
 * User provides a short idea, AI generates launch-ready token data.
 * Logo generation is separate - user can generate image after text is ready.
 *
 * Body: { idea: string }
 *
 * Returns: {
 *   name: string,
 *   symbol: string,
 *   description: string,
 *   logo_prompt: string,
 *   confidence: "low" | "medium" | "high"
 * }
 */

import { NextRequest, NextResponse } from "next/server";

interface GenerateMetadataRequest {
  idea: string;
}

interface TokenMetadata {
  name: string;
  symbol: string;
  description: string;
  logo_prompt: string;
  confidence: "low" | "medium" | "high";
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

async function generateTextMetadata(idea: string, apiKey: string): Promise<TokenMetadata> {
  const prompt = `You are generating launch-ready token metadata for a cryptocurrency token on Bags.fm.

User idea: "${idea}"

Generate the following in valid JSON format:
- name: A catchy token name (max 32 characters)
- symbol: UPPERCASE ticker symbol (max 10 characters, no spaces)
- description: A compelling description (max 1000 characters)
- logo_prompt: A detailed prompt for generating a simple, clean crypto-style logo (describe colors, style, imagery - no copyrighted styles)
- confidence: Your confidence level in this generation ("low", "medium", or "high")

STRICT RULES:
- Return ONLY valid JSON
- Do NOT include markdown, explanations, or extra text
- The output must be directly usable

Example output:
{
  "name": "Moon Rocket",
  "symbol": "MOON",
  "description": "A community-driven token for space enthusiasts...",
  "logo_prompt": "A minimalist rocket icon in gradient purple and blue, modern crypto style, clean vector design, white background",
  "confidence": "high"
}`;

  const response = await fetch("https://api.blackbox.ai/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "blackboxai/x-ai/grok-code-fast-1:free",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Blackbox AI text generation failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Empty response from Blackbox AI");
  }

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/({[\s\S]*})/);
  const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;

  try {
    const parsed = JSON.parse(jsonString.trim()) as TokenMetadata;

    // Validate constraints
    if (parsed.name.length > 32) {
      parsed.name = parsed.name.slice(0, 32);
    }
    if (parsed.symbol.length > 10) {
      parsed.symbol = parsed.symbol.slice(0, 10);
    }
    parsed.symbol = parsed.symbol.toUpperCase().replace(/\s/g, "");
    if (parsed.description.length > 1000) {
      parsed.description = parsed.description.slice(0, 1000);
    }

    return parsed;
  } catch (error) {
    throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
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

    const apiKey = process.env.BLACKBOX_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server configuration error: BLACKBOX_API_KEY not set" },
        { status: 500 }
      );
    }

    const body: GenerateMetadataRequest = await request.json();

    if (!body.idea || typeof body.idea !== "string" || body.idea.trim().length === 0) {
      return NextResponse.json(
        { error: "Please provide an idea for your token" },
        { status: 400 }
      );
    }

    if (body.idea.length > 500) {
      return NextResponse.json(
        { error: "Idea too long. Maximum 500 characters allowed." },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    try {
      // Generate text metadata only (logo prompt is included for later image generation)
      const metadata = await generateTextMetadata(body.idea, apiKey);

      clearTimeout(timeoutId);

      return NextResponse.json({
        success: true,
        metadata: {
          name: metadata.name,
          symbol: metadata.symbol,
          description: metadata.description,
          logo_prompt: metadata.logo_prompt,
          confidence: metadata.confidence,
        },
      });
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        return NextResponse.json(
          { error: "Request timeout: AI generation took too long" },
          { status: 504 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("Generate metadata error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate metadata. Please try again.",
      },
      { status: 500 }
    );
  }
}
