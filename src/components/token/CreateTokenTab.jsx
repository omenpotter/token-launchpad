import React from 'react';
import { Coins, Shield, Globe, Image, Lock, Users, Zap, Info, MessageCircle, Twitter as TwitterIcon, Calendar } from 'lucide-react';
import AIDescriptionGenerator from './AIDescriptionGenerator';

export default function CreateTokenTab({
  network,
  setNetwork,
  tokenType,
  setTokenType,
  tokenName,
  setTokenName,
  tokenSymbol,
  setTokenSymbol,
  decimals,
  setDecimals,
  supply,
  setSupply,
  tokenLogo,
  setTokenLogo,
  tokenWebsite,
  setTokenWebsite,
  tokenTelegram,
  setTokenTelegram,
  tokenTwitter,
  setTokenTwitter,
  tokenDescription,
  setTokenDescription,
  lockEnabled,
  setLockEnabled,
  lockDuration,
  setLockDuration,
  lockReleaseDate,
  setLockReleaseDate,
  lockMintAuthority,
  setLockMintAuthority,
  whitelistEnabled,
  setWhitelistEnabled,
  whitelistAddresses,
  setWhitelistAddresses,
  fairMintEnabled,
  setFairMintEnabled,
  maxPerWallet,
  setMaxPerWallet,
  immutableToken,
  setImmutableToken,
  buyTax,
  setBuyTax,
  sellTax,
  setSellTax,
  walletConnected,
  creationFee,
  currency,
  onCreateToken
}) {
  return (
    <div className="space-y-6">
      {/* Network Selection */}
      <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Globe className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Network & Token Type</h3>
            <p className="text-xs text-slate-400">Select blockchain and token standard</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Network</label>
            <div className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3">
              X1 Mainnet - XNT
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Token Type</label>
            <div className="w-full bg-blue-500/20 border border-blue-500 text-blue-300 rounded-xl px-4 py-3 flex items-center justify-center gap-2">
              <Zap className="w-5 h-5" />
              <span className="font-medium">Token 2022</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              ✨ Advanced features: On-chain metadata, transfer fees, extensions
            </p>
          </div>
        </div>
      </div>

      {/* Token Details */}
      <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <Coins className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Token Details</h3>
            <p className="text-xs text-slate-400">Basic information about your token</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Token Name *</label>
            <input
              type="text"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              placeholder="My Token"
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Symbol *</label>
            <input
              type="text"
              value={tokenSymbol}
              onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
              placeholder="TKN"
              maxLength={10}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition uppercase"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Decimals</label>
            <input
              type="number"
              value={decimals}
              onChange={(e) => setDecimals(Number(e.target.value))}
              min={0}
              max={18}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Initial Supply</label>
            <input
              type="number"
              value={supply}
              onChange={(e) => setSupply(Number(e.target.value))}
              min={1}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* Advanced Options */}
      <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Advanced Options</h3>
            <p className="text-xs text-slate-400">Security and distribution settings</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-white font-medium">Lock Mint Authority</p>
                <p className="text-xs text-slate-400">Permanently disable minting new tokens</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={lockMintAuthority} onChange={(e) => setLockMintAuthority(e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>

          <div className="p-4 bg-slate-700/30 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-white font-medium">Fair Mint</p>
                  <p className="text-xs text-slate-400">Limit tokens per wallet during mint</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={fairMintEnabled} onChange={(e) => setFairMintEnabled(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
            {fairMintEnabled && (
              <div>
                <label className="block text-sm text-slate-400 mb-2">Max Per Wallet</label>
                <input
                  type="number"
                  value={maxPerWallet}
                  onChange={(e) => setMaxPerWallet(Number(e.target.value))}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                />
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-700/30 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-white font-medium">Token Lock</p>
                  <p className="text-xs text-slate-400">Lock tokens for a specific duration</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={lockEnabled} onChange={(e) => setLockEnabled(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
            {lockEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Lock Duration (Days)</label>
                  <input
                    type="number"
                    value={lockDuration}
                    onChange={(e) => setLockDuration(Number(e.target.value))}
                    min={1}
                    className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Release Date
                  </label>
                  <input
                    type="date"
                    value={lockReleaseDate}
                    onChange={(e) => setLockReleaseDate(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Tax Settings */}
          <div className="p-4 bg-slate-700/30 rounded-xl space-y-3">
            <div className="flex items-center gap-3 mb-3">
              <Coins className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-white font-medium">Transaction Taxes</p>
                <p className="text-xs text-slate-400">Set buy and sell tax percentages (0-3%)</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Buy Tax (%)</label>
                <input
                  type="number"
                  value={buyTax}
                  onChange={(e) => setBuyTax(Math.min(3, Math.max(0, Number(e.target.value))))}
                  min={0}
                  max={3}
                  step={0.1}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Sell Tax (%)</label>
                <input
                  type="number"
                  value={sellTax}
                  onChange={(e) => setSellTax(Math.min(3, Math.max(0, Number(e.target.value))))}
                  min={0}
                  max={3}
                  step={0.1}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Button */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl p-5 border border-blue-500/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-400" />
            <span className="text-slate-300 text-sm">Token Creation Fee:</span>
          </div>
          <span className="text-xl font-bold text-white">{creationFee} {currency}</span>
        </div>
        <button
          onClick={onCreateToken}
          disabled={!walletConnected || !tokenName || !tokenSymbol}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition flex items-center justify-center gap-2"
        >
          <Coins className="w-5 h-5" />
          {walletConnected ? 'Create Token' : 'Connect Wallet First'}
        </button>
      </div>
    </div>
  );
}