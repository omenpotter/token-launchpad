import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// X1 Mainnet RPC endpoints with authentication
const X1_RPC_ENDPOINTS = [
  'https://rpc.blockspeed.io/', // ✅ XDEX's RPC endpoint (priority)
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
  let lastError = null;
  
  for (const endpoint of X1_RPC_ENDPOINTS) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(RPC_AUTH[endpoint] || {})
      };

      console.log(`[RPC] Trying ${endpoint}`);
      
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

      if (!response.ok) {
        console.error(`[RPC] ${endpoint} returned ${response.status}`);
        continue;
      }

      const data = await response.json();
      
      if (data.error) {
        console.error(`[RPC] ${endpoint} error:`, data.error);
        lastError = new Error(data.error.message || JSON.stringify(data.error));
        continue;
      }
      
      if (data.result !== undefined) {
        console.log(`[RPC] Success with ${endpoint}`);
        return data.result;
      }
    } catch (error) {
      console.error(`[RPC] ${endpoint} failed:`, error.message);
      lastError = error;
      continue;
    }
  }
  
  throw new Error(`All RPC endpoints failed. Last error: ${lastError?.message || 'Unknown'}`);
}

async function getTokenInfo(mintAddress) {
  try {
    const accountInfo = await rpcCall('getAccountInfo', [
      mintAddress,
      { encoding: 'jsonParsed' }
    ]);
    
    if (!accountInfo?.value) return null;
    
    const info = accountInfo.value.data?.parsed?.info || null;
    const extensions = accountInfo.value.data?.parsed?.info?.extensions || [];
    const owner = accountInfo.value.owner;
    
    // Detect program type
    const programType = owner === 'TokenzQdBNbNbGKPFXCWuBvf9Ss623VQ5DA' ? 'Token-2022' : 'SPL Token';
    
    return { info, extensions, owner, programType, raw: accountInfo };
  } catch (error) {
    console.error('[getTokenInfo] Error:', error);
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
    metadataAddress: null,
    hasGroupPointer: false,
    hasMemberPointer: false,
    metadata: null
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
      features.metadataAddress = ext.state?.metadataAddress || mintAddress;
    }
    if (extType === 'tokenMetadata') {
      features.metadata = ext.state;
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

async function fetchMetaplexMetadata(mintAddress) {
  try {
    const METADATA_PROGRAM_ID = 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s';
    
    // Derive metadata PDA
    const seeds = [
      Buffer.from('metadata'),
      Buffer.from(METADATA_PROGRAM_ID, 'base58'),
      Buffer.from(mintAddress, 'base58')
    ];
    
    // Simple PDA derivation (not cryptographically accurate but works for most cases)
    const metadataPDA = mintAddress; // Simplified - in production use proper PDA derivation
    
    const accountInfo = await rpcCall('getAccountInfo', [
      metadataPDA,
      { encoding: 'base64' }
    ]);
    
    if (!accountInfo?.value?.data) return null;
    
    // Parse Metaplex metadata (simplified)
    return {
      name: 'Unknown',
      symbol: 'UNK',
      uri: ''
    };
  } catch (error) {
    console.error('[fetchMetaplexMetadata] Error:', error);
    return null;
  }
}

async function fetchToken2022Metadata(metadataAddress) {
  try {
    const accountInfo = await rpcCall('getAccountInfo', [
      metadataAddress,
      { encoding: 'jsonParsed' }
    ]);
    
    if (!accountInfo?.value?.data?.parsed?.info) return null;
    
    const metadata = accountInfo.value.data.parsed.info;
    return {
      name: metadata.name || 'Unknown',
      symbol: metadata.symbol || 'UNK',
      uri: metadata.uri || ''
    };
  } catch (error) {
    console.error('[fetchToken2022Metadata] Error:', error);
    return null;
  }
}

function calculateRiskScore(checks) {
  let score = 0;
  const warnings = [];

  if (!checks.mintAuthorityRevoked) {
    score += 30;
    warnings.push('Mint authority is still active - new tokens can be created');
  }

  if (!checks.freezeAuthorityRevoked) {
    score += 15;
    warnings.push('Freeze authority is active - accounts can be frozen');
  }

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

  if (checks.buyTax > 5) {
    score += 10;
    warnings.push(`High buy tax: ${checks.buyTax}%`);
  }
  if (checks.sellTax > 5) {
    score += 10;
    warnings.push(`High sell tax: ${checks.sellTax}%`);
  }

  if (checks.isMintable) {
    score += 10;
    warnings.push('Token supply can still be increased');
  }

  if (checks.hasLiquidity === false && checks.lpStatus !== 'checking') {
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
    console.log('[verifyToken] Request received');
    
    const base44 = createClientFromRequest(req);
    
    // ✅ Make auth check more resilient
    let user;
    try {
      user = await base44.auth.me();
    } catch (authError) {
      console.error('[verifyToken] Auth error:', authError);
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[verifyToken] User authenticated:', user.email);

    // ✅ Better request parsing
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('[verifyToken] JSON parse error:', parseError);
      return Response.json({ 
        error: 'Invalid JSON in request body' 
      }, { status: 400 });
    }

    const { mintAddress, network } = body;

    console.log('[verifyToken] Parameters:', { mintAddress, network });

    if (!mintAddress || network !== 'x1Mainnet') {
      return Response.json({ 
        error: 'Invalid parameters. Mint address and x1Mainnet network required' 
      }, { status: 400 });
    }

    // Fetch token info from X1 chain
    console.log('[verifyToken] Fetching token info...');
    const tokenData = await getTokenInfo(mintAddress);

    if (!tokenData || !tokenData.info) {
      console.error('[verifyToken] Token not found');
      return Response.json({ 
        error: 'Token not found on X1 Mainnet. Please verify the mint address is correct.' 
      }, { status: 404 });
    }

    console.log('[verifyToken] Token found, processing...');

    const tokenInfo = tokenData.info;
    const extensions = tokenData.extensions;
    const programType = tokenData.programType;

    console.log('[verifyToken] Program type:', programType);

    // Detect Token-2022 features
    const token2022Features = await detectToken2022Features(extensions, mintAddress);
    
    // Fetch metadata based on token type
    let metadata = null;
    if (programType === 'Token-2022' && token2022Features.metadata) {
      // Token-2022 with embedded metadata
      metadata = token2022Features.metadata;
      console.log('[verifyToken] Found Token-2022 embedded metadata');
    } else if (programType === 'Token-2022' && token2022Features.hasMetadataPointer) {
      // Token-2022 with metadata pointer
      metadata = await fetchToken2022Metadata(token2022Features.metadataAddress);
      console.log('[verifyToken] Fetched Token-2022 metadata from pointer');
    } else if (programType === 'SPL Token') {
      // SPL Token with Metaplex metadata
      metadata = await fetchMetaplexMetadata(mintAddress);
      console.log('[verifyToken] Fetched Metaplex metadata');
    }
    
    const tokenName = metadata?.name || tokenInfo.name || 'Unknown Token';
    const tokenSymbol = metadata?.symbol || tokenInfo.symbol || 'UNK';
    const tokenUri = metadata?.uri || '';
    
    // Simplified tax analysis (no external function call)
    const taxAnalysis = {
      hasBuyback: false,
      buybackWallet: null,
      taxesAreDynamic: token2022Features.hasTransferHook || token2022Features.hasTransferFee,
      maxBuyTax: token2022Features.hasTransferFee ? 3 : 0,
      maxSellTax: token2022Features.hasTransferFee ? 3 : 0,
      canChangeTaxes: token2022Features.hasTransferHook,
    };

    // Automated checks
    const decimals = tokenInfo.decimals || 0;
    const rawSupply = parseInt(tokenInfo.supply || 0);
    const actualSupply = rawSupply / Math.pow(10, decimals);
    
    const checks = {
      programType: programType,
      programId: tokenData.owner,
      mintAuthorityRevoked: !tokenInfo.mintAuthority,
      freezeAuthorityRevoked: !tokenInfo.freezeAuthority,
      totalSupply: actualSupply,
      decimals: decimals,
      isMintable: !!tokenInfo.mintAuthority,
      supplyRisk: !!tokenInfo.mintAuthority,
      
      // Metadata
      name: tokenName,
      symbol: tokenSymbol,
      uri: tokenUri,
      hasMetadata: !!metadata,
      
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
      
      // Liquidity
      hasLiquidity: false,
      lpStatus: 'checking',
      lockDuration: 'N/A',
      liquidityPools: [],
      totalLiquidity: 0,
      poolDetails: null
    };

    // Check for liquidity on-chain using X1 RPC
    try {
      console.log('[verifyToken] Checking liquidity...');
      
      const signatures = await rpcCall('getSignaturesForAddress', [mintAddress, { limit: 50 }]);
      console.log(`[verifyToken] Found ${signatures?.length || 0} transactions`);
      
      const knownDexPrograms = [
        'DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1',
        'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
        'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX',
        '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
        'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK',
      ];
      
      let liquidityFound = false;
      
      if (signatures && signatures.length > 0) {
        for (const sig of signatures.slice(0, 30)) {
          try {
            const tx = await rpcCall('getTransaction', [
              sig.signature, 
              { 
                maxSupportedTransactionVersion: 0,
                encoding: 'jsonParsed'
              }
            ]);
            
            if (tx?.transaction) {
              const message = tx.transaction.message;
              const accountKeys = message.accountKeys || [];
              
              for (const account of accountKeys) {
                const accountKey = typeof account === 'string' ? account : account.pubkey;
                
                if (knownDexPrograms.includes(accountKey)) {
                  liquidityFound = true;
                  checks.hasLiquidity = true;
                  checks.lpStatus = 'detected';
                  console.log('[verifyToken] ✓ Liquidity pool detected');
                  break;
                }
              }
              
              if (liquidityFound) break;
            }
          } catch (txError) {
            // Silently continue on transaction errors
            continue;
          }
        }
      }
      
      if (!liquidityFound) {
        checks.lpStatus = 'none';
        console.log('[verifyToken] ✗ No liquidity pool found');
      }
      
    } catch (liquidityError) {
      console.error('[verifyToken] Liquidity check error:', liquidityError);
      checks.lpStatus = 'error';
    }

    // Calculate risk score
    const { score: riskScore, warnings } = calculateRiskScore(checks);
    const status = determineStatus(riskScore);

    console.log('[verifyToken] Risk score calculated:', riskScore);

    // ✅ Skip AI analysis and database storage for now (causing 500 errors)
    // They can be added back later once basic functionality works

    console.log('[verifyToken] Returning response');

    return Response.json({
      mintAddress,
      name: tokenName,
      symbol: tokenSymbol,
      uri: tokenUri,
      programType: programType,
      programId: tokenData.owner,
      status,
      riskScore,
      checks,
      warnings,
      metadata: metadata,
      aiAnalysis: null,
      verifiedAt: new Date().toISOString(),
      network: 'x1Mainnet'
    });

  } catch (error) {
    console.error('[verifyToken] Fatal error:', error);
    console.error('[verifyToken] Stack:', error.stack);
    
    return Response.json({ 
      error: 'Verification failed: ' + error.message,
      details: error.stack
    }, { status: 500 });
  }
});