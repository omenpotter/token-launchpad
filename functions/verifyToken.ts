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
    
    const info = accountInfo?.value?.data?.parsed?.info || null;
    const extensions = accountInfo?.value?.data?.parsed?.info?.extensions || [];
    
    return { info, extensions, raw: accountInfo };
  } catch (error) {
    console.error('Error fetching token info:', error);
    return null;
  }
}

async function detectToken2022Features(extensions, mintAddress) {
  const features = {
    hasTransferHook: false,
    transferHookProgram: null,
    hasTransferFee: false,
    transferFeeConfig: null,
    hasInterestBearing: false,
    hasPermanentDelegate: false,
    permanentDelegate: null,
    hasMetadataPointer: false,
    hasGroupPointer: false,
    hasMemberPointer: false
  };

  if (!extensions || extensions.length === 0) return features;

  for (const ext of extensions) {
    const extType = ext.extension || ext.type;
    
    if (extType === 'transferHook') {
      features.hasTransferHook = true;
      features.transferHookProgram = ext.state?.programId || ext.programId;
    }
    if (extType === 'transferFeeConfig') {
      features.hasTransferFee = true;
      features.transferFeeConfig = ext.state;
    }
    if (extType === 'interestBearingConfig') {
      features.hasInterestBearing = true;
    }
    if (extType === 'permanentDelegate') {
      features.hasPermanentDelegate = true;
      features.permanentDelegate = ext.state?.delegate || ext.delegate;
    }
    if (extType === 'metadataPointer') {
      features.hasMetadataPointer = true;
    }
    if (extType === 'groupPointer') {
      features.hasGroupPointer = true;
    }
    if (extType === 'memberPointer') {
      features.hasMemberPointer = true;
    }
  }

  return features;
}

async function detectBuybackAndTaxes(mintAddress, transferHookProgram) {
  // Placeholder for advanced detection - would need to analyze transfer hook program code
  const analysis = {
    hasBuyback: false,
    buybackWallet: null,
    taxesAreDynamic: false,
    maxBuyTax: 0,
    maxSellTax: 0,
    canChangeTaxes: false
  };

  // If transfer hook exists, there's potential for dynamic behavior
  if (transferHookProgram) {
    analysis.taxesAreDynamic = true;
    analysis.canChangeTaxes = true;
    analysis.maxBuyTax = 3; // Default assumption for safety
    analysis.maxSellTax = 3;
  }

  return analysis;
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

  // Token-2022 specific risks
  if (checks.hasTransferHook) {
    score += 20;
    warnings.push('Transfer hook detected - custom logic can be executed on every transfer');
  }

  if (checks.hasPermanentDelegate) {
    score += 25;
    warnings.push('Permanent delegate detected - can control token transfers');
  }

  if (checks.taxesAreDynamic || checks.canChangeTaxes) {
    score += 15;
    warnings.push('Taxes can be changed dynamically by the contract');
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
    const tokenData = await getTokenInfo(mintAddress);

    if (!tokenData || !tokenData.info) {
      return Response.json({ 
        error: 'Token not found on X1 Mainnet' 
      }, { status: 404 });
    }

    const tokenInfo = tokenData.info;
    const extensions = tokenData.extensions;

    // Detect Token-2022 features
    const token2022Features = await detectToken2022Features(extensions, mintAddress);
    
    // Detect buyback and dynamic taxes
    const taxAnalysis = await detectBuybackAndTaxes(
      mintAddress, 
      token2022Features.transferHookProgram
    );

    // Automated checks
    const checks = {
      programType: extensions && extensions.length > 0 ? 'Token-2022' : 'SPL Token',
      mintAuthorityRevoked: !tokenInfo.mintAuthority,
      freezeAuthorityRevoked: !tokenInfo.freezeAuthority,
      totalSupply: parseInt(tokenInfo.supply || 0),
      decimals: tokenInfo.decimals || 0,
      isMintable: !!tokenInfo.mintAuthority,
      supplyRisk: !!tokenInfo.mintAuthority,
      
      // Token-2022 Features
      hasTransferHook: token2022Features.hasTransferHook,
      transferHookProgram: token2022Features.transferHookProgram,
      hasTransferFee: token2022Features.hasTransferFee,
      hasPermanentDelegate: token2022Features.hasPermanentDelegate,
      permanentDelegate: token2022Features.permanentDelegate,
      
      // Tokenomics
      buyTax: taxAnalysis.maxBuyTax,
      sellTax: taxAnalysis.maxSellTax,
      hasBurnMechanism: false,
      hasBuyback: taxAnalysis.hasBuyback,
      taxesAreDynamic: taxAnalysis.taxesAreDynamic,
      canChangeTaxes: taxAnalysis.canChangeTaxes,
      
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