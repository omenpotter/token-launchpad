import '../components/token/web3/polyfills';
import React, { useState, useEffect } from 'react';
import { Wallet, Coins, LogOut, ArrowLeft, Zap, Flame, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { web3Service } from '../components/token/web3/Web3Provider';
import WalletConnectModal from '../components/token/WalletConnectModal';
import WalletApprovalModal from '../components/token/WalletApprovalModal';
import MintingTab from '../components/token/MintingTab';

export default function MintingPage() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalData, setApprovalData] = useState(null);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [selectedTokenForMint, setSelectedTokenForMint] = useState('');
  const [mintAmount, setMintAmount] = useState(100);
  const [burnAmount, setBurnAmount] = useState(0);

  const DIRECT_MINT_FEE = 0.2;

  const { data: createdTokens = [], refetch: refetchTokens } = useQuery({
    queryKey: ['tokens', walletAddress],
    queryFn: () => base44.entities.Token.filter({ creator: walletAddress }),
    enabled: walletConnected && !!walletAddress,
    initialData: []
  });

  const { data: allTokens = [] } = useQuery({
    queryKey: ['allTokens'],
    queryFn: () => base44.entities.Token.list(),
    initialData: []
  });

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
        alert('Backpack wallet not found');
      }
    } catch (error) {
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
        alert('Phantom wallet not found');
      }
    } catch (error) {
      alert('Failed to connect Phantom: ' + error.message);
    }
  };

  const disconnectWallet = async () => {
    await web3Service.disconnect();
    setWalletConnected(false);
    setWalletAddress('');
  };

  const handleDirectMint = () => {
    if (!walletConnected || !selectedTokenForMint || !mintAmount) {
      alert('Please connect wallet and select token');
      return;
    }

    const token = createdTokens.find(t => t.id === parseInt(selectedTokenForMint));
    if (!token) return;

    setApprovalData({
      type: 'direct_mint',
      title: 'Mint Tokens',
      amount: DIRECT_MINT_FEE,
      currency: 'XNT',
      details: {
        tokenName: token.name,
        tokenSymbol: token.symbol,
        mintAmount,
        action: 'Mint new tokens'
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
      
      const result = await web3Service.mintTokens(token.mint, mintAmount, token.decimals, DIRECT_MINT_FEE);
      
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

  const fairMintTokens = allTokens.filter(t => t.sentForMinting && t.fairMint);
  const presaleTokens = allTokens.filter(t => t.sentForMinting);
  const totalTokens = allTokens.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-900/80 border-b border-slate-800/50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={createPageUrl('X1TokenLauncher')} className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition border border-slate-700/50">
                <ArrowLeft className="w-4 h-4 text-slate-400" />
              </Link>
              <Link to={createPageUrl('X1TokenLauncher')} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Coins className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">X1Space Launcher</h1>
                  <p className="text-xs text-slate-400">Create, mint & launch tokens</p>
                </div>
              </Link>
            </div>

            {walletConnected ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-sm text-slate-300 font-mono">
                    {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
                  </span>
                </div>
                <button onClick={disconnectWallet} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition border border-red-500/20">
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Disconnect</span>
                </button>
              </div>
            ) : (
              <button onClick={() => setShowWalletModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl transition font-medium">
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </header>

      <nav className="bg-slate-900/50 border-b border-slate-800/50">
        <div className="max-w-6xl mx-auto px-4 py-2">
          <div className="flex items-center gap-4 text-sm">
            <a href="https://xdex.xyz" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-cyan-400 transition">xDEX</a>
            <a href="https://t.me/xdex_xyz" target="_blank" rel="noopener noreferrer" title="Telegram">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695ece00f88266143b4441ac/3166166d8_Telegram_2019_Logosvg1.jpg" alt="Telegram" className="w-5 h-5 rounded-full hover:opacity-80 transition" />
            </a>
            <a href="https://x.com/rkbehelvi" target="_blank" rel="noopener noreferrer" title="X">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695ece00f88266143b4441ac/2e2eecb01_31AGs2bX7mL.png" alt="X" className="w-5 h-5 hover:opacity-80 transition" />
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6">
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

        {/* Analytics Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <p className="text-xs text-slate-500">Tokens available for public minting</p>
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
            <p className="text-xs text-slate-500">All tokens created on platform</p>
          </div>
        </div>
      </main>

      <footer className="mt-12 border-t border-slate-800/50 bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-400 text-sm">© 2026 X1Space Launcher. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="https://xdex.xyz" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-cyan-400 transition text-sm">xDEX.xyz</a>
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

      <WalletConnectModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} onConnectBackpack={connectBackpack} onConnectPhantom={connectPhantom} />
      <WalletApprovalModal isOpen={showApprovalModal} onClose={() => { setShowApprovalModal(false); setApprovalData(null); }} onApprove={handleApproveTransaction} isLoading={approvalLoading} approvalData={approvalData} />
    </div>
  );
}