import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const X1_MAINNET_RPC = 'https://xolana.xen.network';
const BURN_ADDRESS = '1nc1nerator11111111111111111111111111111111';

// Tax thresholds for classification
const TAX_THRESHOLDS = {
  SPL: {
    buy: { acceptable: 3, risky: 6 },
    sell: { acceptable: 6, risky: 10 }
  },
  TOKEN2022: {
    buy: { acceptable: 5, risky: 8 },
    sell: { acceptable: 8, risky: 12 }
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { mintAddress, tokenType } = await req.json();

    if (!mintAddress) {
      return Response.json({ error: 'Mint address required' }, { status: 400 });
    }

    console.log(`[Tax Analysis] Starting for ${mintAddress}, type: ${tokenType}`);

    // 1. Fetch token account info
    const tokenInfo = await fetchTokenAccountInfo(mintAddress);
    if (!tokenInfo) {
      return Response.json({ error: 'Token not found' }, { status: 404 });
    }

    // 2. Detect Token-2022 features and transfer hooks
    const transferHookAnalysis = await analyzeTransferHook(mintAddress, tokenInfo.extensions);

    // 3. Analyze tax structure (fixed vs dynamic)
    const taxStructure = await analyzeTaxStructure(transferHookAnalysis);

    // 4. Detect buyback logic
    const buybackAnalysis = await detectBuybackLogic(
      mintAddress, 
      transferHookAnalysis.taxWallets
    );

    // 5. Calculate risk level
    const taxRiskLevel = calculateTaxRiskLevel(
      taxStructure.buyTax,
      taxStructure.sellTax,
      tokenType || tokenInfo.programType
    );

    // 6. Determine verification action
    const verificationAction = determineVerificationAction(
      taxStructure,
      taxRiskLevel,
      buybackAnalysis
    );

    // 7. Generate final output
    const result = {
      mintAddress,
      tokenType: tokenType || tokenInfo.programType,
      
      // Tax information
      buyTax: taxStructure.buyTax,
      sellTax: taxStructure.sellTax,
      taxType: taxStructure.taxType,
      taxAuthority: taxStructure.taxAuthority,
      taxWallets: transferHookAnalysis.taxWallets,
      
      // Transfer hook details
      hasTransferHook: transferHookAnalysis.hasTransferHook,
      transferHookProgram: transferHookAnalysis.transferHookProgram,
      transferHookUpgradeable: transferHookAnalysis.upgradeable,
      
      // Buyback analysis
      buybackConfidence: buybackAnalysis.confidence,
      buybackWallet: buybackAnalysis.buybackWallet,
      buybackProof: buybackAnalysis.proof,
      
      // Risk assessment
      taxRiskLevel,
      verificationAction,
      
      // Flags
      flags: generateFlags(taxStructure, taxRiskLevel, buybackAnalysis),
      
      // Monitoring
      requiresMonitoring: taxStructure.taxType === 'dynamic' || transferHookAnalysis.upgradeable,
      
      timestamp: new Date().toISOString()
    };

    console.log('[Tax Analysis] Complete:', result);
    return Response.json(result);

  } catch (error) {
    console.error('[Tax Analysis] Error:', error);
    return Response.json({ 
      error: 'Tax analysis failed: ' + error.message 
    }, { status: 500 });
  }
});

// ===== RPC CALLS =====

async function rpcCall(method, params) {
  const response = await fetch(X1_MAINNET_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params
    })
  });
  const data = await response.json();
  return data.result;
}

async function fetchTokenAccountInfo(mintAddress) {
  try {
    const accountInfo = await rpcCall('getAccountInfo', [
      mintAddress,
      { encoding: 'jsonParsed' }
    ]);
    
    if (!accountInfo?.value) return null;

    const info = accountInfo.value.data.parsed.info;
    const extensions = info.extensions || [];

    return {
      info,
      extensions,
      programType: extensions.length > 0 ? 'TOKEN2022' : 'SPL',
      raw: accountInfo
    };
  } catch (error) {
    console.error('Error fetching token info:', error);
    return null;
  }
}

async function fetchProgramAccount(programId) {
  try {
    const accountInfo = await rpcCall('getAccountInfo', [
      programId,
      { encoding: 'base64' }
    ]);
    return accountInfo;
  } catch (error) {
    console.error('Error fetching program account:', error);
    return null;
  }
}

async function fetchTransactionHistory(address, limit = 100) {
  try {
    const signatures = await rpcCall('getSignaturesForAddress', [
      address,
      { limit }
    ]);
    
    if (!signatures || signatures.length === 0) return [];

    const transactions = [];
    for (const sig of signatures.slice(0, 50)) {
      const tx = await rpcCall('getTransaction', [
        sig.signature,
        { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }
      ]);
      if (tx) transactions.push(tx);
    }
    
    return transactions;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}

// ===== TRANSFER HOOK ANALYSIS =====

async function analyzeTransferHook(mintAddress, extensions) {
  const analysis = {
    hasTransferHook: false,
    transferHookProgram: null,
    taxWallets: [],
    upgradeable: false,
    taxCalculationLogic: null
  };

  if (!extensions || extensions.length === 0) {
    return analysis;
  }

  // Find transfer hook extension
  const transferHookExt = extensions.find(
    ext => (ext.extension || ext.type) === 'transferHook'
  );

  if (!transferHookExt) {
    return analysis;
  }

  analysis.hasTransferHook = true;
  analysis.transferHookProgram = transferHookExt.state?.programId || transferHookExt.programId;

  console.log('[Transfer Hook] Found program:', analysis.transferHookProgram);

  // Fetch program account to check if upgradeable
  const programAccount = await fetchProgramAccount(analysis.transferHookProgram);
  if (programAccount) {
    // Check if program has upgrade authority
    analysis.upgradeable = programAccount.value?.owner !== '11111111111111111111111111111111';
  }

  // Analyze program instructions (heuristic-based)
  // In production, this would decompile the program or use verified patterns
  analysis.taxCalculationLogic = await analyzeTransferHookInstructions(
    analysis.transferHookProgram
  );

  // Extract tax wallets from recent transactions
  const txHistory = await fetchTransactionHistory(mintAddress, 50);
  analysis.taxWallets = extractTaxWalletsFromTransactions(txHistory);

  return analysis;
}

async function analyzeTransferHookInstructions(programId) {
  // This is a heuristic approach since we can't decompile on-chain
  // In production, this would use a verified program pattern database
  
  try {
    const programAccount = await fetchProgramAccount(programId);
    if (!programAccount?.value) {
      return { type: 'unknown', hasTaxLogic: false };
    }

    // Check program data size and patterns
    const dataLength = programAccount.value.data?.[0]?.length || 0;
    
    // Heuristic: Programs with tax logic are typically 5-50KB
    if (dataLength > 5000 && dataLength < 50000) {
      return {
        type: 'potential_tax',
        hasTaxLogic: true,
        dataSize: dataLength
      };
    }

    return { type: 'unknown', hasTaxLogic: false };
  } catch (error) {
    return { type: 'error', hasTaxLogic: false };
  }
}

function extractTaxWalletsFromTransactions(transactions) {
  const walletCounts = {};

  for (const tx of transactions) {
    if (!tx?.meta?.postTokenBalances) continue;

    const preBalances = tx.meta.preTokenBalances || [];
    const postBalances = tx.meta.postTokenBalances || [];

    // Find accounts that consistently receive small amounts (likely tax)
    for (const postBal of postBalances) {
      const preBal = preBalances.find(b => b.accountIndex === postBal.accountIndex);
      if (!preBal) continue;

      const change = (postBal.uiTokenAmount?.uiAmount || 0) - (preBal.uiTokenAmount?.uiAmount || 0);
      
      // Tax wallets receive small positive amounts
      if (change > 0 && change < 1000) {
        const owner = postBal.owner;
        walletCounts[owner] = (walletCounts[owner] || 0) + 1;
      }
    }
  }

  // Return wallets that appear in >20% of transactions
  const threshold = transactions.length * 0.2;
  return Object.entries(walletCounts)
    .filter(([_, count]) => count >= threshold)
    .map(([wallet]) => wallet);
}

// ===== TAX STRUCTURE ANALYSIS =====

async function analyzeTaxStructure(transferHookAnalysis) {
  const structure = {
    buyTax: 0,
    sellTax: 0,
    taxType: 'unknown',
    taxAuthority: 'none',
    isFixed: false,
    isDynamic: false
  };

  if (!transferHookAnalysis.hasTransferHook) {
    structure.taxType = 'none';
    structure.isFixed = true;
    return structure;
  }

  // Analyze transfer hook program for tax logic
  const programId = transferHookAnalysis.transferHookProgram;
  
  // Check if program has mutable state (indicates dynamic tax)
  const hasMutableState = await checkProgramMutableState(programId);

  if (hasMutableState) {
    structure.taxType = 'dynamic';
    structure.isDynamic = true;
    structure.taxAuthority = 'program';
    
    // Dynamic taxes are assumed to be max possible
    structure.buyTax = 3;
    structure.sellTax = 3;
  } else {
    structure.taxType = 'fixed';
    structure.isFixed = true;
    structure.taxAuthority = 'none';
    
    // Estimate fixed tax from transaction patterns
    const estimatedTax = await estimateTaxFromTransactions(
      transferHookAnalysis.taxWallets
    );
    structure.buyTax = estimatedTax.buy;
    structure.sellTax = estimatedTax.sell;
  }

  // Check for external authority
  if (transferHookAnalysis.upgradeable) {
    structure.taxAuthority = 'external_wallet';
  }

  return structure;
}

async function checkProgramMutableState(programId) {
  try {
    const programAccount = await fetchProgramAccount(programId);
    if (!programAccount?.value) return false;

    // Check if program has executable flag and owner
    const isExecutable = programAccount.value.executable;
    const owner = programAccount.value.owner;
    
    // Program with BPF Loader as owner and executable can have mutable state
    return isExecutable && owner !== '11111111111111111111111111111111';
  } catch (error) {
    return false;
  }
}

async function estimateTaxFromTransactions(taxWallets) {
  if (taxWallets.length === 0) {
    return { buy: 0, sell: 0 };
  }

  // Fetch transactions for first tax wallet
  const transactions = await fetchTransactionHistory(taxWallets[0], 100);
  
  let totalTaxReceived = 0;
  let totalTransferred = 0;
  let count = 0;

  for (const tx of transactions) {
    if (!tx?.meta?.postTokenBalances) continue;

    const preBalances = tx.meta.preTokenBalances || [];
    const postBalances = tx.meta.postTokenBalances || [];

    for (const postBal of postBalances) {
      const preBal = preBalances.find(b => b.accountIndex === postBal.accountIndex);
      if (!preBal) continue;

      const change = (postBal.uiTokenAmount?.uiAmount || 0) - (preBal.uiTokenAmount?.uiAmount || 0);
      
      if (change > 0) {
        totalTaxReceived += change;
        
        // Find total transfer amount in the same transaction
        const maxTransfer = Math.max(
          ...postBalances.map(b => Math.abs(
            (b.uiTokenAmount?.uiAmount || 0) - 
            (preBalances.find(p => p.accountIndex === b.accountIndex)?.uiTokenAmount?.uiAmount || 0)
          ))
        );
        
        totalTransferred += maxTransfer;
        count++;
      }
    }
  }

  if (count === 0 || totalTransferred === 0) {
    return { buy: 0, sell: 0 };
  }

  // Calculate average tax percentage
  const avgTaxPercent = (totalTaxReceived / totalTransferred) * 100;
  
  // Assume equal buy/sell tax for simplicity
  return {
    buy: Math.min(Math.round(avgTaxPercent * 10) / 10, 10),
    sell: Math.min(Math.round(avgTaxPercent * 10) / 10, 10)
  };
}

// ===== BUYBACK DETECTION =====

async function detectBuybackLogic(mintAddress, taxWallets) {
  const analysis = {
    confidence: 'low',
    buybackWallet: null,
    proof: []
  };

  if (taxWallets.length === 0) {
    return analysis;
  }

  console.log('[Buyback] Analyzing wallets:', taxWallets);

  for (const wallet of taxWallets) {
    const buybackProof = await analyzeBuybackPattern(wallet, mintAddress);
    
    if (buybackProof.confidence !== 'low') {
      analysis.confidence = buybackProof.confidence;
      analysis.buybackWallet = wallet;
      analysis.proof = buybackProof.steps;
      break;
    }
  }

  return analysis;
}

async function analyzeBuybackPattern(wallet, mintAddress) {
  const proof = {
    confidence: 'low',
    steps: []
  };

  // Fetch wallet transaction history
  const transactions = await fetchTransactionHistory(wallet, 100);
  
  let hasAccumulation = false;
  let hasSwap = false;
  let hasBurn = false;

  for (const tx of transactions) {
    if (!tx?.transaction?.message) continue;

    const instructions = tx.transaction.message.instructions || [];
    const accountKeys = tx.transaction.message.accountKeys || [];

    // Step 1: Check if wallet accumulates tokens
    if (tx.meta?.postTokenBalances) {
      const walletBalance = tx.meta.postTokenBalances.find(
        b => b.owner === wallet && b.mint === mintAddress
      );
      if (walletBalance && (walletBalance.uiTokenAmount?.uiAmount || 0) > 0) {
        hasAccumulation = true;
        proof.steps.push('Tax wallet accumulates tokens');
      }
    }

    // Step 2: Check for AMM swap instructions
    for (const ix of instructions) {
      const programId = typeof ix.programId === 'string' 
        ? ix.programId 
        : accountKeys[ix.programIdIndex]?.pubkey;

      // Known AMM program IDs (Raydium, Orca, etc.)
      const ammPrograms = [
        '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8', // Raydium
        '9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP', // Orca
      ];

      if (ammPrograms.includes(programId)) {
        hasSwap = true;
        proof.steps.push('Swap transaction detected');
      }
    }

    // Step 3: Check for burn
    const burnFound = accountKeys.some(
      key => key.pubkey === BURN_ADDRESS || key.pubkey.includes('1nc1nerator')
    );
    
    if (burnFound) {
      hasBurn = true;
      proof.steps.push('Tokens sent to burn address');
    }
  }

  // Determine confidence level
  if (hasAccumulation && hasSwap && hasBurn) {
    proof.confidence = 'high';
  } else if (hasAccumulation && hasSwap) {
    proof.confidence = 'medium';
    proof.steps.push('No burn proof found - tokens may be held');
  } else if (hasAccumulation) {
    proof.confidence = 'low';
    proof.steps.push('Only accumulation detected - no buyback activity');
  }

  return proof;
}

// ===== RISK CALCULATION =====

function calculateTaxRiskLevel(buyTax, sellTax, tokenType) {
  const thresholds = tokenType === 'TOKEN2022' 
    ? TAX_THRESHOLDS.TOKEN2022 
    : TAX_THRESHOLDS.SPL;

  // Buy tax risk
  let buyRisk = 'low';
  if (buyTax > thresholds.buy.risky) buyRisk = 'high';
  else if (buyTax > thresholds.buy.acceptable) buyRisk = 'medium';

  // Sell tax risk
  let sellRisk = 'low';
  if (sellTax > thresholds.sell.risky) sellRisk = 'high';
  else if (sellTax > thresholds.sell.acceptable) sellRisk = 'medium';

  // Overall risk (take the higher)
  if (buyRisk === 'high' || sellRisk === 'high') return 'high';
  if (buyRisk === 'medium' || sellRisk === 'medium') return 'medium';
  return 'low';
}

function determineVerificationAction(taxStructure, taxRiskLevel, buybackAnalysis) {
  // Dynamic taxes cannot be auto-verified
  if (taxStructure.taxType === 'dynamic') {
    return 'manual_review';
  }

  // High risk taxes are flagged
  if (taxRiskLevel === 'high') {
    return 'flagged';
  }

  // Medium risk with no buyback
  if (taxRiskLevel === 'medium' && buybackAnalysis.confidence === 'low') {
    return 'risky';
  }

  // Low risk with high buyback confidence
  if (taxRiskLevel === 'low' && buybackAnalysis.confidence === 'high') {
    return 'auto_verified';
  }

  // Default
  if (taxRiskLevel === 'low') {
    return 'auto_verified';
  }

  return 'manual_review';
}

function generateFlags(taxStructure, taxRiskLevel, buybackAnalysis) {
  const flags = [];

  if (taxStructure.isDynamic) {
    flags.push('DYNAMIC_TAX');
  }

  if (taxRiskLevel === 'high') {
    flags.push('HIGH_TAX');
  }

  if (taxStructure.taxAuthority === 'external_wallet') {
    flags.push('UPGRADEABLE_PROGRAM');
  }

  if (buybackAnalysis.confidence === 'low' && taxStructure.buyTax > 0) {
    flags.push('NO_BUYBACK_PROOF');
  }

  if (taxStructure.buyTax > 10 || taxStructure.sellTax > 10) {
    flags.push('EXCESSIVE_TAX');
  }

  return flags;
}