import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const X1_RPC_ENDPOINT = 'https://rpc.mainnet.x1.xyz';

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

    // Fetch account info from X1
    const accountResponse = await fetch(X1_RPC_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getAccountInfo',
        params: [tokenAddress, { encoding: 'base64' }]
      })
    });

    const accountData = await accountResponse.json();

    // Fetch token supply
    const supplyResponse = await fetch(X1_RPC_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTokenSupply',
        params: [tokenAddress]
      })
    });

    const supplyData = await supplyResponse.json();

    // Fetch recent transactions for price/volume calculation
    const signaturesResponse = await fetch(X1_RPC_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getSignaturesForAddress',
        params: [tokenAddress, { limit: 100 }]
      })
    });

    const signatures = await signaturesResponse.json();

    return Response.json({
      account: accountData.result,
      supply: supplyData.result,
      recentTransactions: signatures.result || []
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});