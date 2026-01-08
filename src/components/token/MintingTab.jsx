import React from 'react';
import { Zap, Flame, AlertCircle, Send, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function MintingTab({
  createdTokens,
  selectedTokenForMint,
  setSelectedTokenForMint,
  mintAmount,
  setMintAmount,
  burnAmount,
  setBurnAmount,
  walletConnected,
  mintFee,
  currency,
  onMint,
  onBurn,
  walletAddress
}) {
  // Fetch only tokens sent for minting
  const { data: mintingTokens = [] } = useQuery({
    queryKey: ['minting-tokens'],
    queryFn: () => base44.entities.Token.filter({ sentForMinting: true }),
    initialData: []
  });

  const selectedToken = mintingTokens.find(t => t.id?.toString() === selectedTokenForMint);
  
  const getMintProgress = (token) => {
    if (token.lockMint) return 100;
    if (!token.fairMint || !token.maxPerWallet) return 0;
    const percentage = ((token.totalMinted || 0) / token.maxPerWallet) * 100;
    return Math.min(percentage, 100);
  };

  const handleSendTokens = (token) => {
    const recipient = prompt('Enter recipient wallet address:');
    if (recipient) {
      alert(`Sending tokens to ${recipient} - Integration with wallet coming soon!`);
    }
  };

  if (mintingTokens.length === 0) {
    return (
      <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
          <Zap className="w-8 h-8 text-slate-500" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No Tokens Available for Minting</h3>
        <p className="text-slate-400">Token creators must send tokens to the minting page first</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Available Tokens List */}
      <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
        <h3 className="text-lg font-semibold text-white mb-4">Available Tokens for Minting</h3>
        <div className="space-y-3">
          {mintingTokens.map((token, index) => {
            const progress = getMintProgress(token);
            const isComplete = progress === 100;
            
            return (
              <motion.div
                key={token.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-slate-700/30 rounded-xl p-4 border transition ${
                  selectedTokenForMint === token.id?.toString()
                    ? 'border-blue-500'
                    : 'border-slate-600/50 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {token.symbol.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">{token.name}</h4>
                      <p className="text-slate-400 text-sm">{token.symbol}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isComplete ? (
                      <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-lg">
                        ✓ Completed
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-lg">
                        Ongoing
                      </span>
                    )}
                  </div>
                </div>

                {/* Mint Progress Bar */}
                {token.fairMint && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Mint Progress</span>
                      <span>{progress.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-slate-600/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isComplete ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>{token.totalMinted || 0} / {token.maxPerWallet} per wallet</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="bg-slate-800/50 rounded-lg p-2">
                    <p className="text-xs text-slate-400">Supply</p>
                    <p className="text-white font-semibold text-sm">{token.supply?.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-2">
                    <p className="text-xs text-slate-400">Minted</p>
                    <p className="text-white font-semibold text-sm">{token.totalMinted || 0}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-2">
                    <p className="text-xs text-slate-400">Burned</p>
                    <p className="text-white font-semibold text-sm">{token.burned || 0}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedTokenForMint(token.id?.toString())}
                    className="flex-1 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition font-medium text-sm"
                  >
                    Select for Minting
                  </button>
                  <button
                    onClick={() => handleSendTokens(token)}
                    className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition font-medium text-sm flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </button>
                  <a
                    href={`https://explorer.mainnet.x1.xyz/address/${token.mint}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-slate-600/30 hover:bg-slate-600/50 text-slate-300 rounded-lg transition flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Selected Token Actions */}
      {selectedToken && (
        <>
          {/* Mint Section */}
          <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Mint {selectedToken.symbol} Tokens</h3>
                <p className="text-xs text-slate-400">Create new tokens (requires mint authority)</p>
              </div>
            </div>

            {selectedToken.lockMint ? (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-300">
                  Mint authority is locked for this token. No new tokens can be minted.
                </div>
              </div>
            ) : (
              <>
                <div className="bg-slate-700/30 rounded-xl p-4 mb-4">
                  <label className="block text-sm text-slate-300 mb-2">Amount to Mint</label>
                  <input
                    type="number"
                    value={mintAmount}
                    onChange={(e) => setMintAmount(Number(e.target.value))}
                    min={1}
                    className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-4 py-3"
                  />
                  {selectedToken.fairMint && selectedToken.maxPerWallet && (
                    <p className="text-xs text-slate-400 mt-2">
                      Max per wallet: {selectedToken.maxPerWallet.toLocaleString()} tokens
                    </p>
                  )}
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Minting Fee:</span>
                    <span className="text-white font-semibold">{mintFee} {currency}</span>
                  </div>
                </div>

                <button
                  onClick={onMint}
                  disabled={!walletConnected || !mintAmount}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold py-4 rounded-xl transition flex items-center justify-center gap-2"
                >
                  <Zap className="w-5 h-5" />
                  {walletConnected ? `Mint ${mintAmount} ${selectedToken.symbol}` : 'Connect Wallet'}
                </button>
              </>
            )}
          </div>

          {/* Burn Section */}
          <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <Flame className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Burn {selectedToken.symbol} Tokens</h3>
                <p className="text-xs text-slate-400">Permanently remove tokens from circulation</p>
              </div>
            </div>

            <div className="bg-slate-700/30 rounded-xl p-4 mb-4">
              <label className="block text-sm text-slate-300 mb-2">Amount to Burn</label>
              <input
                type="number"
                value={burnAmount}
                onChange={(e) => setBurnAmount(Number(e.target.value))}
                min={0}
                max={selectedToken.supply}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-4 py-3"
              />
              <p className="text-xs text-slate-400 mt-2">
                Available: {selectedToken.supply?.toLocaleString()} tokens
              </p>
            </div>

            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-300">
                  <p className="font-medium mb-1">⚠️ Warning: This action is irreversible</p>
                  <p className="text-red-400/70">Burned tokens cannot be recovered</p>
                </div>
              </div>
            </div>

            <button
              onClick={onBurn}
              disabled={!walletConnected || !burnAmount}
              className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold py-4 rounded-xl transition flex items-center justify-center gap-2"
            >
              <Flame className="w-5 h-5" />
              {walletConnected ? `Burn ${burnAmount} ${selectedToken.symbol}` : 'Connect Wallet'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}