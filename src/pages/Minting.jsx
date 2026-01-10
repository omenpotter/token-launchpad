import '../components/token/web3/polyfills';
import React, { useState } from 'react';
import { Zap, Flame, TrendingUp, Coins, Layers, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useWallet } from '../components/token/WalletContext';
import SharedHeader from '../components/token/SharedHeader';
import SharedFooter from '../components/token/SharedFooter';
import WalletApprovalModal from '../components/token/WalletApprovalModal';
import MintingTab from '../components/token/MintingTab';
import { web3Service } from '../components/token/web3/Web3Provider';

export default function MintingPage() {
  const { walletConnected, walletAddress } = useWallet();
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalData, setApprovalData] = useState(null);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [selectedTokenForMint, setSelectedTokenForMint] = useState('');
  const [mintAmount, setMintAmount] = useState(100);
  const [burnAmount, setBurnAmount] = useState(0);

  const DIRECT_MINT_FEE = 0.2;

  const { data: createdTokens = [], refetch: refetchTokens } = useQuery({
    queryKey: ['tokens', walletAddress],
    queryFn: async () => {
      const tokens = await base44.entities.Token.filter({ creator: walletAddress });
      return tokens.filter(t => t.network === 'x1Mainnet');
    },
    enabled: walletConnected && !!walletAddress,
    initialData: []
  });

  const { data: allTokens = [] } = useQuery({
    queryKey: ['allTokens'],
    queryFn: async () => {
      const tokens = await base44.entities.Token.list();
      return tokens.filter(t => t.network === 'x1Mainnet');
    },
    initialData: []
  });

  const handleDirectMint = () => {
    if (!walletConnected || !selectedTokenForMint || !mintAmount) {
      alert('Please connect wallet and select token');
      return;
    }

    const token = createdTokens.find(t => t.id === parseInt(selectedTokenForMint));
    if (!token) return;

    // Use token's custom minting fee (default to 0 if not set)
    const userMintFee = token.mintingFee ?? 0;

    setApprovalData({
      type: 'direct_mint',
      title: 'Mint Tokens',
      amount: userMintFee,
      currency: 'XNT',
      details: {
        tokenName: token.name,
        tokenSymbol: token.symbol,
        mintAmount,
        action: userMintFee === 0 ? 'Free Mint' : 'Mint new tokens'
      }
    });
    setShowApprovalModal(true);
  };

  const handleBurn = async () => {
    if (!walletConnected || !selectedTokenForMint || !burnAmount) {
      alert('Please connect wallet and select token');
      return;
    }

    const token = createdTokens.find(t => t.id === parseInt(selectedTokenForMint));
    if (!token) return;

    try {
      const result = await web3Service.burnTokens(token.mint, burnAmount, token.decimals);
      
      await base44.entities.Token.update(token.id, {
        burned: (token.burned || 0) + burnAmount,
        supply: token.supply - burnAmount
      });
      
      await refetchTokens();
      setBurnAmount(0);
      alert(`✅ Burned ${burnAmount} ${token.symbol} tokens!\nTx: ${result.txHash}`);
    } catch (error) {
      alert('Burn failed: ' + error.message);
    }
  };

  const handleApproveTransaction = async () => {
    setApprovalLoading(true);
    try {
      const token = createdTokens.find(t => t.id === parseInt(selectedTokenForMint));
      
      if (token.fairMint && token.maxPerWallet > 0) {
        const totalMintedByUser = (token.totalMinted || 0) + mintAmount;
        if (totalMintedByUser > token.maxPerWallet) {
          throw new Error(`Fair mint limit exceeded. Max per wallet: ${token.maxPerWallet}`);
        }
      }
      
      const userMintFee = token.mintingFee ?? 0;
      const result = await web3Service.mintTokens(token.mint, mintAmount, token.decimals, userMintFee);
      
      await base44.entities.Token.update(token.id, {
        totalMinted: (token.totalMinted || 0) + mintAmount,
        supply: token.supply + mintAmount
      });
      
      await refetchTokens();
      setMintAmount(100);
      alert(`✅ Minted ${mintAmount} tokens!\nTx: ${result.txHash}`);
    } catch (error) {
      alert('Transaction failed: ' + error.message);
    } finally {
      setApprovalLoading(false);
      setShowApprovalModal(false);
      setApprovalData(null);
    }
  };

  // Token Analytics - only count tokens created on this platform
  const platformTokens = allTokens.filter(t => t.creator); // Only tokens with creator (created here)
  const fairMintTokens = platformTokens.filter(t => t.sentForMinting && t.fairMint);
  const presaleTokens = platformTokens.filter(t => t.sentForMinting && !t.fairMint);
  const otherTokens = platformTokens.filter(t => !t.sentForMinting);
  const totalTokens = platformTokens.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <SharedHeader />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar Navigation */}
          <aside className="w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-3">
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase">Navigation</h3>
                <nav className="space-y-2">
                  <Link
                    to={createPageUrl('CreateToken')}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700/50 text-slate-300 hover:text-white transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">Create Token</span>
                  </Link>
                  <Link
                    to={createPageUrl('Dashboard')}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700/50 text-slate-300 hover:text-white transition"
                  >
                    <Layers className="w-4 h-4" />
                    <span className="text-sm font-medium">Dashboard</span>
                  </Link>
                  <Link
                    to={createPageUrl('Launchpad')}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700/50 text-slate-300 hover:text-white transition"
                  >
                    <Flame className="w-4 h-4" />
                    <span className="text-sm font-medium">Launchpad</span>
                  </Link>
                  <Link
                    to={createPageUrl('LiquidityPool')}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700/50 text-slate-300 hover:text-white transition"
                  >
                    <Coins className="w-4 h-4" />
                    <span className="text-sm font-medium">Liquidity Pool</span>
                  </Link>
                  <Link
                    to={createPageUrl('Trade')}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700/50 text-slate-300 hover:text-white transition"
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-medium">Trade</span>
                  </Link>
                  <Link
                    to={createPageUrl('TokenVerification')}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700/50 text-slate-300 hover:text-white transition"
                  >
                    <Zap className="w-4 h-4" />
                    <span className="text-sm font-medium">Token Verification</span>
                  </Link>
                </nav>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-white mb-2">X1Space Launcher</h1>
              <p className="text-slate-400">Mint, burn, and manage tokens on X1 Mainnet</p>
            </div>
            
            <MintingTab
              createdTokens={createdTokens}
              selectedTokenForMint={selectedTokenForMint}
              setSelectedTokenForMint={setSelectedTokenForMint}
              mintAmount={mintAmount}
              setMintAmount={setMintAmount}
              burnAmount={burnAmount}
              setBurnAmount={setBurnAmount}
              walletConnected={walletConnected}
              mintFee={DIRECT_MINT_FEE}
              currency="XNT"
              onMint={handleDirectMint}
              onBurn={handleBurn}
              walletAddress={walletAddress}
            />

            {/* Token Analytics Section */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-white mb-4">Platform Token Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Fair Mint Tokens</p>
                  <p className="text-2xl font-bold text-white">{fairMintTokens.length}</p>
                </div>
              </div>
              <p className="text-xs text-slate-500">Tokens with fair minting enabled</p>
            </div>

                <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Presale Tokens</p>
                      <p className="text-2xl font-bold text-white">{presaleTokens.length}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">Tokens in presale mode</p>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                      <Layers className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Other Tokens</p>
                      <p className="text-2xl font-bold text-white">{otherTokens.length}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">Regular tokens not in minting</p>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                      <Coins className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Total Tokens</p>
                      <p className="text-2xl font-bold text-white">{totalTokens}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">Fair Mint + Presale + Other</p>
                </div>
              </div>

              {/* Token Breakdown */}
              <div className="mt-6 bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                <h4 className="text-sm font-medium text-slate-300 mb-4">Token Distribution</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      <span className="text-sm text-slate-400">Fair Mint Tokens</span>
                    </div>
                    <span className="text-sm font-medium text-white">
                      {fairMintTokens.length} ({totalTokens > 0 ? ((fairMintTokens.length / totalTokens) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full transition-all" 
                      style={{ width: `${totalTokens > 0 ? (fairMintTokens.length / totalTokens) * 100 : 0}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm text-slate-400">Presale Tokens</span>
                    </div>
                    <span className="text-sm font-medium text-white">
                      {presaleTokens.length} ({totalTokens > 0 ? ((presaleTokens.length / totalTokens) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all" 
                      style={{ width: `${totalTokens > 0 ? (presaleTokens.length / totalTokens) * 100 : 0}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                      <span className="text-sm text-slate-400">Other Tokens</span>
                    </div>
                    <span className="text-sm font-medium text-white">
                      {otherTokens.length} ({totalTokens > 0 ? ((otherTokens.length / totalTokens) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-amber-500 h-2 rounded-full transition-all" 
                      style={{ width: `${totalTokens > 0 ? (otherTokens.length / totalTokens) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SharedFooter />

      <WalletApprovalModal 
        isOpen={showApprovalModal} 
        onClose={() => { setShowApprovalModal(false); setApprovalData(null); }} 
        onApprove={handleApproveTransaction} 
        isLoading={approvalLoading} 
        approvalData={approvalData} 
      />
    </div>
  );
}