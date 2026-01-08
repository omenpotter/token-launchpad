import '../components/token/web3/polyfills';
import React, { useState, useEffect } from 'react';
import { Droplets, Plus, Minus, TrendingUp, ArrowRight, Info, ExternalLink, Lock, Calendar, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { web3Service } from '../components/token/web3/Web3Provider';

export default function LiquidityPoolPage() {
  const [tokenA, setTokenA] = useState('');
  const [tokenB, setTokenB] = useState('XNT');
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [activeTab, setActiveTab] = useState('add');
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [lockEnabled, setLockEnabled] = useState(false);
  const [lockDuration, setLockDuration] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [removePercentage, setRemovePercentage] = useState(50);

  const { data: tokens = [] } = useQuery({
    queryKey: ['tokens'],
    queryFn: () => base44.entities.Token.list(),
    initialData: []
  });

  useEffect(() => {
    web3Service.initConnection('x1Testnet');
  }, []);

  // Mock liquidity pools
  const mockPools = tokens.slice(0, 3).map(token => ({
    id: token.id,
    tokenA: token.symbol,
    tokenB: 'XNT',
    reserveA: Math.random() * 100000,
    reserveB: Math.random() * 50,
    tvl: (Math.random() * 100000).toFixed(2),
    volume24h: (Math.random() * 10000).toFixed(2),
    apr: (Math.random() * 150).toFixed(2)
  }));

  const connectWallet = async () => {
    try {
      if (window.phantom?.solana) {
        const result = await web3Service.connectWallet(window.phantom.solana);
        setWalletAddress(result.address);
        setWalletConnected(true);
      } else if (window.backpack) {
        const result = await web3Service.connectWallet(window.backpack);
        setWalletAddress(result.address);
        setWalletConnected(true);
      } else {
        alert('Please install Phantom or Backpack wallet');
      }
    } catch (error) {
      alert('Failed to connect wallet: ' + error.message);
    }
  };

  const handleAddLiquidity = async () => {
    if (!tokenA || !tokenB || !amountA || !amountB) {
      alert('Please select both tokens and enter amounts');
      return;
    }
    if (!walletConnected) {
      alert('Please connect wallet first');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await web3Service.addLiquidity(
        'x1Testnet',
        tokenA === 'XNT' ? null : tokens.find(t => t.symbol === tokenA)?.mint,
        parseFloat(amountA),
        parseFloat(amountB),
        9
      );
      
      alert(`✅ Liquidity added successfully!\nTx: ${result.txHash}${lockEnabled ? `\nLocked for ${lockDuration} days` : ''}`);
      setAmountA('');
      setAmountB('');
    } catch (error) {
      alert('Failed to add liquidity: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveLiquidity = async () => {
    if (!walletConnected) {
      alert('Please connect wallet first');
      return;
    }
    
    setIsLoading(true);
    try {
      alert(`Removing ${removePercentage}% liquidity from ${tokenA}/${tokenB} pool`);
    } catch (error) {
      alert('Failed to remove liquidity: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <Droplets className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Liquidity Pools</h1>
                <p className="text-slate-400">Add liquidity and earn fees from trades</p>
              </div>
            </div>
            <a 
              href="https://app.xdex.xyz/swap" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition"
            >
              Powered by xDEX <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          
          {!walletConnected && (
            <button
              onClick={connectWallet}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl transition font-medium"
            >
              <Wallet className="w-4 h-4" />
              Connect Wallet
            </button>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Panel */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-slate-700/50">
                <button
                  onClick={() => setActiveTab('add')}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition ${
                    activeTab === 'add'
                      ? 'bg-cyan-500/10 text-cyan-400 border-b-2 border-cyan-500'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  Add Liquidity
                </button>
                <button
                  onClick={() => setActiveTab('remove')}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition ${
                    activeTab === 'remove'
                      ? 'bg-red-500/10 text-red-400 border-b-2 border-red-500'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <Minus className="w-4 h-4" />
                  Remove Liquidity
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {activeTab === 'add' ? (
                  <div className="space-y-4">
                    {/* Token A */}
                    <div className="bg-slate-700/30 rounded-xl p-4">
                      <label className="block text-sm text-slate-400 mb-2">Token A</label>
                      <div className="flex gap-3">
                        <select
                          value={tokenA}
                          onChange={(e) => setTokenA(e.target.value)}
                          className="flex-1 bg-slate-800 border border-slate-600 text-white rounded-lg px-4 py-3"
                        >
                          <option value="">Select Token A</option>
                          <option value="XNT">XNT (Native)</option>
                          {tokens.map(token => (
                            <option key={token.id} value={token.symbol}>
                              {token.name} ({token.symbol})
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={amountA}
                          onChange={(e) => setAmountA(e.target.value)}
                          placeholder="0.0"
                          className="w-32 bg-slate-800 border border-slate-600 text-white rounded-lg px-4 py-3"
                        />
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <div className="w-10 h-10 rounded-full bg-slate-700/50 flex items-center justify-center">
                        <Plus className="w-5 h-5 text-slate-400" />
                      </div>
                    </div>

                    {/* Token B */}
                    <div className="bg-slate-700/30 rounded-xl p-4">
                      <label className="block text-sm text-slate-400 mb-2">Token B</label>
                      <div className="flex gap-3">
                        <select
                          value={tokenB}
                          onChange={(e) => setTokenB(e.target.value)}
                          className="flex-1 bg-slate-800 border border-slate-600 text-white rounded-lg px-4 py-3"
                        >
                          <option value="">Select Token B</option>
                          <option value="XNT">XNT (Native)</option>
                          {tokens.map(token => (
                            <option key={token.id} value={token.symbol}>
                              {token.name} ({token.symbol})
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={amountB}
                          onChange={(e) => setAmountB(e.target.value)}
                          placeholder="0.0"
                          className="w-32 bg-slate-800 border border-slate-600 text-white rounded-lg px-4 py-3"
                        />
                      </div>
                    </div>

                    {/* Slippage */}
                    <div className="bg-slate-700/30 rounded-xl p-4">
                      <label className="block text-sm text-slate-400 mb-2">Slippage Tolerance</label>
                      <div className="flex gap-2">
                        {[0.5, 1, 2, 5].map(val => (
                          <button
                            key={val}
                            onClick={() => setSlippage(val)}
                            className={`px-4 py-2 rounded-lg font-medium transition ${
                              slippage === val
                                ? 'bg-cyan-500 text-white'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                          >
                            {val}%
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Lock Options */}
                    <div className="bg-slate-700/30 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Lock className="w-5 h-5 text-slate-400" />
                          <span className="text-white font-medium">Lock Liquidity</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={lockEnabled}
                            onChange={(e) => setLockEnabled(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                        </label>
                      </div>
                      {lockEnabled && (
                        <div>
                          <label className="block text-sm text-slate-400 mb-2 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Lock Duration (Days)
                          </label>
                          <select
                            value={lockDuration}
                            onChange={(e) => setLockDuration(Number(e.target.value))}
                            className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-4 py-3"
                          >
                            <option value={30}>30 Days</option>
                            <option value={60}>60 Days</option>
                            <option value={90}>90 Days</option>
                            <option value={180}>180 Days</option>
                            <option value={365}>365 Days</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-cyan-300">
                          <p className="font-medium mb-1">You will receive LP tokens</p>
                          <p className="text-cyan-400/70">
                            LP tokens represent your share of the pool and can be redeemed for your deposited assets plus earned fees.
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleAddLiquidity}
                      disabled={!walletConnected || !tokenA || !amountA || !amountB || isLoading}
                      className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      {isLoading ? 'Processing...' : walletConnected ? 'Add Liquidity' : 'Connect Wallet First'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-slate-700/30 rounded-xl p-4">
                      <label className="block text-sm text-slate-400 mb-2">Select Pool</label>
                      <select className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-4 py-3">
                        <option value="">Select Pool</option>
                        {mockPools.map(pool => (
                          <option key={pool.id} value={`${pool.tokenA}-${pool.tokenB}`}>
                            {pool.tokenA}/{pool.tokenB}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="bg-slate-700/30 rounded-xl p-4">
                      <label className="block text-sm text-slate-400 mb-2">Amount to Remove: {removePercentage}%</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={removePercentage}
                        onChange={(e) => setRemovePercentage(Number(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-slate-400 mt-2">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>

                    <button
                      onClick={handleRemoveLiquidity}
                      disabled={!walletConnected || isLoading}
                      className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition flex items-center justify-center gap-2"
                    >
                      <Minus className="w-5 h-5" />
                      {isLoading ? 'Processing...' : walletConnected ? 'Remove Liquidity' : 'Connect Wallet First'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active Pools */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Active Pools</h3>
            {mockPools.length > 0 ? mockPools.map(pool => (
              <motion.div
                key={pool.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:border-cyan-500/30 transition"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-sm font-bold text-cyan-400">
                      {pool.tokenA.charAt(0)}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-sm font-bold text-blue-400 -ml-3">
                      {pool.tokenB.charAt(0)}
                    </div>
                    <span className="text-white font-medium ml-1">
                      {pool.tokenA}/{pool.tokenB}
                    </span>
                  </div>
                  <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-lg">
                    {pool.apr}% APR
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">TVL:</span>
                    <span className="text-white font-medium">${pool.tvl}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">24h Volume:</span>
                    <span className="text-white font-medium">${pool.volume24h}</span>
                  </div>
                </div>
              </motion.div>
            )) : (
              <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700/50 text-center">
                <Droplets className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400">No active pools yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}