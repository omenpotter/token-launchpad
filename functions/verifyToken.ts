import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// X1 Mainnet RPC endpoints with authentication
const X1_RPC_ENDPOINTS = [
  'https://rpc.mainnet.x1.xyz',
  'https://nexus.fortiblox.com/rpc',
  'https://rpc.owlnet.dev/?api-key=3a792cc7c3df79f2e7bc929757b47c38',
  'https://rpc.x1galaxy.io/'
];

const RPC_AUTH = {
  'https://nexus.fortiblox.com/rpc': {
    'X-API-Key': 'pb_live_7d62cd095391ffd14daca14f2f739b06cac5fd182ca48aed9e2b106ba920c6b0',
    'Authorization': 'Bearer fbx_d4a25e545366fed1ea1582884e62874d6b9fdf94d1f6c4b9889fefa951300dff'
  }
};

async function rpcCall(method, params = []) {
  for (const endpoint of X1_RPC_ENDPOINTS) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(RPC_AUTH[endpoint] || {})
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method,
          params
        })
      });

      const data = await response.json();
      if (data.result) return data.result;
    } catch (error) {
      continue;
    }
  }
  throw new Error('All RPC endpoints failed');
}

async function getTokenInfo(mintAddress) {
  try {
    const accountInfo = await rpcCall('getAccountInfo', [
      mintAddress,
      { encoding: 'jsonParsed' }
    ]);
    
    return accountInfo?.value?.data?.parsed?.info || null;
  } catch (error) {
    console.error('Error fetching token info:', error);
    return null;
  }
}

function calculateRiskScore(checks) {
  let score = 0;
  const warnings = [];

  // Mint authority check (high risk if active)
  if (!checks.mintAuthorityRevoked) {
    score += 30;
    warnings.push('Mint authority is still active - new tokens can be created');
  }

  // Freeze authority check (medium risk)
  if (!checks.freezeAuthorityRevoked) {
    score += 15;
    warnings.push('Freeze authority is active - accounts can be frozen');
  }

  // Tax checks (medium risk if high)
  if (checks.buyTax > 5) {
    score += 10;
    warnings.push(`High buy tax: ${checks.buyTax}%`);
  }
  if (checks.sellTax > 5) {
    score += 10;
    warnings.push(`High sell tax: ${checks.sellTax}%`);
  }

  // Supply checks
  if (checks.isMintable) {
    score += 10;
    warnings.push('Token supply can still be increased');
  }

  // Liquidity checks (high risk if no liquidity)
  if (!checks.hasLiquidity) {
    score += 25;
    warnings.push('No liquidity pool detected');
  } else if (checks.lpStatus === 'unlocked') {
    score += 15;
    warnings.push('Liquidity is not locked');
  }

  return { score: Math.min(score, 100), warnings };
}

function determineStatus(riskScore) {
  if (riskScore <= 20) return 'auto_verified';
  if (riskScore <= 50) return 'auto_verified';
  if (riskScore <= 80) return 'risky';
  return 'flagged';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mintAddress, network } = await req.json();

    if (!mintAddress || network !== 'x1Mainnet') {
      return Response.json({ 
        error: 'Invalid parameters. Mint address and x1Mainnet network required' 
      }, { status: 400 });
    }

    // Fetch token info from X1 chain
    const tokenInfo = await getTokenInfo(mintAddress);

    if (!tokenInfo) {
      return Response.json({ 
        error: 'Token not found on X1 Mainnet' 
      }, { status: 404 });
    }

    // Automated checks
    const checks = {
      programType: tokenInfo.extensions ? 'Token-2022' : 'SPL Token',
      mintAuthorityRevoked: !tokenInfo.mintAuthority,
      freezeAuthorityRevoked: !tokenInfo.freezeAuthority,
      totalSupply: parseInt(tokenInfo.supply || 0),
      decimals: tokenInfo.decimals || 0,
      isMintable: !!tokenInfo.mintAuthority,
      supplyRisk: !!tokenInfo.mintAuthority,
      
      // Tokenomics (placeholder - would need transfer hook analysis)
      buyTax: 0,
      sellTax: 0,
      hasBurnMechanism: false,
      
      // Liquidity (placeholder - would need DEX analysis)
      hasLiquidity: false,
      lpStatus: 'unknown',
      lockDuration: 'N/A'
    };

    // Calculate risk score
    const { score: riskScore, warnings } = calculateRiskScore(checks);
    const status = determineStatus(riskScore);

    // Store verification in database
    try {
      await base44.asServiceRole.entities.Token.create({
        mint: mintAddress,
        network: 'x1Mainnet',
        name: 'Verified Token',
        symbol: 'VERIFY',
        verificationStatus: status,
        riskScore,
        verifiedAt: new Date().toISOString(),
        creator: user.email
      });
    } catch (dbError) {
      console.log('Token may already exist in database');
    }

    return Response.json({
      mintAddress,
      name: 'Token', // Would fetch from metadata
      symbol: 'TKN', // Would fetch from metadata
      status,
      riskScore,
      checks,
      warnings,
      verifiedAt: new Date().toISOString(),
      network: 'x1Mainnet'
    });

  } catch (error) {
    console.error('Verification error:', error);
    return Response.json({ 
      error: 'Verification failed: ' + error.message 
    }, { status: 500 });
  }
});