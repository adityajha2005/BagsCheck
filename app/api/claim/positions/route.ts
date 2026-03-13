import { NextRequest, NextResponse } from 'next/server';

const BAGS_API_BASE = 'https://public-api-v2.bags.fm/api/v1';

/**
 * GET /api/claim/positions
 * 
 * Fetch all claimable fee positions for a wallet.
 * Returns positions with fee information from virtual pools and DAMM v2.
 * 
 * @param request - NextRequest with wallet query parameter
 * @returns JSON response with claimable positions array
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');

    // Validate wallet parameter
    if (!wallet) {
      return NextResponse.json(
        { success: false, error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Validate wallet address format (base58, 32-44 chars)
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    if (!base58Regex.test(wallet)) {
      return NextResponse.json(
        { success: false, error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    const apiKey = process.env.BAGS_API_KEY;
    if (!apiKey) {
      console.error('BAGS_API_KEY is not configured');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Call Bags API to get claimable positions
    const response = await fetch(
      `${BAGS_API_BASE}/token-launch/claimable-positions?wallet=${encodeURIComponent(wallet)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Bags API error:', data);
      return NextResponse.json(
        { 
          success: false, 
          error: data.error || `Failed to fetch claimable positions: ${response.statusText}` 
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching claimable positions:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
