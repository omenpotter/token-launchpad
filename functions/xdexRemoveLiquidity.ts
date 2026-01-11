import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { poolAddress, lpTokenAmount, percentage, walletAddress } = await req.json();

    if (!poolAddress || (!lpTokenAmount && !percentage) || !walletAddress) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // xDEX API configuration
    const XDEX_API_URL = 'https://api.xdex.xyz';
    const XDEX_CHAIN_ID = 'x1-mainnet';

    console.log('[xDEX] Removing liquidity', { poolAddress, lpTokenAmount, percentage, walletAddress });

    // Prepare remove liquidity parameters
    const removeParams = {
      chainId: XDEX_CHAIN_ID,
      poolAddress: poolAddress,
      lpTokenAmount: lpTokenAmount,
      percentage: percentage,
      walletAddress: walletAddress,
      slippageTolerance: 1.0 // 1% slippage
    };

    // Call xDEX API to remove liquidity
    const response = await fetch(`${XDEX_API_URL}/liquidity/remove`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(removeParams)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`xDEX API error: ${error}`);
    }

    const result = await response.json();

    console.log('[xDEX] Liquidity removed successfully', result);

    return Response.json({
      success: true,
      txHash: result.txHash || 'pending',
      tokenAReceived: result.tokenAReceived,
      tokenBReceived: result.tokenBReceived,
      message: `Removed ${percentage}% of liquidity successfully via xDEX`
    });

  } catch (error) {
    console.error('[xDEX] Remove liquidity error:', error);
    return Response.json({ 
      error: error.message,
      details: 'Failed to remove liquidity via xDEX. Please check your LP tokens and try again.'
    }, { status: 500 });
  }
});