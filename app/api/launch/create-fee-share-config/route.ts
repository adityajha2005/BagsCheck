import { NextRequest, NextResponse } from "next/server";

const BAGS_API_BASE = "https://public-api-v2.bags.fm/api/v1";

// Update interface for expected request body
interface FeeShareConfigRequest {
    payer: string;
    baseMint: string;
    claimersArray: string[];
    basisPointsArray: number[];
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

        const body: FeeShareConfigRequest = await request.json();

        // Validate required fields
        if (!body.payer || !body.baseMint || !body.claimersArray || !body.basisPointsArray) {
            return NextResponse.json(
                { error: "Missing required fields: payer, baseMint, claimersArray, basisPointsArray" },
                { status: 400 }
            );
        }

        // Default to 100% to creator if arrays provided but empty (safety fallback, though client should send correct data)
        if (body.claimersArray.length === 0) body.claimersArray = [body.payer];
        if (body.basisPointsArray.length === 0) body.basisPointsArray = [10000];

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // Increased timeout

        const response = await fetch(
            `${BAGS_API_BASE}/fee-share/config`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                },
                body: JSON.stringify(body),
                signal: controller.signal,
            }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Bags API error (create-fee-share-config):", errorText);
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

        // Return the config key (meteoraConfigKey) and the transaction to sign if needed (fee share creation tx)
        // The response structure from docs: { response: { meteoraConfigKey: "...", transactions: [...] } }
        return NextResponse.json({
            success: true,
            config: data.response.meteoraConfigKey,
            transactions: data.response.transactions, // In case we need to sign creation txs
        });

    } catch (error) {
        console.error("Create fee share config error:", error);
        return NextResponse.json(
            { error: "Failed to create fee share config" },
            { status: 500 }
        );
    }
}
