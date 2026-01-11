import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tokenMint, tokenAmount, xntAmount, walletAddress, lockPeriod } = await req.json();

    if (!tokenMint || !tokenAmount || !xntAmount || !walletAddress) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // xDEX API configuration
    const XDEX_API_URL = 'https://api.xdex.xyz';
    const XDEX_CHAIN_ID = 'x1-mainnet';

    console.log('[xDEX] Adding liquidity', { tokenMint, tokenAmount, xntAmount, walletAddress });

    // Prepare liquidity pool parameters
    const liquidityParams = {
      chainId: XDEX_CHAIN_ID,
      tokenA: tokenMint,
      tokenB: 'native', // XNT
      amountA: tokenAmount,
      amountB: xntAmount,
      walletAddress: walletAddress,
      lockPeriod: lockPeriod || 0,
      slippageTolerance: 1.0 // 1% slippage
    };

    // Call xDEX API to add liquidity
    const response = await fetch(`${XDEX_API_URL}/liquidity/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(liquidityParams)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`xDEX API error: ${error}`);
    }

    const result = await response.json();

    console.log('[xDEX] Liquidity added successfully', result);

    return Response.json({
      success: true,
      txHash: result.txHash || 'pending',
      poolAddress: result.poolAddress,
      lpTokens: result.lpTokens,
      message: 'Liquidity added successfully via xDEX'
    });

  } catch (error) {
    console.error('[xDEX] Add liquidity error:', error);
    return Response.json({ 
      error: error.message,
      details: 'Failed to add liquidity via xDEX. Please check your token balance and try again.'
    }, { status: 500 });
  }
});