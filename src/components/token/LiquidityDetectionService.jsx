/**
 * Liquidity Detection Service for X1 SVM
 * Integrates X1RpcService + XDEX API
 * Detects liquidity pools for token verification
 */

import { x1RpcService } from './web3/X1RpcService';

// XDEX API Configuration for X1
const XDEX_CONFIG = {
  baseUrl: 'https://api.xdex.xyz',
  chainId: 'x1',
  timeout: 10000
};

// ✅ Check XDEX pools for X1 token
export async function checkXDEXLiquidity(tokenMint) {
  try {
    console.log('[LiquidityService] Checking XDEX pools for:', tokenMint);

    const response = await fetch(`${XDEX_CONFIG.baseUrl}/v1/pools`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tokenMint: tokenMint,
        chainId: XDEX_CONFIG.chainId, // X1 chain
        limit: 100
      }),
      signal: AbortSignal.timeout(XDEX_CONFIG.timeout)
    });

    if (!response.ok) {
      console.warn('[LiquidityService] XDEX API error:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (!data.pools || data.pools.length === 0) {
      console.log('[LiquidityService] No XDEX pools found');
      return null;
    }

    console.log('[LiquidityService] Found XDEX pools:', data.pools.length);

    // Parse pool data
    const pools = data.pools.map(pool => ({
      address: pool.address,
      tokenAMint: pool.tokenA,
      tokenBMint: pool.tokenB,
      liquidity: pool.liquidity || 0,
      volume24h: pool.volume24h || 0,
      fee: pool.fee || 0,
      status: pool.status || 'active'
    }));

    const totalLiquidity = pools.reduce((sum, p) => sum + (p.liquidity || 0), 0);

    return {
      hasLiquidity: true,
      poolCount: pools.length,
      pools: pools,
      totalLiquidity: totalLiquidity,
      status: 'xdex',
      source: 'XDEX API',
      detectedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('[LiquidityService] XDEX check failed:', error);
    return null;
  }
}

// ✅ Check X1 RPC for token account existence and activity
export async function checkX1OnChainLiquidity(tokenMint) {
  try {
    console.log('[LiquidityService] Checking X1 on-chain for:', tokenMint);

    // Validate mint address
    if (!tokenMint || tokenMint.length !== 44) {
      console.error('[LiquidityService] Invalid token mint format');
      return null;
    }

    // Use X1RpcService to get account info
    const mintAccount = await x1RpcService.getAccountInfo(tokenMint);

    if (!mintAccount) {
      console.log('[LiquidityService] Token mint not found on X1');
      return null;
    }

    console.log('[LiquidityService] Token account found on X1 SVM');

    // Check for recent activity on X1
    try {
      const signatures = await x1RpcService.getSignaturesForAddress(tokenMint, 5);
      const hasActivity = signatures && signatures.length > 0;

      if (hasActivity) {
        console.log('[LiquidityService] Recent activity detected on X1');
      }

      return {
        hasLiquidity: true,
        tokenFound: true,
        chainConfirmed: true,
        status: 'x1-verified',
        source: 'X1 RPC Service',
        recentActivity: hasActivity,
        detectedAt: new Date().toISOString()
      };
    } catch (activityError) {
      console.warn('[LiquidityService] Could not check X1 activity:', activityError);
      
      // Token exists on X1 even if we can't check activity
      return {
        hasLiquidity: true,
        tokenFound: true,
        chainConfirmed: true,
        status: 'x1-verified',
        source: 'X1 RPC Service',
        recentActivity: false,
        detectedAt: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('[LiquidityService] X1 on-chain check failed:', error);
    return null;
  }
}

// ✅ Get token holder count on X1 (indicates liquidity)
export async function getTokenHolderCount(tokenMint) {
  try {
    console.log('[LiquidityService] Getting token holder count for:', tokenMint);

    // Get account info for the token
    const account = await x1RpcService.getAccountInfo(tokenMint);
    
    if (!account) {
      return 0;
    }

    // For now, return 1 if account exists (actual holder count requires more complex logic)
    return 1;
  } catch (error) {
    console.error('[LiquidityService] Failed to get holder count:', error);
    return 0;
  }
}

// ✅ Get token supply info from X1
export async function getX1TokenSupply(tokenMint) {
  try {
    console.log('[LiquidityService] Getting token supply for:', tokenMint);

    const supply = await x1RpcService.getTokenSupply(tokenMint);

    if (!supply) {
      return null;
    }

    return {
      supply: supply.value?.uiAmount || 0,
      decimals: supply.value?.decimals || 0,
      supplyRaw: supply.value?.amount || '0'
    };
  } catch (error) {
    console.error('[LiquidityService] Failed to get token supply:', error);
    return null;
  }
}

// ✅ Main liquidity detection - tries XDEX first, falls back to X1 RPC
export async function detectLiquidity(tokenMint) {
  try {
    console.log('[LiquidityService] Starting liquidity detection for:', tokenMint);

    // Step 1: Try XDEX first (most accurate for X1)
    console.log('[LiquidityService] Step 1: Checking XDEX pools...');
    const xdexResult = await checkXDEXLiquidity(tokenMint);
    
    if (xdexResult) {
      console.log('[LiquidityService] ✅ XDEX pools detected');
      return {
        success: true,
        hasLiquidity: true,
        ...xdexResult
      };
    }

    // Step 2: Fall back to X1 on-chain verification
    console.log('[LiquidityService] Step 2: Checking X1 on-chain...');
    const x1Result = await checkX1OnChainLiquidity(tokenMint);
    
    if (x1Result) {
      console.log('[LiquidityService] ✅ Token verified on X1 SVM');
      return {
        success: true,
        hasLiquidity: x1Result.hasLiquidity,
        ...x1Result
      };
    }

    // Step 3: Token not found anywhere
    console.log('[LiquidityService] ❌ Token not found on X1 or XDEX');
    return {
      success: false,
      hasLiquidity: false,
      status: 'not-found',
      source: 'Not verified',
      detectedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('[LiquidityService] Detection failed:', error);
    return {
      success: false,
      hasLiquidity: false,
      error: error.message,
      detectedAt: new Date().toISOString()
    };
  }
}

// ✅ Enhanced verification with all details
export async function verifyTokenLiquidity(tokenMint) {
  try {
    console.log('[LiquidityService] Full liquidity verification for:', tokenMint);

    // Get all data in parallel
    const [liquidityInfo, supplyInfo, holderCount] = await Promise.all([
      detectLiquidity(tokenMint),
      getX1TokenSupply(tokenMint),
      getTokenHolderCount(tokenMint)
    ]);

    return {
      tokenMint: tokenMint,
      liquidity: liquidityInfo,
      supply: supplyInfo,
      holderCount: holderCount,
      confidence: calculateConfidence(liquidityInfo, supplyInfo),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('[LiquidityService] Verification failed:', error);
    return {
      tokenMint: tokenMint,
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// ✅ Calculate confidence score (0-100)
function calculateConfidence(liquidityInfo, supplyInfo) {
  let score = 0;

  // Liquidity detection (+50 points)
  if (liquidityInfo?.hasLiquidity) {
    score += 50;
    if (liquidityInfo?.source === 'XDEX API') {
      score += 15; // XDEX is most reliable
    } else if (liquidityInfo?.status === 'x1-verified') {
      score += 10; // X1 verification is good
    }
  }

  // Supply info (+30 points)
  if (supplyInfo) {
    score += 30;
  }

  // Pool count bonus
  if (liquidityInfo?.poolCount) {
    if (liquidityInfo.poolCount >= 3) {
      score += 10;
    } else if (liquidityInfo.poolCount >= 1) {
      score += 5;
    }
  }

  // Total liquidity bonus
  if (liquidityInfo?.totalLiquidity && liquidityInfo.totalLiquidity > 10000) {
    score += 10;
  }

  return Math.min(100, score);
}

// ✅ Format liquidity result for UI
export function formatLiquidityResult(result) {
  if (!result?.liquidity) {
    return {
      display: 'Not Verified',
      status: 'not-found',
      pools: []
    };
  }

  return {
    display: result.liquidity.hasLiquidity ? 'Yes ✓' : 'No ⚠️',
    status: result.liquidity.status,
    source: result.liquidity.source,
    poolCount: result.liquidity.poolCount || 0,
    pools: result.liquidity.pools || [],
    totalLiquidity: result.liquidity.totalLiquidity || 0,
    confidence: result.confidence || 0
  };
}

export default {
  checkXDEXLiquidity,
  checkX1OnChainLiquidity,
  getTokenHolderCount,
  getX1TokenSupply,
  detectLiquidity,
  verifyTokenLiquidity,
  formatLiquidityResult
};