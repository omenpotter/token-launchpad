import '../components/token/web3/polyfills';
import React, { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Search, TrendingUp, Lock, Droplets, Zap, Clock, Activity } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import SharedHeader from '../components/token/SharedHeader';
import SharedFooter from '../components/token/SharedFooter';
import { motion } from 'framer-motion';

export default function TokenVerificationPage() {
  const [mintAddress, setMintAddress] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  // Fetch verified tokens from database
  const { data: verifiedTokens = [] } = useQuery({
    queryKey: ['verified-tokens'],
    queryFn: async () => {
      const tokens = await base44.entities.Token.list();
      return tokens.filter(t => t.network === 'x1Mainnet');
    },
    initialData: []
  });

  const handleVerify = async () => {
    if (!mintAddress.trim()) {
      alert('Please enter a token mint address');
      return;
    }

    setVerifying(true);
    try {
      // Call verification backend function
      const result = await base44.functions.invoke('verifyToken', {
        mintAddress: mintAddress.trim(),
        network: 'x1Mainnet'
      });
      
      setVerificationResult(result.data);
    } catch (error) {
      alert('Verification failed: ' + error.message);
    } finally {
      setVerifying(false);
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

              {/* Liquidity & Lock */}
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
                    <span className="text-white">
                      {verificationResult.checks?.lpStatus || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Lock Duration:</span>
                    <span className="text-white">
                      {verificationResult.checks?.lockDuration || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Warnings */}
            {verificationResult.warnings?.length > 0 && (
              <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
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
          </motion.div>
        )}

        {/* Verified Tokens List */}
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">Verified Tokens</h3>
          <div className="space-y-3">
            {verifiedTokens.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No verified tokens yet</p>
            ) : (
              verifiedTokens.map((token) => (
                <div key={token.id} className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                        {token.symbol?.charAt(0) || 'T'}
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">{token.name}</h4>
                        <p className="text-slate-400 text-sm">{token.symbol}</p>
                      </div>
                    </div>
                    {getStatusBadge('auto_verified')}
                  </div>
                </div>
              ))
            )}
          </div>
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