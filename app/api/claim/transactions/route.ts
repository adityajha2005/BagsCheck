import { NextRequest, NextResponse } from 'next/server';

const BAGS_API_BASE = 'https://public-api-v2.bags.fm/api/v1';

/**
 * Interface for claim transaction request body
 */
interface ClaimTransactionsRequest {
  /** Public key of the fee claimer wallet */
  feeClaimer: string;
  /** Token mint public key */
  tokenMint: string;
  /** Virtual pool address (required if claimVirtualPoolFees is true) */
  virtualPoolAddress?: string | null;
  /** DAMM v2 position public key */
  dammV2Position?: string | null;
  /** DAMM v2 pool public key */
  dammV2Pool?: string | null;
  /** DAMM v2 position NFT account public key */
  dammV2PositionNftAccount?: string | null;
  /** Token A mint public key */
  tokenAMint?: string | null;
  /** Token B mint public key */
  tokenBMint?: string | null;
  /** Token A vault public key */
  tokenAVault?: string | null;
  /** Token B vault public key */
  tokenBVault?: string | null;
  /** Whether to claim virtual pool fees */
  claimVirtualPoolFees?: boolean | null;
  /** Whether to claim DAMM v2 fees */
  claimDammV2Fees?: boolean | null;
  /** Whether using a custom fee vault */
  isCustomFeeVault?: boolean | null;
  /** Program ID of the fee share program */
  feeShareProgramId?: string | null;
  /** Custom fee vault claimer A public key (for v1 fee share) */
  customFeeVaultClaimerA?: string | null;
  /** Custom fee vault claimer B public key (for v1 fee share) */
  customFeeVaultClaimerB?: string | null;
  /** Which side of the custom fee vault to claim for (A or B) */
  customFeeVaultClaimerSide?: 'A' | 'B' | null;
}

/**
 * POST /api/claim/transactions
 * 
 * Generate transactions to claim fees from virtual pools and/or DAMM v2 positions.
 * Supports both v1 and v2 fee share programs.
 * 
 * @param request - NextRequest with claim parameters
 * @returns JSON response with serialized claim transactions
 */
export async function POST(request: NextRequest) {
  try {
    const body: ClaimTransactionsRequest = await request.json();

    // Validate required fields
    if (!body.feeClaimer) {
      return NextResponse.json(
        { success: false, error: 'feeClaimer is required' },
        { status: 400 }
      );
    }

    if (!body.tokenMint) {
      return NextResponse.json(
        { success: false, error: 'tokenMint is required' },
        { status: 400 }
      );
    }

    // Validate that at least one claim type is specified
    const hasVirtualPool = body.claimVirtualPoolFees === true && body.virtualPoolAddress;
    const hasDammV2 = body.claimDammV2Fees === true && body.dammV2Position && body.dammV2Pool;
    const hasCustomVault = body.isCustomFeeVault === true && body.customFeeVaultClaimerSide;

    if (!hasVirtualPool && !hasDammV2 && !hasCustomVault) {
      // Don't error here - let the Bags API handle validation
      // This allows for more flexible claim configurations
    }

    // Validate wallet address format (base58, 32-44 chars)
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    if (!base58Regex.test(body.feeClaimer)) {
      return NextResponse.json(
        { success: false, error: 'Invalid feeClaimer address format' },
        { status: 400 }
      );
    }

    if (!base58Regex.test(body.tokenMint)) {
      return NextResponse.json(
        { success: false, error: 'Invalid tokenMint address format' },
        { status: 400 }
      );
    }

    // Validate optional addresses if provided
    const optionalAddresses = [
      { field: 'virtualPoolAddress', value: body.virtualPoolAddress },
      { field: 'dammV2Position', value: body.dammV2Position },
      { field: 'dammV2Pool', value: body.dammV2Pool },
      { field: 'dammV2PositionNftAccount', value: body.dammV2PositionNftAccount },
      { field: 'tokenAMint', value: body.tokenAMint },
      { field: 'tokenBMint', value: body.tokenBMint },
      { field: 'tokenAVault', value: body.tokenAVault },
      { field: 'tokenBVault', value: body.tokenBVault },
      { field: 'feeShareProgramId', value: body.feeShareProgramId },
      { field: 'customFeeVaultClaimerA', value: body.customFeeVaultClaimerA },
      { field: 'customFeeVaultClaimerB', value: body.customFeeVaultClaimerB },
    ];

    for (const { field, value } of optionalAddresses) {
      if (value && !base58Regex.test(value)) {
        return NextResponse.json(
          { success: false, error: `Invalid ${field} address format` },
          { status: 400 }
        );
      }
    }

    // Validate customFeeVaultClaimerSide if provided
    if (body.customFeeVaultClaimerSide !== undefined &&
      body.customFeeVaultClaimerSide !== null &&
      body.customFeeVaultClaimerSide !== 'A' &&
      body.customFeeVaultClaimerSide !== 'B') {
      return NextResponse.json(
        { success: false, error: 'customFeeVaultClaimerSide must be "A" or "B"' },
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

    // Call Bags API to get claim transactions

    const response = await fetch(
      `${BAGS_API_BASE}/token-launch/claim-txs/v2`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('[Claim API] Bags API error:', data);
      return NextResponse.json(
        {
          success: false,
          error: data.error || data.response?.[0]?.message || `Failed to generate claim transactions: ${response.statusText}`
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error generating claim transactions:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
