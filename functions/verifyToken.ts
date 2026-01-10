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
    
    // Perform advanced tax and buyback analysis
    let taxAnalysis = {
      hasBuyback: false,
      buybackWallet: null,
      taxesAreDynamic: false,
      maxBuyTax: 0,
      maxSellTax: 0,
      canChangeTaxes: false
    };

    try {
      // Call the advanced tax analysis function
      const advancedAnalysis = await base44.asServiceRole.functions.invoke('analyzeTaxAndBuyback', {
        mintAddress,
        tokenType: extensions && extensions.length > 0 ? 'TOKEN2022' : 'SPL'
      });

      if (advancedAnalysis.data) {
        taxAnalysis = {
          hasBuyback: advancedAnalysis.data.buybackConfidence !== 'low',
          buybackWallet: advancedAnalysis.data.buybackWallet,
          taxesAreDynamic: advancedAnalysis.data.taxType === 'dynamic',
          maxBuyTax: advancedAnalysis.data.buyTax || 0,
          maxSellTax: advancedAnalysis.data.sellTax || 0,
          canChangeTaxes: advancedAnalysis.data.taxAuthority !== 'none',
          buybackConfidence: advancedAnalysis.data.buybackConfidence,
          taxRiskLevel: advancedAnalysis.data.taxRiskLevel,
          flags: advancedAnalysis.data.flags || []
        };
      }
    } catch (error) {
      console.error('Advanced tax analysis failed, using fallback:', error);
      // Fallback to basic detection
      if (token2022Features.transferHookProgram) {
        taxAnalysis.taxesAreDynamic = true;
        taxAnalysis.canChangeTaxes = true;
        taxAnalysis.maxBuyTax = 3;
        taxAnalysis.maxSellTax = 3;
      }
    }

    // Automated checks
    const decimals = tokenInfo.decimals || 0;
    const rawSupply = parseInt(tokenInfo.supply || 0);
    const actualSupply = rawSupply / Math.pow(10, decimals);
    
    const checks = {
      programType: extensions && extensions.length > 0 ? 'Token-2022' : 'SPL Token',
      mintAuthorityRevoked: !tokenInfo.mintAuthority,
      freezeAuthorityRevoked: !tokenInfo.freezeAuthority,
      totalSupply: actualSupply,
      decimals: decimals,
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
      
      // Liquidity - check via XDEX API
      hasLiquidity: false,
      lpStatus: 'checking',
      lockDuration: 'N/A',
      liquidityPools: [],
      totalLiquidity: 0
    };

    // Fetch XDEX liquidity data
    try {
      const xdexResponse = await fetch(`https://app.xdex.xyz/api/liquidity/${mintAddress}`);
      if (xdexResponse.ok) {
        const xdexData = await xdexResponse.json();
        if (xdexData.pools && xdexData.pools.length > 0) {
          checks.hasLiquidity = true;
          checks.lpStatus = 'xdex';
          checks.liquidityPools = xdexData.pools;
          checks.totalLiquidity = xdexData.totalTVL || 0;
        }
      }
    } catch (xdexError) {
      console.log('XDEX API check failed, trying on-chain detection');
      
      // Fallback: Check for DEX program interactions on-chain
      try {
        const signatures = await rpcCall('getSignaturesForAddress', [mintAddress, { limit: 100 }]);
        const knownDexPrograms = [
          'DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1',
          'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
          'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX'
        ];
        
        for (const sig of signatures.slice(0, 50)) {
          try {
            const tx = await rpcCall('getTransaction', [sig.signature, { maxSupportedTransactionVersion: 0 }]);
            if (tx && tx.transaction) {
              const accounts = tx.transaction.message.accountKeys || [];
              const involvesDex = accounts.some(acc => knownDexPrograms.includes(acc));
              
              if (involvesDex) {
                checks.hasLiquidity = true;
                checks.lpStatus = 'on-chain-detected';
                break;
              }
            }
          } catch (txError) {
            continue;
          }
        }
      } catch (onChainError) {
        console.log('On-chain liquidity detection failed');
      }
    };

    // Calculate risk score
    const { score: riskScore, warnings } = calculateRiskScore(checks);
    const status = determineStatus(riskScore);

    // AI-Powered Risk Analysis
    let aiAnalysis = null;
    try {
      const analysisPrompt = `Analyze this token on X1 blockchain and provide a comprehensive risk assessment:
      
Token Details:
- Mint Authority: ${checks.mintAuthorityRevoked ? 'Revoked ✓' : 'Active ⚠️'}
- Freeze Authority: ${checks.freezeAuthorityRevoked ? 'Revoked ✓' : 'Active ⚠️'}
- Token Type: ${checks.programType}
- Buy Tax: ${checks.buyTax}%
- Sell Tax: ${checks.sellTax}%
- Transfer Hook: ${checks.hasTransferHook ? 'Yes' : 'No'}
- Permanent Delegate: ${checks.hasPermanentDelegate ? 'Yes' : 'No'}
- Dynamic Taxes: ${checks.taxesAreDynamic ? 'Yes' : 'No'}
- Supply Mintable: ${checks.isMintable ? 'Yes' : 'No'}
- Liquidity Status: ${checks.lpStatus}
- Risk Score: ${riskScore}/100

Provide:
1. A brief summary (2-3 sentences) of the overall risk profile
2. 3-5 key risk factors based on contract complexity, tokenomics, and authority controls
3. A recommendation for investors (proceed with caution, avoid, or relatively safe)

Return as JSON with: summary, riskFactors (array), recommendation`;

      const aiResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: analysisPrompt,
        response_json_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            riskFactors: { type: 'array', items: { type: 'string' } },
            recommendation: { type: 'string' }
          }
        }
      });

      aiAnalysis = aiResult;
    } catch (error) {
      console.error('AI analysis failed:', error);
    }

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
      aiAnalysis,
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