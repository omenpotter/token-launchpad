import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tokenAddress } = await req.json();

    if (!tokenAddress) {
      return Response.json({ error: 'Token address required' }, { status: 400 });
    }

    // X1 Ninja API configuration
    const X1_NINJA_API = 'https://api.x1.ninja';

    console.log('[X1 Ninja] Fetching analytics for', tokenAddress);

    // Fetch token analytics from X1 Ninja
    const response = await fetch(`${X1_NINJA_API}/token/${tokenAddress}/analytics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      console.warn('[X1 Ninja] API returned error, using fallback data');
      // Return mock data as fallback
      return Response.json({
        success: true,
        analytics: {
          price: 0,
          priceChange24h: 0,
          volume24h: 0,
          liquidity: 0,
          marketCap: 0,
          holders: 0,
          transactions24h: 0,
          trades24h: 0,
          buys24h: 0,
          sells24h: 0,
          priceHistory: [],
          topHolders: []
        },
        source: 'fallback'
      });
    }

    const analytics = await response.json();

    console.log('[X1 Ninja] Analytics fetched successfully');

    return Response.json({
      success: true,
      analytics: {
        price: analytics.price || 0,
        priceChange24h: analytics.priceChange24h || 0,
        volume24h: analytics.volume24h || 0,
        liquidity: analytics.liquidity || 0,
        marketCap: analytics.marketCap || 0,
        holders: analytics.holders || 0,
        transactions24h: analytics.transactions24h || 0,
        trades24h: analytics.trades24h || 0,
        buys24h: analytics.buys24h || 0,
        sells24h: analytics.sells24h || 0,
        priceHistory: analytics.priceHistory || [],
        topHolders: analytics.topHolders || []
      },
      source: 'x1ninja'
    });

  } catch (error) {
    console.error('[X1 Ninja] Analytics fetch error:', error);
    // Return fallback data on error
    return Response.json({
      success: true,
      analytics: {
        price: 0,
        priceChange24h: 0,
        volume24h: 0,
        liquidity: 0,
        marketCap: 0,
        holders: 0,
        transactions24h: 0,
        trades24h: 0,
        buys24h: 0,
        sells24h: 0,
        priceHistory: [],
        topHolders: []
      },
      source: 'fallback',
      error: error.message
    });
  }
});