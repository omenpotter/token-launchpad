import React, { useState } from 'react';
import { Droplets, Lock, AlertCircle, Plus, ExternalLink, DollarSign, TrendingUp, Wallet as WalletIcon, ArrowUpDown, ArrowLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useWallet } from '../components/token/WalletContext';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
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
    queryFn: async () => {
      const allTokens = walletAddress 
        ? await base44.entities.Token.filter({ creator: walletAddress }) 
        : await base44.entities.Token.list();
      return allTokens.filter(t => t.network === 'x1Mainnet');
    },
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
    if (!selectedToken || !liquidityAmount || !tokenAmount) {
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
      // Open xDEX to add liquidity manually since API integration is in progress
      window.open(`https://app.xdex.xyz/liquidity?token=${selectedTokenData.mint}`, '_blank');
      alert(`Opening xDEX to add liquidity for ${selectedTokenData.symbol}.\n\nToken: ${tokenAmount} ${selectedTokenData.symbol}\nXNT: ${liquidityAmount}\nLock: ${liquidityLockPeriod === 999999 ? 'Forever' : `${liquidityLockPeriod} days`}`);
      setTokenAmount('1000');
      setLiquidityAmount('0.1');
    } catch (error) {
      console.error('Add liquidity error:', error);
      alert('Failed to open xDEX: ' + (error.message || 'Unknown error'));
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
      // Open xDEX to remove liquidity manually since API integration is in progress
      window.open('https://app.xdex.xyz/liquidity', '_blank');
      alert(`Opening xDEX to remove ${removePercentage}% of your liquidity.`);
    } catch (error) {
      console.error('Remove liquidity error:', error);
      alert('Failed to open xDEX: ' + (error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePool = () => {
    window.open('https://app.xdex.xyz/liquidity', '_blank');
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
        <div className="flex items-center gap-4 mb-6">
          <Link
            to={createPageUrl('Minting')}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Minting</span>
          </Link>
          <div className="flex gap-3 ml-auto">
            <Link to={createPageUrl('Dashboard')} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition">
              Dashboard
            </Link>
            <Link to={createPageUrl('Launchpad')} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition">
              Launchpad
            </Link>
            <Link to={createPageUrl('LiquidityPool')} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition">
              Liquidity
            </Link>
            <Link to={createPageUrl('Trade')} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition">
              Trade
            </Link>
          </div>
        </div>
        
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


      </main>

      <SharedFooter />
    </div>
  );
}