/**
 * POST /api/launch/create-token-info
 * 
 * Proxies token metadata upload to Bags API.
 * Handles multipart/form-data with image + metadata fields.
 * 
 * Returns: { tokenMint: string, metadataUrl: string, imageUrl: string }
 */

import { NextRequest, NextResponse } from "next/server";

const BAGS_API_BASE = "https://public-api-v2.bags.fm/api/v1";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.BAGS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server configuration error: BAGS_API_KEY not set" },
        { status: 500 }
      );
    }

    // Clone the request to read the form data
    const formData = await request.formData();

    // Validate required fields
    const name = formData.get("name") as string | null;
    const symbol = formData.get("symbol") as string | null;
    const description = formData.get("description") as string | null;
    const image = formData.get("image") as File | null;

    if (!name || !symbol || !description) {
      return NextResponse.json(
        { error: "Missing required fields: name, symbol, and description are required" },
        { status: 400 }
      );
    }

    if (!image) {
      return NextResponse.json(
        { error: "Token image is required" },
        { status: 400 }
      );
    }

    // Validate image type
    if (!image.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Invalid file type. Only images are allowed" },
        { status: 400 }
      );
    }

    // Validate image size (max 5MB)
    if (image.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image too large. Maximum size is 5MB" },
        { status: 400 }
      );
    }

    // Forward to Bags API
    const bagsFormData = new FormData();
    bagsFormData.append("name", name);
    bagsFormData.append("symbol", symbol);
    bagsFormData.append("description", description);
    bagsFormData.append("image", image, image.name);

    // Optional fields
    const telegram = formData.get("telegram") as string | null;
    const twitter = formData.get("twitter") as string | null;
    const website = formData.get("website") as string | null;

    if (telegram) bagsFormData.append("telegram", telegram);
    if (twitter) bagsFormData.append("twitter", twitter);
    if (website) bagsFormData.append("website", website);

    // TODO: AI Feature Hook - Auto-generate social links from description
    // This is where AI could analyze the token concept and suggest
    // relevant social media handles or website URLs

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for upload

    try {
      const response = await fetch(
        `${BAGS_API_BASE}/token-launch/create-token-info`,
        {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
          },
          body: bagsFormData,
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

      // Return the token info
      return NextResponse.json({
        success: true,
        tokenMint: data.response.tokenMint,
        tokenMetadata: data.response.tokenMetadata,
        tokenLaunch: data.response.tokenLaunch,
      });
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        return NextResponse.json(
          { error: "Request timeout: The upload took too long" },
          { status: 504 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("Create token info error:", error);
    return NextResponse.json(
      { error: "Failed to create token info. Please try again." },
      { status: 500 }
    );
  }
}
