import '../components/token/web3/polyfills';
import React, { useState, useEffect } from 'react';
import { Droplets, Wallet, LogOut, Coins, MessageCircle, Twitter, Lock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { web3Service } from '../components/token/web3/Web3Provider';
import WalletConnectModal from '../components/token/WalletConnectModal';

export default function LiquidityPoolPage() {
  const [selectedToken, setSelectedToken] = useState('');
  const [pairToken, setPairToken] = useState('native');
  const [liquidityAmount, setLiquidityAmount] = useState('0.1');
  const [liquidityLockPeriod, setLiquidityLockPeriod] = useState(180);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [createLiquidity, setCreateLiquidity] = useState(true);

  const { data: tokens = [] } = useQuery({
    queryKey: ['tokens'],
    queryFn: () => base44.entities.Token.list(),
    initialData: []
  });

  const totalTokens = tokens.length;

  useEffect(() => {
    web3Service.initConnection('x1Testnet');
  }, []);

  const connectBackpack = async () => {
    try {
      if (window.backpack) {
        const result = await web3Service.connectWallet(window.backpack);
        setWalletAddress(result.address);
        setWalletConnected(true);
        setShowWalletModal(false);
      } else {
        alert('Backpack wallet not found. Please install Backpack from https://backpack.app');
      }
    } catch (error) {
      console.error('Backpack connection error:', error);
      alert('Failed to connect Backpack: ' + error.message);
    }
  };

  const connectPhantom = async () => {
    try {
      if (window.phantom?.solana) {
        const result = await web3Service.connectWallet(window.phantom.solana);
        setWalletAddress(result.address);
        setWalletConnected(true);
        setShowWalletModal(false);
      } else {
        alert('Phantom wallet not found. Please install Phantom from https://phantom.app');
      }
    } catch (error) {
      console.error('Phantom connection error:', error);
      alert('Failed to connect Phantom: ' + error.message);
    }
  };

  const disconnectWallet = async () => {
    await web3Service.disconnect();
    setWalletConnected(false);
    setWalletAddress('');
  };

  const handleAddLiquidity = async () => {
    if (!selectedToken || !pairToken || !liquidityAmount) {
      alert('Please fill in all fields');
      return;
    }
    if (!walletConnected) {
      alert('Please connect wallet first');
      return;
    }
    
    setIsLoading(true);
    try {
      const token = tokens.find(t => t.id === parseInt(selectedToken));
      const result = await web3Service.addLiquidity(
        'x1Testnet',
        token.mint,
        parseFloat(liquidityAmount),
        parseFloat(liquidityAmount),
        token.decimals
      );
      
      alert(`✅ Liquidity added successfully!\nTx: ${result.txHash}\nLocked for ${liquidityLockPeriod === 999999 ? 'forever' : `${liquidityLockPeriod} days`}`);
      setLiquidityAmount('0.1');
    } catch (error) {
      alert('Failed to add liquidity: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const lockPeriodOptions = [
    { value: 0, label: 'No Lock' },
    { value: 30, label: '30 Days' },
    { value: 90, label: '90 Days' },
    { value: 180, label: '6 Months' },
    { value: 365, label: '1 Year' },
    { value: 730, label: '2 Years' },
    { value: 999999, label: 'Forever' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-900/80 border-b border-slate-800/50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Coins className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">X1Space Launcher</h1>
                <p className="text-xs text-slate-400">Create, mint & launch tokens</p>
              </div>
            </div>

            {walletConnected ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-sm text-slate-300 font-mono">
                    {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
                  </span>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition border border-red-500/20"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Disconnect</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowWalletModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl transition font-medium"
              >
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Nav Links */}
      <nav className="bg-slate-900/50 border-b border-slate-800/50">
        <div className="max-w-6xl mx-auto px-4 py-2">
          <div className="flex items-center gap-4 text-sm">
            <a href="https://xdex.xyz" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-cyan-400 transition">
              xDEX
            </a>
            <a href="https://t.me/xdex_xyz" target="_blank" rel="noopener noreferrer" title="Telegram">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695ece00f88266143b4441ac/3166166d8_Telegram_2019_Logosvg1.jpg" alt="Telegram" className="w-5 h-5 rounded-full hover:opacity-80 transition" />
            </a>
            <a href="https://x.com/rkbehelvi" target="_blank" rel="noopener noreferrer" title="X">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695ece00f88266143b4441ac/2e2eecb01_31AGs2bX7mL.png" alt="X" className="w-5 h-5 hover:opacity-80 transition" />
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <p className="text-slate-400 text-sm mb-1">Tokens Created</p>
            <p className="text-2xl font-bold text-white">{totalTokens}</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <p className="text-slate-400 text-sm mb-1">Total Liquidity</p>
            <p className="text-2xl font-bold text-white">$0</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <p className="text-slate-400 text-sm mb-1">Active Pools</p>
            <p className="text-2xl font-bold text-white">0</p>
          </div>
        </div>

        {/* Liquidity Pool Section */}
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <Droplets className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Liquidity Pool</h3>
                <p className="text-xs text-slate-400">Create and lock liquidity for your token</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={createLiquidity}
                onChange={(e) => setCreateLiquidity(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
          </div>

          {createLiquidity && (
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Select Token</label>
                  <select
                    value={selectedToken}
                    onChange={(e) => setSelectedToken(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition"
                  >
                    <option value="">Choose token...</option>
                    {tokens.map(token => (
                      <option key={token.id} value={token.id}>
                        {token.name} ({token.symbol})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Pair With</label>
                  <select
                    value={pairToken}
                    onChange={(e) => setPairToken(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition"
                  >
                    <option value="native">XNT (Native)</option>
                    {tokens.map(token => (
                      <option key={token.id} value={token.symbol}>
                        {token.name} ({token.symbol})
                      </option>
                    ))}
                    <option value="usdc">USDC</option>
                    <option value="usdt">USDT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">XNT Amount for Liquidity</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={liquidityAmount}
                      onChange={(e) => setLiquidityAmount(e.target.value)}
                      step="0.1"
                      placeholder="0.1"
                      className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 pr-16 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">XNT</span>
                  </div>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={handleAddLiquidity}
                    disabled={!walletConnected || !selectedToken || isLoading}
                    className="w-full px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white rounded-xl transition font-medium"
                  >
                    {isLoading ? 'Adding...' : 'Add Liquidity on xDEX'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  Lock Period
                </label>
                <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
                  {lockPeriodOptions.map((period) => (
                    <button
                      key={period.value}
                      onClick={() => setLiquidityLockPeriod(period.value)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                        liquidityLockPeriod === period.value
                          ? 'bg-cyan-500 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {period.label}
                    </button>
                  ))}
                </div>
              </div>

              {liquidityLockPeriod > 0 && (
                <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-amber-300 font-medium">Liquidity will be locked</p>
                    <p className="text-xs text-amber-400/70 mt-1">
                      {liquidityLockPeriod === 999999
                        ? 'Liquidity will be permanently locked and cannot be withdrawn.'
                        : `You won't be able to remove liquidity for ${liquidityLockPeriod} days after creation.`
                      }
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-300">
                    A portion of your token supply will be paired with XNT to create the initial liquidity pool.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-800/50 bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="text-slate-400 text-sm">© 2026 X1Space Launcher. All rights reserved.</p>
            </div>
            <div className="flex items-center gap-6">
              <a href="https://xdex.xyz" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-cyan-400 transition text-sm">
                xDEX.xyz
              </a>
              <a href="https://t.me/xdex_xyz" target="_blank" rel="noopener noreferrer" title="Telegram">
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695ece00f88266143b4441ac/3166166d8_Telegram_2019_Logosvg1.jpg" alt="Telegram" className="w-5 h-5 rounded-full hover:opacity-80 transition" />
              </a>
              <a href="https://x.com/rkbehelvi" target="_blank" rel="noopener noreferrer" title="X">
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695ece00f88266143b4441ac/2e2eecb01_31AGs2bX7mL.png" alt="X" className="w-5 h-5 hover:opacity-80 transition" />
              </a>
            </div>
          </div>
        </div>
      </footer>

      <WalletConnectModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onConnectBackpack={connectBackpack}
        onConnectPhantom={connectPhantom}
      />
    </div>
  );
}