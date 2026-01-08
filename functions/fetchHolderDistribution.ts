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

    // Fetch token accounts for this mint
    const response = await fetch(X1_RPC_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTokenLargestAccounts',
        params: [tokenAddress]
      })
    });

    const data = await response.json();
    const accounts = data.result?.value || [];

    // Calculate holder distribution
    const totalSupply = accounts.reduce((sum, acc) => sum + parseFloat(acc.amount), 0);
    
    const distribution = accounts.map(acc => ({
      address: acc.address,
      balance: parseFloat(acc.amount),
      percentage: (parseFloat(acc.amount) / totalSupply) * 100
    }));

    return Response.json({
      totalHolders: accounts.length,
      distribution: distribution.slice(0, 20), // Top 20 holders
      topHolderPercentage: distribution[0]?.percentage || 0
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});