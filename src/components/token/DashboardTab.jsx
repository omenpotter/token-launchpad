import React from 'react';
import { Coins, ExternalLink, Clock, Shield, Copy, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DashboardTab({ createdTokens }) {
  const [copiedId, setCopiedId] = React.useState(null);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (createdTokens.length === 0) {
    return (
      <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
          <Coins className="w-8 h-8 text-slate-500" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No Tokens Created</h3>
        <p className="text-slate-400">Tokens you create will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Your Tokens</h3>
        <span className="text-sm text-slate-400">{createdTokens.length} token(s)</span>
      </div>

      <div className="grid gap-4">
        {createdTokens.map((token, index) => (
          <motion.div
            key={token.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden hover:border-slate-600/50 transition"
          >
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                    {token.symbol.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white">{token.name}</h4>
                    <p className="text-slate-400 text-sm">{token.symbol}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {token.lockMint && (
                    <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-lg flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Locked
                    </span>
                  )}
                  {token.immutable && (
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-lg">
                      Immutable
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-slate-700/30 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-1">Total Supply</p>
                  <p className="text-white font-semibold">{token.supply.toLocaleString()}</p>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-1">Decimals</p>
                  <p className="text-white font-semibold">{token.decimals}</p>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-1">Type</p>
                  <p className="text-white font-semibold">{token.type}</p>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-1">Network</p>
                  <p className="text-white font-semibold">{token.network.includes('x1') ? 'X1' : 'Solana'}</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-700/20 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Mint Address:</span>
                  <code className="text-sm text-blue-400 font-mono">{token.mint}</code>
                </div>
                <button
                  onClick={() => copyToClipboard(token.mint, token.id)}
                  className="p-2 hover:bg-slate-600/50 rounded-lg transition"
                >
                  {copiedId === token.id ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2 mt-4 text-xs text-slate-500">
                <Clock className="w-3 h-3" />
                Created: {token.timestamp}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}