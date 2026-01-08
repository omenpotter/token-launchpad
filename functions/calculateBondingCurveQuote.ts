import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, isBuy, virtualSolReserves, virtualTokenReserves, decimals, slippage } = await req.json();

    if (!amount || virtualSolReserves === undefined || virtualTokenReserves === undefined) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Constant Product Formula: x * y = k
    const k = virtualSolReserves * virtualTokenReserves;

    let output = 0;
    let priceImpact = 0;

    if (isBuy) {
      // Buying tokens with SOL
      const solIn = amount * 1e9; // Convert to lamports
      const tokensOut = virtualTokenReserves - (k / (virtualSolReserves + solIn));
      
      // Apply slippage tolerance
      output = (tokensOut * (1 - (slippage || 0.02))) / Math.pow(10, decimals || 9);
      
      // Calculate price impact
      priceImpact = (solIn / virtualSolReserves) * 100;
    } else {
      // Selling tokens for SOL
      const tokenIn = amount * Math.pow(10, decimals || 9);
      const solOut = virtualSolReserves - (k / (virtualTokenReserves + tokenIn));
      
      // Apply slippage tolerance
      output = (solOut * (1 - (slippage || 0.02))) / 1e9;
      
      // Calculate price impact
      priceImpact = (tokenIn / virtualTokenReserves) * 100;
    }

    return Response.json({
      estimatedOutput: output,
      priceImpact: priceImpact.toFixed(2),
      minOutput: output * 0.98 // Additional 2% minimum output protection
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});