import '../components/token/web3/polyfills';
import React, { useState, useEffect } from 'react';
import { Wallet, Coins, LogOut, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { web3Service } from '../components/token/web3/Web3Provider';
import WalletConnectModal from '../components/token/WalletConnectModal';
import WalletApprovalModal from '../components/token/WalletApprovalModal';
import LaunchpadTab from '../components/token/LaunchpadTab';
import PresaleDetailModal from '../components/token/PresaleDetailModal';
import InvestModal from '../components/token/InvestModal';

export default function LaunchpadPage() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalData, setApprovalData] = useState(null);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [presales, setPresales] = useState([]);
  const [selectedPresale, setSelectedPresale] = useState(null);
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [investAmount, setInvestAmount] = useState(0);
  const [selectedTokenForPresale, setSelectedTokenForPresale] = useState('');

  const PRESALE_CREATION_FEE = 0.2;

  const { data: createdTokens = [] } = useQuery({
    queryKey: ['tokens', walletAddress],
    queryFn: () => base44.entities.Token.filter({ creator: walletAddress }),
    enabled: walletConnected && !!walletAddress,
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

  const handleCreatePresale = (presaleData) => {
    if (!walletConnected) {
      alert('Please connect wallet first');
      return;
    }

    const token = createdTokens.find(t => t.id === parseInt(presaleData.tokenId));
    if (!token) return;

    setApprovalData({
      type: 'presale_creation',
      title: 'Create Presale',
      amount: PRESALE_CREATION_FEE,
      currency: 'XNT',
      details: {
        tokenName: token.name,
        tokenSymbol: token.symbol,
        action: `Create presale: ${presaleData.name}`
      },
      presaleData: { ...presaleData, token }
    });
    setShowApprovalModal(true);
  };

  const handleApproveTransaction = async () => {
    setApprovalLoading(true);
    try {
      if (approvalData.type === 'presale_creation') {
        const { presaleData } = approvalData;
        const token = presaleData.token;

        const result = await web3Service.createPresale('x1Testnet', {
          tokenAddress: token.mint,
          softCap: presaleData.softCap,
          hardCap: presaleData.hardCap,
          startDate: presaleData.startDate,
          endDate: presaleData.endDate,
          minContribution: presaleData.minContribution,
          maxContribution: presaleData.maxContribution
        }, PRESALE_CREATION_FEE);

        const newPresale = {
          id: Date.now(),
          tokenName: token.name,
          tokenSymbol: token.symbol,
          presaleName: presaleData.name,
          presaleDescription: presaleData.description,
          softCap: presaleData.softCap,
          hardCap: presaleData.hardCap,
          pricingTiers: presaleData.pricingTiers,
          liquidity: presaleData.liquidity,
          currency: 'XNT',
          status: 'upcoming',
          raised: 0,
          investors: 0,
          createdAt: new Date().toLocaleString(),
          presaleAddress: result.presaleAddress,
          txHash: result.txHash
        };

        setPresales([newPresale, ...presales]);
        alert(`✅ Presale created!\nAddress: ${result.presaleAddress}\nTx: ${result.txHash}`);
      } else if (approvalData.type === 'presale_investment') {
        const result = await web3Service.investInPresale(
          selectedPresale.presaleAddress || '0x1234567890',
          investAmount
        );

        const updatedPresales = presales.map(p => {
          if (p.id === selectedPresale.id) {
            return {
              ...p,
              raised: p.raised + investAmount,
              investors: p.investors + 1,
              status: p.raised + investAmount >= p.hardCap ? 'completed' : 
                      p.raised + investAmount >= p.softCap ? 'active' : p.status
            };
          }
          return p;
        });
        setPresales(updatedPresales);
        setSelectedPresale(null);
        setInvestAmount(0);

        alert(`✅ Investment successful!\nAmount: ${investAmount} XNT\nTx: ${result.txHash}`);
      }
    } catch (error) {
      alert('Transaction failed: ' + error.message);
    } finally {
      setApprovalLoading(false);
      setShowApprovalModal(false);
      setApprovalData(null);
    }
  };

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
        <LaunchpadTab
          createdTokens={createdTokens}
          presales={presales}
          walletConnected={walletConnected}
          presaleFee={PRESALE_CREATION_FEE}
          currency="XNT"
          onCreatePresale={handleCreatePresale}
          onViewPresale={(presale) => setSelectedPresale(presale)}
          selectedTokenForPresale={selectedTokenForPresale}
          setSelectedTokenForPresale={setSelectedTokenForPresale}
        />
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
      <PresaleDetailModal presale={selectedPresale} onClose={() => setSelectedPresale(null)} onInvest={(presale) => { setShowInvestModal(true); setInvestAmount(0); }} walletConnected={walletConnected} />
      <InvestModal isOpen={showInvestModal} onClose={() => { setShowInvestModal(false); setInvestAmount(0); }} presale={selectedPresale} investAmount={investAmount} setInvestAmount={setInvestAmount} currency="XNT" onConfirm={() => {
        setApprovalData({
          type: 'presale_investment',
          title: 'Invest in Presale',
          amount: investAmount,
          currency: 'XNT',
          details: {
            tokenName: selectedPresale.tokenName,
            tokenSymbol: selectedPresale.tokenSymbol,
            action: `Invest ${investAmount} XNT`
          }
        });
        setShowInvestModal(false);
        setShowApprovalModal(true);
      }} />
    </div>
  );
}