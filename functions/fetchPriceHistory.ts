import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const X1_RPC_ENDPOINT = 'https://rpc.mainnet.x1.xyz';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tokenAddress, timeframe } = await req.json();

    if (!tokenAddress) {
      return Response.json({ error: 'Token address required' }, { status: 400 });
    }

    // Fetch transaction signatures
    const limit = timeframe === '1d' ? 1000 : timeframe === '1h' ? 200 : 50;
    
    const response = await fetch(X1_RPC_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getSignaturesForAddress',
        params: [tokenAddress, { limit }]
      })
    });

    const data = await response.json();
    const signatures = data.result || [];

    // Parse transaction data to extract price points
    const priceData = [];
    for (const sig of signatures.slice(0, 50)) {
      try {
        const txResponse = await fetch(X1_RPC_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getTransaction',
            params: [sig.signature, { encoding: 'json' }]
          })
        });

        const txData = await txResponse.json();
        
        if (txData.result && txData.result.blockTime) {
          priceData.push({
            timestamp: txData.result.blockTime * 1000,
            price: Math.random() * 0.1, // Placeholder - replace with actual price extraction
            volume: Math.random() * 1000
          });
        }
      } catch (err) {
        console.error('Error fetching tx:', err);
      }
    }

    return Response.json({ priceData });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});