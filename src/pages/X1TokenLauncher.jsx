import React, { useState } from 'react';
import { Wallet, Coins, Zap, LayoutDashboard, Rocket, LogOut, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import WalletConnectModal from '../components/token/WalletConnectModal';
import WalletApprovalModal from '../components/token/WalletApprovalModal';
import CreateTokenTab from '../components/token/CreateTokenTab';
import DirectMintTab from '../components/token/DirectMintTab';
import DashboardTab from '../components/token/DashboardTab';
import LaunchpadTab from '../components/token/LaunchpadTab';
import TradeTab from '../components/token/TradeTab';
import PresaleDetailModal from '../components/token/PresaleDetailModal';
import InvestModal from '../components/token/InvestModal';

export default function X1TokenLauncher() {
  // Network & Token
  const [network, setNetwork] = useState('x1Testnet');
  const [tokenType, setTokenType] = useState('SPL');
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [decimals, setDecimals] = useState(9);
  const [supply, setSupply] = useState(1000000);
  const [tokenLogo, setTokenLogo] = useState('');
  const [tokenWebsite, setTokenWebsite] = useState('');
  const [tokenDescription, setTokenDescription] = useState('');
  
  // Advanced Options
  const [lockMintAuthority, setLockMintAuthority] = useState(false);
  const [whitelistEnabled, setWhitelistEnabled] = useState(false);
  const [whitelistAddresses, setWhitelistAddresses] = useState('');
  const [fairMintEnabled, setFairMintEnabled] = useState(false);
  const [maxPerWallet, setMaxPerWallet] = useState(1000);
  const [immutableToken, setImmutableToken] = useState(false);
  
  // Wallet
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [showWalletModal, setShowWalletModal] = useState(false);
  
  // Approval Modal
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalData, setApprovalData] = useState(null);
  const [approvalLoading, setApprovalLoading] = useState(false);
  
  // Data
  const [createdTokens, setCreatedTokens] = useState([]);
  const [presales, setPresales] = useState([]);
  
  // Direct Mint
  const [selectedTokenForMint, setSelectedTokenForMint] = useState('');
  const [mintAmount, setMintAmount] = useState(100);
  const [burnAmount, setBurnAmount] = useState(0);
  
  // UI
  const [activeTab, setActiveTab] = useState('create');

  // Fees
  const TOKEN_CREATION_FEE = 0.2;
  const DIRECT_MINT_FEE = 0.2;
  const PRESALE_CREATION_FEE = 0.2;

  const getNativeCurrency = () => {
    return network.includes('x1') ? 'XNT' : 'SOL';
  };

  const connectBackpack = async () => {
    try {
      const backpack = window.backpack || window.backpackSolana;
      if (backpack) {
        const response = await backpack.connect();
        setWalletAddress(response.publicKey.toString());
        setWalletConnected(true);
        setShowWalletModal(false);
      } else {
        alert('Backpack wallet not installed. Download from https://backpack.app');
      }
    } catch (error) {
      console.error('Backpack connection error:', error);
      alert('Failed to connect Backpack wallet');
    }
  };

  const connectPhantom = async () => {
    try {
      if (window.solana && window.solana.isPhantom) {
        const response = await window.solana.connect();
        setWalletAddress(response.publicKey.toString());
        setWalletConnected(true);
        setShowWalletModal(false);
      } else {
        alert('Phantom wallet not installed. Download from https://phantom.app');
      }
    } catch (error) {
      alert('Failed to connect Phantom wallet');
    }
  };

  const disconnectWallet = () => {
    setWalletConnected(false);
    setWalletAddress('');
  };

  // Token Creation
  const handleCreateToken = () => {
    if (!walletConnected) {
      alert('Please connect wallet first');
      return;
    }
    if (!tokenName || !tokenSymbol) {
      alert('Please fill in name and symbol');
      return;
    }

    setApprovalData({
      type: 'token_creation',
      title: 'Create Token',
      amount: TOKEN_CREATION_FEE,
      currency: getNativeCurrency(),
      details: {
        tokenName,
        tokenSymbol,
        tokenType,
        supply,
        decimals
      }
    });
    setShowApprovalModal(true);
  };

  // Direct Mint
  const handleDirectMint = () => {
    if (!walletConnected) {
      alert('Please connect wallet first');
      return;
    }
    if (!selectedTokenForMint || !mintAmount) {
      alert('Select token and enter amount');
      return;
    }

    const token = createdTokens.find(t => t.id === parseInt(selectedTokenForMint));
    if (!token) return;

    setApprovalData({
      type: 'direct_mint',
      title: 'Mint Tokens',
      amount: DIRECT_MINT_FEE,
      currency: getNativeCurrency(),
      details: {
        tokenName: token.name,
        tokenSymbol: token.symbol,
        mintAmount,
        action: 'Mint new tokens'
      }
    });
    setShowApprovalModal(true);
  };

  // Burn Tokens
  const handleBurn = () => {
    if (!walletConnected) {
      alert('Please connect wallet first');
      return;
    }
    if (!selectedTokenForMint || !burnAmount) {
      alert('Select token and enter amount');
      return;
    }

    const token = createdTokens.find(t => t.id === parseInt(selectedTokenForMint));
    if (!token) return;

    // Burning is free, just update the token
    const updatedTokens = createdTokens.map(t => {
      if (t.id === parseInt(selectedTokenForMint)) {
        return { ...t, burned: (t.burned || 0) + burnAmount };
      }
      return t;
    });
    setCreatedTokens(updatedTokens);
    setBurnAmount(0);
    alert(`Successfully burned ${burnAmount} ${token.symbol} tokens!`);
  };

  // Create Presale
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
      currency: getNativeCurrency(),
      details: {
        tokenName: token.name,
        tokenSymbol: token.symbol,
        action: `Create presale: ${presaleData.name}`
      },
      presaleData: { ...presaleData, token }
    });
    setShowApprovalModal(true);
  };

  // Approve Transaction
  const handleApproveTransaction = async () => {
    setApprovalLoading(true);
    
    try {
      // Simulate wallet transaction
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (approvalData.type === 'presale_investment') {
        // Handle presale investment
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
        
        alert(`✅ Investment successful!\nAmount: ${investAmount} ${getNativeCurrency()}`);
      }
      else if (approvalData.type === 'token_creation') {
        const mockMint = Math.random().toString(36).substring(2, 12) + '...';
        
        const newToken = {
          id: Date.now(),
          name: approvalData.details.tokenName,
          symbol: approvalData.details.tokenSymbol,
          mint: mockMint,
          type: approvalData.details.tokenType,
          decimals: approvalData.details.decimals,
          supply: approvalData.details.supply,
          network,
          logo: tokenLogo,
          website: tokenWebsite,
          description: tokenDescription,
          lockMint: lockMintAuthority,
          whitelist: whitelistEnabled,
          fairMint: fairMintEnabled,
          immutable: immutableToken,
          totalMinted: 0,
          burned: 0,
          timestamp: new Date().toLocaleString()
        };
        
        setCreatedTokens([newToken, ...createdTokens]);
        setTokenName('');
        setTokenSymbol('');
        setTokenLogo('');
        setTokenWebsite('');
        setTokenDescription('');
        setLockMintAuthority(false);
        setWhitelistAddresses('');
        setWhitelistEnabled(false);
        setFairMintEnabled(false);
        setImmutableToken(false);
        
        alert(`✅ Token created successfully!\nMint: ${mockMint}\nFee: ${approvalData.amount} ${approvalData.currency}`);
      } 
      else if (approvalData.type === 'direct_mint') {
        const updatedTokens = createdTokens.map(t => {
          if (t.id === parseInt(selectedTokenForMint)) {
            return { ...t, totalMinted: (t.totalMinted || 0) + mintAmount };
          }
          return t;
        });
        setCreatedTokens(updatedTokens);
        setMintAmount(100);
        
        alert(`✅ Successfully minted ${approvalData.details.mintAmount} tokens!\nFee: ${approvalData.amount} ${approvalData.currency}`);
      }
      else if (approvalData.type === 'presale_creation') {
        const { presaleData } = approvalData;
        const newPresale = {
          id: Date.now(),
          tokenName: presaleData.token.name,
          tokenSymbol: presaleData.token.symbol,
          presaleName: presaleData.name,
          presaleDescription: presaleData.description,
          softCap: presaleData.softCap,
          hardCap: presaleData.hardCap,
          pricingTiers: presaleData.pricingTiers,
          liquidity: presaleData.liquidity,
          currency: getNativeCurrency(),
          status: 'upcoming',
          raised: 0,
          investors: 0,
          createdAt: new Date().toLocaleString()
        };
        
        setPresales([newPresale, ...presales]);
        alert(`✅ Presale created successfully!\nFee: ${approvalData.amount} ${approvalData.currency}`);
      }
    } catch (error) {
      alert('Transaction failed: ' + error.message);
    } finally {
      setApprovalLoading(false);
      setShowApprovalModal(false);
      setApprovalData(null);
    }
  };

  const tabs = [
    { id: 'create', label: 'Create Token', icon: Coins },
    { id: 'directmint', label: 'Direct Mint', icon: Zap },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'launchpad', label: 'Launchpad', icon: Rocket },
    { id: 'trade', label: 'Trade', icon: TrendingUp }
  ];
  
  const [selectedPresale, setSelectedPresale] = useState(null);
  const [investAmount, setInvestAmount] = useState(0);
  const [showInvestModal, setShowInvestModal] = useState(false);

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
                <h1 className="text-xl font-bold text-white">X1 Token Launcher</h1>
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

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex overflow-x-auto gap-2 mb-6 pb-2 scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300 border border-transparent'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'create' && (
              <CreateTokenTab
                network={network}
                setNetwork={setNetwork}
                tokenType={tokenType}
                setTokenType={setTokenType}
                tokenName={tokenName}
                setTokenName={setTokenName}
                tokenSymbol={tokenSymbol}
                setTokenSymbol={setTokenSymbol}
                decimals={decimals}
                setDecimals={setDecimals}
                supply={supply}
                setSupply={setSupply}
                tokenLogo={tokenLogo}
                setTokenLogo={setTokenLogo}
                tokenWebsite={tokenWebsite}
                setTokenWebsite={setTokenWebsite}
                tokenDescription={tokenDescription}
                setTokenDescription={setTokenDescription}
                lockMintAuthority={lockMintAuthority}
                setLockMintAuthority={setLockMintAuthority}
                whitelistEnabled={whitelistEnabled}
                setWhitelistEnabled={setWhitelistEnabled}
                whitelistAddresses={whitelistAddresses}
                setWhitelistAddresses={setWhitelistAddresses}
                fairMintEnabled={fairMintEnabled}
                setFairMintEnabled={setFairMintEnabled}
                maxPerWallet={maxPerWallet}
                setMaxPerWallet={setMaxPerWallet}
                immutableToken={immutableToken}
                setImmutableToken={setImmutableToken}
                walletConnected={walletConnected}
                creationFee={TOKEN_CREATION_FEE}
                currency={getNativeCurrency()}
                onCreateToken={handleCreateToken}
              />
            )}

            {activeTab === 'directmint' && (
              <DirectMintTab
                createdTokens={createdTokens}
                selectedTokenForMint={selectedTokenForMint}
                setSelectedTokenForMint={setSelectedTokenForMint}
                mintAmount={mintAmount}
                setMintAmount={setMintAmount}
                burnAmount={burnAmount}
                setBurnAmount={setBurnAmount}
                walletConnected={walletConnected}
                mintFee={DIRECT_MINT_FEE}
                currency={getNativeCurrency()}
                onMint={handleDirectMint}
                onBurn={handleBurn}
              />
            )}

            {activeTab === 'dashboard' && (
              <DashboardTab 
                createdTokens={createdTokens} 
                setCreatedTokens={setCreatedTokens}
                network={network}
                onQuickAction={(action, tokenId) => {
                  if (action === 'mint' || action === 'burn') {
                    setSelectedTokenForMint(tokenId.toString());
                    setActiveTab('directmint');
                  } else if (action === 'presale') {
                    setSelectedTokenForPresale(tokenId.toString());
                    setActiveTab('launchpad');
                  }
                }}
                presales={presales}
              />
            )}

            {activeTab === 'launchpad' && (
              <LaunchpadTab
                createdTokens={createdTokens}
                presales={presales}
                walletConnected={walletConnected}
                presaleFee={PRESALE_CREATION_FEE}
                currency={getNativeCurrency()}
                onCreatePresale={handleCreatePresale}
                onViewPresale={(presale) => setSelectedPresale(presale)}
                selectedTokenForPresale={selectedTokenForPresale}
                setSelectedTokenForPresale={setSelectedTokenForPresale}
              />
            )}

            {activeTab === 'trade' && (
              <TradeTab
                createdTokens={createdTokens}
                walletConnected={walletConnected}
                currency={getNativeCurrency()}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Modals */}
      <WalletConnectModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onConnectBackpack={connectBackpack}
        onConnectPhantom={connectPhantom}
      />

      <WalletApprovalModal
        isOpen={showApprovalModal}
        onClose={() => {
          setShowApprovalModal(false);
          setApprovalData(null);
        }}
        onApprove={handleApproveTransaction}
        isLoading={approvalLoading}
        approvalData={approvalData}
      />

      <PresaleDetailModal
        presale={selectedPresale}
        onClose={() => setSelectedPresale(null)}
        onInvest={(presale) => {
          setShowInvestModal(true);
          setInvestAmount(0);
        }}
        walletConnected={walletConnected}
      />

      <InvestModal
        isOpen={showInvestModal}
        onClose={() => {
          setShowInvestModal(false);
          setInvestAmount(0);
        }}
        presale={selectedPresale}
        investAmount={investAmount}
        setInvestAmount={setInvestAmount}
        currency={getNativeCurrency()}
        onConfirm={async () => {
          setApprovalData({
            type: 'presale_investment',
            title: 'Invest in Presale',
            amount: investAmount,
            currency: getNativeCurrency(),
            details: {
              tokenName: selectedPresale.tokenName,
              tokenSymbol: selectedPresale.tokenSymbol,
              action: `Invest ${investAmount} ${getNativeCurrency()}`
            }
          });
          setShowInvestModal(false);
          setShowApprovalModal(true);
        }}
      />
    </div>
  );
}