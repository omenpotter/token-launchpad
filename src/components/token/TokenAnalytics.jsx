import React, { useState } from 'react';
import { TrendingUp, Users, Activity, Droplets, ArrowUpRight, ArrowDownRight, BarChart3, Target, ExternalLink } from 'lucide-react';

export default function TokenAnalytics({ token }) {
  const [timeframe, setTimeframe] = useState('24h');
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-white font-semibold">Token Analytics</h4>
        <a 
          href={`https://xdex.xyz/token/${token.mint}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm transition"
        >
          <ExternalLink className="w-4 h-4" />
          View on xDEX
        </a>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-slate-400">Token</span>
          </div>
          <p className="text-lg font-bold text-white mb-1">{token.symbol}</p>
          <span className="text-xs text-slate-500">{token.name}</span>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <Droplets className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-slate-400">Supply</span>
          </div>
          <p className="text-lg font-bold text-white mb-1">{token.supply?.toLocaleString() || '0'}</p>
          <span className="text-xs text-slate-500">Total Supply</span>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-slate-400">Decimals</span>
          </div>
          <p className="text-lg font-bold text-white mb-1">{token.decimals || 9}</p>
          <span className="text-xs text-slate-500">Precision</span>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-green-400" />
            <span className="text-xs text-slate-400">Network</span>
          </div>
          <p className="text-lg font-bold text-white mb-1">{token.network || 'X1'}</p>
          <span className="text-xs text-slate-500">Blockchain</span>
        </div>
      </div>

      {/* Token Details */}
      <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
        <h4 className="text-white font-semibold mb-4">Token Details</h4>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-slate-400">Mint Address</span>
            <span className="text-white font-mono text-sm">{token.mint?.slice(0, 8)}...{token.mint?.slice(-8)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Type</span>
            <span className="text-white">{token.type || 'SPL'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Mint Authority</span>
            <span className="text-white">{token.lockMint ? 'Locked' : 'Active'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Fair Mint</span>
            <span className="text-white">{token.fairMint ? 'Enabled' : 'Disabled'}</span>
          </div>
          {token.fairMint && (
            <div className="flex justify-between">
              <span className="text-slate-400">Max Per Wallet</span>
              <span className="text-white">{token.maxPerWallet?.toLocaleString() || 'N/A'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Real Data Notice */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Activity className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-300 mb-1">Live Analytics</p>
            <p className="text-xs text-blue-400">
              For real-time price, volume, liquidity, and holder data, visit this token on xDEX explorer.
            </p>
          </div>
        </div>
      </div>

      {/* Social Links */}
      {(token.website || token.telegram || token.twitter) && (
        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
          <h4 className="text-white font-semibold mb-4">Links</h4>
          <div className="flex gap-3">
            {token.website && (
              <a
                href={token.website}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition"
              >
                Website
              </a>
            )}
            {token.telegram && (
              <a
                href={token.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition"
              >
                Telegram
              </a>
            )}
            {token.twitter && (
              <a
                href={token.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition"
              >
                Twitter
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}