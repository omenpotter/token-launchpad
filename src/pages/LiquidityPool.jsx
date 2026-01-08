import React, { useState } from 'react';
import { Droplets, Lock, AlertCircle, Plus, ExternalLink, DollarSign, TrendingUp, Wallet as WalletIcon, ArrowUpDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useWallet } from '../components/token/WalletContext';
import SharedHeader from '../components/token/SharedHeader';
import SharedFooter from '../components/token/SharedFooter';
import { web3Service } from '../components/token/web3/Web3Provider';

export default function LiquidityPoolPage() {
  const { walletConnected, walletAddress } = useWallet();
  const [selectedToken, setSelectedToken] = useState('');
  const [pairToken, setPairToken] = useState('native');
  const [tokenAmount, setTokenAmount] = useState('1000');
  const [liquidityAmount, setLiquidityAmount] = useState('0.1');
  const [liquidityLockPeriod, setLiquidityLockPeriod] = useState(180);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('add');
  const [removePercentage, setRemovePercentage] = useState(25);

  const { data: tokens = [] } = useQuery({
    queryKey: ['tokens', walletAddress],
    queryFn: () => walletAddress ? base44.entities.Token.filter({ creator: walletAddress }) : base44.entities.Token.list(),
    initialData: []
  });

  const selectedTokenData = tokens.find(t => t.id?.toString() === selectedToken);

  // Mock LP data
  const mockLPData = {
    balance: 0,
    share: 0,
    tokenAmount: 0,
    xntAmount: 0,
    estimatedEarnings: 0,
    apr: 12.5
  };

  const handleAddLiquidity = async () => {
    if (!selectedToken || !liquidityAmount) {
      alert('Please select a token and enter amounts');
      return;
    }
    if (!walletConnected) {
      alert('Please connect wallet first');
      return;
    }
    if (!selectedTokenData || !selectedTokenData.mint) {
      alert('Invalid token selected. Please select a valid token.');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await web3Service.addLiquidity(
        'x1Testnet',
        selectedTokenData.mint,
        parseFloat(tokenAmount),
        parseFloat(liquidityAmount),
        selectedTokenData.decimals || 9
      );
      
      alert(`✅ Liquidity added successfully!\nTx: ${result.txHash}\nLocked for ${liquidityLockPeriod === 999999 ? 'forever' : `${liquidityLockPeriod} days`}`);
      setTokenAmount('1000');
      setLiquidityAmount('0.1');
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
    alert(`Remove ${removePercentage}% of liquidity - Coming soon via xDEX integration`);
  };

  const handleCreatePool = () => {
    if (!selectedToken) {
      alert('Please select a token first');
      return;
    }
    window.open('https://app.xdex.xyz/liquidity/add', '_blank');
  };

  const handleSwap = () => {
    window.open('https://app.xdex.xyz/swap', '_blank');
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
      <SharedHeader />

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats Grid */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <WalletIcon className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Your LP Balance</p>
                <p className="text-xl font-bold text-white">{mockLPData.balance.toFixed(4)}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Pool Share</p>
                <p className="text-xl font-bold text-white">{mockLPData.share.toFixed(2)}%</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Est. Daily Earnings</p>
                <p className="text-xl font-bold text-white">${mockLPData.estimatedEarnings.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Droplets className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Current APR</p>
                <p className="text-xl font-bold text-white">{mockLPData.apr}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={handleCreatePool}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl transition font-medium"
          >
            <Plus className="w-4 h-4" />
            Create New Pool on xDEX
          </button>
          <button
            onClick={handleSwap}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition font-medium"
          >
            <ArrowUpDown className="w-4 h-4" />
            Swap on xDEX
          </button>
          <a
            href="https://app.xdex.xyz/liquidity"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            View All Pools on xDEX
          </a>
        </div>

        {/* Liquidity Management */}
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  <Droplets className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Liquidity Pool Management</h3>
                  <p className="text-xs text-slate-400">Add or remove liquidity for your tokens</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('add')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    activeTab === 'add' ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Add Liquidity
                </button>
                <button
                  onClick={() => setActiveTab('remove')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    activeTab === 'remove' ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Remove Liquidity
                </button>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {activeTab === 'add' ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Select Your Token</label>
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
                      {tokens.filter(t => t.id?.toString() !== selectedToken).map(token => (
                        <option key={token.id} value={token.symbol}>
                          {token.name} ({token.symbol})
                        </option>
                      ))}
                      <option value="usdc">USDC</option>
                      <option value="usdt">USDT</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Token Amount</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={tokenAmount}
                        onChange={(e) => setTokenAmount(e.target.value)}
                        placeholder="1000"
                        className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 pr-20 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                        {selectedTokenData?.symbol || 'TOKEN'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">XNT Amount</label>
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

                <button
                  onClick={handleAddLiquidity}
                  disabled={!walletConnected || !selectedToken || isLoading}
                  className="w-full px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white rounded-xl transition font-medium"
                >
                  {isLoading ? 'Adding Liquidity...' : walletConnected ? 'Add Liquidity' : 'Connect Wallet First'}
                </button>
              </>
            ) : (
              <>
                <div className="bg-slate-700/30 rounded-xl p-4 mb-4">
                  <p className="text-sm text-slate-400 mb-2">Your LP Position</p>
                  <div className="flex justify-between items-center">
                    <span className="text-white font-medium">{mockLPData.balance.toFixed(4)} LP Tokens</span>
                    <span className="text-slate-400 text-sm">${(mockLPData.balance * 0).toFixed(2)} USD</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Amount to Remove: {removePercentage}%</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={removePercentage}
                    onChange={(e) => setRemovePercentage(Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <div className="flex justify-between mt-2">
                    {[25, 50, 75, 100].map(pct => (
                      <button
                        key={pct}
                        onClick={() => setRemovePercentage(pct)}
                        className={`px-3 py-1 rounded-lg text-sm transition ${
                          removePercentage === pct ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-slate-700/30 rounded-xl p-3">
                    <p className="text-xs text-slate-400">You will receive</p>
                    <p className="text-white font-medium">{((mockLPData.tokenAmount * removePercentage) / 100).toFixed(2)} Tokens</p>
                  </div>
                  <div className="bg-slate-700/30 rounded-xl p-3">
                    <p className="text-xs text-slate-400">You will receive</p>
                    <p className="text-white font-medium">{((mockLPData.xntAmount * removePercentage) / 100).toFixed(4)} XNT</p>
                  </div>
                </div>

                <button
                  onClick={handleRemoveLiquidity}
                  disabled={!walletConnected || mockLPData.balance === 0}
                  className="w-full px-4 py-3 bg-red-600 hover:bg-red-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-xl transition font-medium mt-4"
                >
                  {walletConnected ? 'Remove Liquidity' : 'Connect Wallet First'}
                </button>
              </>
            )}

            <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mt-4">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-300">
                  Liquidity operations are processed through xDEX. Your tokens will be paired with XNT to create the liquidity pool.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SharedFooter />
    </div>
  );
}