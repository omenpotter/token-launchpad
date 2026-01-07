import React from 'react';
import { Zap, Flame, Coins, Info, AlertCircle } from 'lucide-react';

export default function DirectMintTab({
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
  onBurn
}) {
  const selectedToken = createdTokens.find(t => t.id === parseInt(selectedTokenForMint));

  return (
    <div className="space-y-6">
      {createdTokens.length === 0 ? (
        <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
            <Coins className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Tokens Yet</h3>
          <p className="text-slate-400">Create a token first to mint or burn tokens</p>
        </div>
      ) : (
        <>
          {/* Token Selection */}
          <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Coins className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Select Token</h3>
                <p className="text-xs text-slate-400">Choose a token to mint or burn</p>
              </div>
            </div>

            <select
              value={selectedTokenForMint}
              onChange={(e) => setSelectedTokenForMint(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
            >
              <option value="">Select a token...</option>
              {createdTokens.map(token => (
                <option key={token.id} value={token.id}>
                  {token.name} ({token.symbol}) - Supply: {token.supply.toLocaleString()}
                </option>
              ))}
            </select>

            {selectedToken && (
              <div className="mt-4 p-4 bg-slate-700/30 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-slate-400">Symbol</p>
                  <p className="text-white font-medium">{selectedToken.symbol}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Total Supply</p>
                  <p className="text-white font-medium">{selectedToken.supply.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Minted</p>
                  <p className="text-green-400 font-medium">{(selectedToken.totalMinted || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Burned</p>
                  <p className="text-red-400 font-medium">{(selectedToken.burned || 0).toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>

          {/* Mint Section */}
          <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Mint Tokens</h3>
                <p className="text-xs text-slate-400">Create new tokens and add to supply</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Amount to Mint</label>
                <input
                  type="number"
                  value={mintAmount}
                  onChange={(e) => setMintAmount(Number(e.target.value))}
                  min={1}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition"
                />
              </div>

              {/* Fee Display */}
              <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-green-400" />
                  <span className="text-green-300 text-sm">Minting Fee:</span>
                </div>
                <span className="text-lg font-bold text-white">{mintFee} {currency}</span>
              </div>

              <button
                onClick={onMint}
                disabled={!walletConnected || !selectedTokenForMint || !mintAmount}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                {walletConnected ? 'Mint Tokens' : 'Connect Wallet First'}
              </button>
            </div>
          </div>

          {/* Burn Section */}
          <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <Flame className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Burn Tokens</h3>
                <p className="text-xs text-slate-400">Permanently remove tokens from supply</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Amount to Burn</label>
                <input
                  type="number"
                  value={burnAmount}
                  onChange={(e) => setBurnAmount(Number(e.target.value))}
                  min={0}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition"
                />
              </div>

              <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">
                  Burning tokens is irreversible. The burned tokens will be permanently removed from circulation.
                </p>
              </div>

              <button
                onClick={onBurn}
                disabled={!walletConnected || !selectedTokenForMint || !burnAmount}
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition flex items-center justify-center gap-2"
              >
                <Flame className="w-5 h-5" />
                Burn Tokens
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}