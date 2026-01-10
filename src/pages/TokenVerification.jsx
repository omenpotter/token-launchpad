import '../components/token/web3/polyfills';
import React, { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Search, TrendingUp, Lock, Droplets, Zap, Clock, Activity } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import SharedHeader from '../components/token/SharedHeader';
import SharedFooter from '../components/token/SharedFooter';
import { motion } from 'framer-motion';
import { verifyTokenLiquidity, formatLiquidityResult } from '../components/token/LiquidityDetectionService';

export default function TokenVerificationPage() {
  const [mintAddress, setMintAddress] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportCategory, setReportCategory] = useState('suspicious');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const tokensPerPage = 10;

  // Fetch verified tokens from database
  const { data: verifiedTokens = [] } = useQuery({
    queryKey: ['verified-tokens'],
    queryFn: async () => {
      const tokens = await base44.entities.Token.list();
      return tokens.filter(t => t.network === 'x1Mainnet');
    },
    initialData: []
  });

  // Filter and search logic
  const filteredTokens = verifiedTokens.filter(token => {
    const matchesSearch = !searchQuery || 
      token.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.symbol?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.mint?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRisk = filterRisk === 'all' || 
      (filterRisk === 'low' && (token.riskScore || 0) <= 20) ||
      (filterRisk === 'medium' && (token.riskScore || 0) > 20 && (token.riskScore || 0) <= 50) ||
      (filterRisk === 'high' && (token.riskScore || 0) > 50);
    
    return matchesSearch && matchesRisk;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredTokens.length / tokensPerPage);
  const startIndex = (currentPage - 1) * tokensPerPage;
  const paginatedTokens = filteredTokens.slice(startIndex, startIndex + tokensPerPage);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterRisk]);

  const handleVerify = async () => {
    if (!mintAddress.trim()) {
      alert('Please enter a token mint address');
      return;
    }

    setVerifying(true);
    try {
      const result = await base44.functions.invoke('verifyToken', {
        mintAddress: mintAddress.trim(),
        network: 'x1Mainnet'
      });
      
      // Get liquidity data using LiquidityDetectionService
      console.log('[TokenVerification] Checking liquidity for:', mintAddress.trim());
      const liquidityData = await verifyTokenLiquidity(mintAddress.trim());
      const liquidityFormatted = formatLiquidityResult(liquidityData);
      
      // Merge liquidity info into result
      result.data.liquidity = liquidityFormatted;
      result.data.liquidityRaw = liquidityData;
      result.data.checks = {
        ...result.data.checks,
        hasLiquidity: liquidityFormatted.display.includes('Yes'),
        lpStatus: liquidityFormatted.status,
        poolCount: liquidityFormatted.poolCount,
        pools: liquidityFormatted.pools,
        totalLiquidity: liquidityFormatted.totalLiquidity,
        liquiditySource: liquidityFormatted.source,
        liquidityConfidence: liquidityData.confidence
      };
      
      setVerificationResult(result.data);
      console.log('[TokenVerification] Verification complete');
    } catch (error) {
      alert('Verification failed: ' + error.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) {
      alert('Please provide a reason for the report');
      return;
    }

    setReportSubmitting(true);
    try {
      const result = await base44.functions.invoke('reportToken', {
        mintAddress: verificationResult.mintAddress,
        reason: reportReason.trim(),
        category: reportCategory
      });
      
      alert(result.data.message);
      setShowReportModal(false);
      setReportReason('');
      setReportCategory('suspicious');
    } catch (error) {
      alert('Failed to submit report: ' + error.message);
    } finally {
      setReportSubmitting(false);
    }
  };

  const getRiskColor = (score) => {
    if (score <= 20) return 'text-green-400 bg-green-500/20 border-green-500/30';
    if (score <= 50) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    if (score <= 80) return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
    return 'text-red-400 bg-red-500/20 border-red-500/30';
  };

  const getStatusBadge = (status) => {
    const badges = {
      'unverified': { icon: XCircle, text: 'Unverified', color: 'text-slate-400 bg-slate-500/20' },
      'auto_verified': { icon: CheckCircle, text: 'Auto Verified', color: 'text-green-400 bg-green-500/20' },
      'risky': { icon: AlertTriangle, text: 'Risky', color: 'text-yellow-400 bg-yellow-500/20' },
      'flagged': { icon: AlertTriangle, text: 'Flagged', color: 'text-orange-400 bg-orange-500/20' },
      'revoked': { icon: XCircle, text: 'Revoked', color: 'text-red-400 bg-red-500/20' }
    };
    
    const badge = badges[status] || badges.unverified;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-medium ${badge.color}`}>
        <Icon className="w-4 h-4" />
        {badge.text}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <SharedHeader />

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Token Verification System</h1>
              <p className="text-slate-400">Automated X1 SVM blockchain token analysis</p>
            </div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <p className="text-sm text-blue-300">
              ⚠️ <strong>Disclaimer:</strong> Verification is based solely on automated on-chain analysis on the X1 SVM chain and does not constitute financial advice.
            </p>
          </div>
        </div>

        {/* Verification Input */}
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Verify Token</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={mintAddress}
              onChange={(e) => setMintAddress(e.target.value)}
              placeholder="Enter X1 token mint address..."
              className="flex-1 bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-xl transition font-medium flex items-center gap-2"
            >
              {verifying ? (
                <>
                  <Activity className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Verify
                </>
              )}
            </button>
          </div>
        </div>

        {/* Verification Result */}
        {verificationResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 mb-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">{verificationResult.name || 'Unknown Token'}</h3>
                <p className="text-slate-400">{verificationResult.symbol || 'N/A'}</p>
              </div>
              {getStatusBadge(verificationResult.status)}
            </div>

            {/* Risk Score */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300 font-medium">Risk Score</span>
                <span className={`text-2xl font-bold ${getRiskColor(verificationResult.riskScore).split(' ')[0]}`}>
                  {verificationResult.riskScore}/100
                </span>
              </div>
              <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    verificationResult.riskScore <= 20 ? 'bg-green-500' :
                    verificationResult.riskScore <= 50 ? 'bg-yellow-500' :
                    verificationResult.riskScore <= 80 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${verificationResult.riskScore}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {verificationResult.riskScore <= 20 ? 'Low Risk' :
                 verificationResult.riskScore <= 50 ? 'Medium Risk' :
                 verificationResult.riskScore <= 80 ? 'High Risk' : 'Extreme Risk'}
              </p>
            </div>

            {/* Checks Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Contract & Authority */}
              <div className="bg-slate-700/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-blue-400" />
                  <h4 className="font-semibold text-white">Contract & Authority</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Token Program:</span>
                    <span className="text-white">{verificationResult.checks?.programType || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mint Authority:</span>
                    <span className={verificationResult.checks?.mintAuthorityRevoked ? 'text-green-400' : 'text-red-400'}>
                      {verificationResult.checks?.mintAuthorityRevoked ? 'Revoked ✓' : 'Active ⚠️'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Freeze Authority:</span>
                    <span className={verificationResult.checks?.freezeAuthorityRevoked ? 'text-green-400' : 'text-yellow-400'}>
                      {verificationResult.checks?.freezeAuthorityRevoked ? 'Revoked ✓' : 'Active'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tokenomics */}
              <div className="bg-slate-700/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  <h4 className="font-semibold text-white">Tokenomics</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Buy Tax:</span>
                    <span className="text-white">{verificationResult.checks?.buyTax || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sell Tax:</span>
                    <span className="text-white">{verificationResult.checks?.sellTax || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Burn Mechanism:</span>
                    <span className={verificationResult.checks?.hasBurnMechanism ? 'text-green-400' : 'text-slate-400'}>
                      {verificationResult.checks?.hasBurnMechanism ? 'Yes ✓' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Supply & Minting */}
              <div className="bg-slate-700/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <h4 className="font-semibold text-white">Supply & Minting</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Supply:</span>
                    <span className="text-white">{verificationResult.checks?.totalSupply?.toLocaleString() || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mintable:</span>
                    <span className={verificationResult.checks?.isMintable ? 'text-yellow-400' : 'text-green-400'}>
                      {verificationResult.checks?.isMintable ? 'Yes ⚠️' : 'No ✓'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Supply Risk:</span>
                    <span className={verificationResult.checks?.supplyRisk ? 'text-red-400' : 'text-green-400'}>
                      {verificationResult.checks?.supplyRisk ? 'High ⚠️' : 'Low ✓'}
                    </span>
                  </div>
                </div>
              </div>

              {/* ✅ UPDATED: Liquidity & Lock - Now shows X1 XDEX liquidity data */}
              <div className="bg-slate-700/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Droplets className="w-5 h-5 text-cyan-400" />
                  <h4 className="font-semibold text-white">Liquidity & Lock</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">LP Exists:</span>
                    <span className={verificationResult.checks?.hasLiquidity ? 'text-green-400' : 'text-red-400'}>
                      {verificationResult.checks?.hasLiquidity ? 'Yes ✓' : 'No ⚠️'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">LP Status:</span>
                    <span className="text-white capitalize">
                      {verificationResult.checks?.lpStatus === 'xdex' ? 'XDEX Pool' :
                       verificationResult.checks?.lpStatus === 'x1-verified' ? 'X1 Verified' :
                       verificationResult.checks?.lpStatus || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Source:</span>
                    <span className="text-slate-300 text-xs">{verificationResult.checks?.liquiditySource}</span>
                  </div>
                  {verificationResult.checks?.poolCount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Pool Count:</span>
                      <span className="text-white">{verificationResult.checks.poolCount}</span>
                    </div>
                  )}
                  {verificationResult.checks?.totalLiquidity > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Liquidity:</span>
                      <span className="text-white">${verificationResult.checks.totalLiquidity.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-slate-600/50">
                    <span className="text-slate-400">Confidence:</span>
                    <span className={`text-sm font-semibold ${verificationResult.checks?.liquidityConfidence >= 80 ? 'text-green-400' : verificationResult.checks?.liquidityConfidence >= 50 ? 'text-yellow-400' : 'text-orange-400'}`}>
                      {verificationResult.checks?.liquidityConfidence || 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ✅ NEW: XDEX Pools Details Section */}
            {verificationResult.checks?.pools && verificationResult.checks.pools.length > 0 && (
              <div className="mt-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Droplets className="w-5 h-5 text-cyan-400" />
                  <h4 className="font-semibold text-cyan-400">XDEX Liquidity Pools</h4>
                </div>
                <div className="space-y-3">
                  {verificationResult.checks.pools.map((pool, idx) => (
                    <div key={idx} className="bg-slate-700/50 rounded-lg p-3 text-sm">
                      <div className="flex justify-between mb-2">
                        <span className="text-slate-300">Pool {idx + 1}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          pool.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {pool.status?.toUpperCase() || 'ACTIVE'}
                        </span>
                      </div>
                      <div className="space-y-1 text-slate-400">
                        <p className="font-mono text-xs truncate">Address: {pool.address}</p>
                        <div className="flex justify-between text-xs">
                          <span>Liquidity: ${(pool.liquidity || 0).toLocaleString()}</span>
                          <span>24h Vol: ${(pool.volume24h || 0).toLocaleString()}</span>
                        </div>
                        {pool.fee && <p className="text-xs">Fee: {pool.fee}%</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Token-2022 Features */}
            {verificationResult.checks?.hasTransferHook && (
              <div className="mt-4 bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-purple-400" />
                  <h4 className="font-semibold text-purple-400">Token-2022 Features Detected</h4>
                </div>
                <div className="space-y-1 text-sm text-purple-300">
                  {verificationResult.checks.hasTransferHook && <p>• Transfer Hook Program Active</p>}
                  {verificationResult.checks.hasTransferFee && <p>• Transfer Fee Extension</p>}
                  {verificationResult.checks.hasPermanentDelegate && <p>• Permanent Delegate Detected</p>}
                  {verificationResult.checks.taxesAreDynamic && <p>• Dynamic Tax Configuration</p>}
                  {verificationResult.checks.hasBuyback && (
                    <p>• Buyback Logic Detected ({verificationResult.checks.buybackConfidence} confidence)</p>
                  )}
                  {verificationResult.checks.taxRiskLevel && (
                    <p>• Tax Risk: {verificationResult.checks.taxRiskLevel.toUpperCase()}</p>
                  )}
                </div>
              </div>
            )}

            {/* AI Risk Analysis */}
            {verificationResult.aiAnalysis && (
              <div className="mt-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-purple-400" />
                  <h4 className="font-semibold text-purple-400">AI-Powered Risk Assessment</h4>
                </div>
                <p className="text-sm text-slate-300 mb-3">{verificationResult.aiAnalysis.summary}</p>
                {verificationResult.aiAnalysis.riskFactors?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-400 uppercase">Key Risk Factors:</p>
                    <ul className="space-y-1 text-sm text-slate-300">
                      {verificationResult.aiAnalysis.riskFactors.map((factor, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-purple-400 mt-0.5">•</span>
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {verificationResult.aiAnalysis.recommendation && (
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <p className="text-xs font-medium text-slate-400 uppercase mb-1">Recommendation:</p>
                    <p className="text-sm text-slate-300">{verificationResult.aiAnalysis.recommendation}</p>
                  </div>
                )}
              </div>
            )}

            {/* Warnings */}
            {verificationResult.warnings?.length > 0 && (
              <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <h4 className="font-semibold text-red-400">Warnings</h4>
                </div>
                <ul className="space-y-1 text-sm text-red-300">
                  {verificationResult.warnings.map((warning, idx) => (
                    <li key={idx}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Report Button */}
            <div className="mt-4">
              <button
                onClick={() => setShowReportModal(true)}
                className="w-full px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl transition font-medium"
              >
                Report Suspicious Token
              </button>
            </div>
          </motion.div>
        )}

        {/* Report Modal */}
        {showReportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-700"
            >
              <h3 className="text-xl font-bold text-white mb-4">Report Token</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                <select
                  value={reportCategory}
                  onChange={(e) => setReportCategory(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                >
                  <option value="suspicious">Suspicious Activity</option>
                  <option value="scam">Scam</option>
                  <option value="rug_pull">Rug Pull</option>
                  <option value="honeypot">Honeypot</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">Reason</label>
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Describe why this token is suspicious..."
                  rows={4}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-none"
                />
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-4">
                <p className="text-xs text-yellow-300">
                  Reports are reviewed automatically. After {5} reports, the token will be re-analyzed. Abuse of this system may result in restrictions.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowReportModal(false); setReportReason(''); }}
                  className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReport}
                  disabled={reportSubmitting}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 disabled:bg-slate-600 text-white rounded-xl transition"
                >
                  {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Verified Tokens List */}
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Verified Tokens</h3>
            <span className="text-sm text-slate-400">
              {filteredTokens.length} token{filteredTokens.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, symbol, or address..."
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl pl-10 pr-4 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
            >
              <option value="all">All Risk Levels</option>
              <option value="low">Low Risk (≤20)</option>
              <option value="medium">Medium Risk (21-50)</option>
              <option value="high">High Risk (>50)</option>
            </select>
          </div>

          {/* Token List */}
          <div className="space-y-3">
            {paginatedTokens.length === 0 ? (
              <p className="text-slate-400 text-center py-8">
                {searchQuery || filterRisk !== 'all' ? 'No tokens match your filters' : 'No verified tokens yet'}
              </p>
            ) : (
              paginatedTokens.map((token) => (
                <div key={token.id} className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50 hover:border-slate-500/50 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                        {token.symbol?.charAt(0) || 'T'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-white font-semibold truncate">{token.name}</h4>
                        <p className="text-slate-400 text-sm">{token.symbol}</p>
                        {token.mint && (
                          <p className="text-slate-500 text-xs font-mono truncate">{token.mint}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {token.riskScore !== undefined && (
                        <div className={`px-3 py-1 rounded-lg text-xs font-medium ${getRiskColor(token.riskScore)}`}>
                          {token.riskScore}/100
                        </div>
                      )}
                      {getStatusBadge(token.verificationStatus || 'auto_verified')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg transition text-sm"
              >
                Previous
              </button>
              <div className="flex items-center gap-2">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                      currentPage === i + 1
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg transition text-sm"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* System Info */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <h4 className="font-semibold text-white">Real-Time</h4>
            </div>
            <p className="text-sm text-slate-400">Continuous monitoring for all verified tokens</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-green-400" />
              <h4 className="font-semibold text-white">Automated</h4>
            </div>
            <p className="text-sm text-slate-400">100% rule-based, no manual review</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-purple-400" />
              <h4 className="font-semibold text-white">Deterministic</h4>
            </div>
            <p className="text-sm text-slate-400">Transparent and reproducible results</p>
          </div>
        </div>
      </main>

      <SharedFooter />
    </div>
  );
}