import '../components/token/web3/polyfills';
import React, { useState, useEffect } from 'react';
import { Wallet, Coins, Zap, LayoutDashboard, Rocket, LogOut, TrendingUp, Droplets, Send, MessageCircle, Twitter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

import WalletConnectModal from '../components/token/WalletConnectModal';
import WalletApprovalModal from '../components/token/WalletApprovalModal';
import CreateTokenTab from '../components/token/CreateTokenTab';
import MintingTab from '../components/token/MintingTab';
import DashboardTab from '../components/token/DashboardTab';
import LaunchpadTab from '../components/token/LaunchpadTab';
import TradeTab from '../components/token/TradeTab';
import PresaleDetailModal from '../components/token/PresaleDetailModal';
import InvestModal from '../components/token/InvestModal';
import { web3Service } from '../components/token/web3/Web3Provider';

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
  const [tokenTelegram, setTokenTelegram] = useState('');
  const [tokenTwitter, setTokenTwitter] = useState('');
  const [tokenDescription, setTokenDescription] = useState('');
  
  // Token Lock
  const [lockEnabled, setLockEnabled] = useState(false);
  const [lockDuration, setLockDuration] = useState(30);
  const [lockReleaseDate, setLockReleaseDate] = useState('');
  
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

  // Fetch tokens from database when wallet connects
  const { data: dbTokens = [], refetch: refetchTokens } = useQuery({
    queryKey: ['tokens', walletAddress],
    queryFn: () => base44.entities.Token.filter({ creator: walletAddress }),
    enabled: walletConnected && !!walletAddress,
    initialData: []
  });

  useEffect(() => {
    if (dbTokens.length > 0) {
      setCreatedTokens(dbTokens);
    }
  }, [dbTokens]);
  
  // Direct Mint
  const [selectedTokenForMint, setSelectedTokenForMint] = useState('');
  const [mintAmount, setMintAmount] = useState(100);
  const [burnAmount, setBurnAmount] = useState(0);
  
  // Presale & Investment
  const [selectedTokenForPresale, setSelectedTokenForPresale] = useState('');
  const [selectedPresale, setSelectedPresale] = useState(null);
  const [investAmount, setInvestAmount] = useState(0);
  const [showInvestModal, setShowInvestModal] = useState(false);
  
  // UI
  const [activeTab, setActiveTab] = useState('create');

  // Fees
  const TOKEN_CREATION_FEE = 0.2;
  const DIRECT_MINT_FEE = 0.2;
  const PRESALE_CREATION_FEE = 0.2;

  const getNativeCurrency = () => {
    return network.includes('x1') ? 'XNT' : 'SOL';
  };

  // Initialize Solana connection
  useEffect(() => {
    web3Service.initConnection(network);
  }, [network]);

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
  const handleBurn = async () => {
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

    try {
      // Real burn on blockchain
      const result = await web3Service.burnTokens(
        token.mint,
        burnAmount,
        token.decimals
      );
      
      const updatedTokens = createdTokens.map(t => {
        if (t.id === parseInt(selectedTokenForMint)) {
          return { 
            ...t, 
            burned: (t.burned || 0) + burnAmount,
            supply: t.supply - burnAmount
          };
        }
        return t;
      });
      setCreatedTokens(updatedTokens);
      setBurnAmount(0);
      
      alert(`✅ Burned ${burnAmount} ${token.symbol} tokens on-chain!\nTx: ${result.txHash}`);
    } catch (error) {
      alert('Burn failed: ' + error.message);
    }
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

  // Approve Transaction - Real Blockchain Integration
  const handleApproveTransaction = async () => {
    setApprovalLoading(true);
    
    try {
      if (approvalData.type === 'token_creation') {
        // Real token creation on X1 blockchain
        const result = await web3Service.createToken(
          network,
          {
            name: tokenName,
            symbol: tokenSymbol,
            decimals: decimals,
            supply: supply,
            lockMint: lockMintAuthority,
            immutable: immutableToken,
            maxPerWallet: fairMintEnabled ? maxPerWallet : 0
          },
          TOKEN_CREATION_FEE
        );
        
        const newToken = {
          name: tokenName,
          symbol: tokenSymbol,
          mint: result.tokenAddress,
          type: tokenType,
          decimals: decimals,
          supply: supply,
          initialSupply: supply,
          network,
          logo: tokenLogo,
          website: tokenWebsite,
          telegram: tokenTelegram,
          twitter: tokenTwitter,
          description: tokenDescription,
          lockMint: lockMintAuthority,
          fairMint: fairMintEnabled,
          maxPerWallet: fairMintEnabled ? maxPerWallet : 0,
          immutable: immutableToken,
          lockEnabled: lockEnabled,
          lockDuration: lockDuration,
          lockReleaseDate: lockReleaseDate,
          totalMinted: 0,
          burned: 0,
          txHash: result.txHash,
          creator: walletAddress
        };
        
        // Save to database
        await base44.entities.Token.create(newToken);
        await refetchTokens();
        
        // Reset form
        setTokenName('');
        setTokenSymbol('');
        setTokenLogo('');
        setTokenWebsite('');
        setTokenTelegram('');
        setTokenTwitter('');
        setTokenDescription('');
        setLockMintAuthority(false);
        setWhitelistAddresses('');
        setWhitelistEnabled(false);
        setFairMintEnabled(false);
        setImmutableToken(false);
        setLockEnabled(false);
        setLockDuration(30);
        setLockReleaseDate('');
        
        alert(`✅ Token created on-chain!\nAddress: ${result.tokenAddress}\nTx: ${result.txHash}`);
      } 
      else if (approvalData.type === 'direct_mint') {
        const token = createdTokens.find(t => t.id === parseInt(selectedTokenForMint));
        
        // Check fair mint limit
        if (token.fairMint && token.maxPerWallet > 0) {
          const totalMintedByUser = (token.totalMinted || 0) + mintAmount;
          if (totalMintedByUser > token.maxPerWallet) {
            throw new Error(`Fair mint limit exceeded. Max per wallet: ${token.maxPerWallet}`);
          }
        }
        
        const result = await web3Service.mintTokens(
          token.mint,
          mintAmount,
          token.decimals,
          DIRECT_MINT_FEE
        );
        
        const updatedToken = {
          ...token,
          totalMinted: (token.totalMinted || 0) + mintAmount,
          supply: token.supply + mintAmount
        };
        
        await base44.entities.Token.update(token.id, updatedToken);
        await refetchTokens();
        setMintAmount(100);
        
        alert(`✅ Minted ${mintAmount} tokens on-chain!\nTx: ${result.txHash}`);
      }
      else if (approvalData.type === 'presale_investment') {
        // Real presale investment
        const result = await web3Service.investInPresale(
          selectedPresale.presaleAddress || '0x1234567890123456789012345678901234567890',
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
        
        alert(`✅ Investment successful!\nAmount: ${investAmount} ${getNativeCurrency()}\nTx: ${result.txHash}`);
      }
      else if (approvalData.type === 'presale_creation') {
        const { presaleData } = approvalData;
        const token = presaleData.token;
        
        const result = await web3Service.createPresale(
          network,
          {
            tokenAddress: token.mint,
            softCap: presaleData.softCap,
            hardCap: presaleData.hardCap,
            startDate: presaleData.startDate,
            endDate: presaleData.endDate,
            minContribution: presaleData.minContribution,
            maxContribution: presaleData.maxContribution
          },
          PRESALE_CREATION_FEE
        );
        
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
          currency: getNativeCurrency(),
          status: 'upcoming',
          raised: 0,
          investors: 0,
          createdAt: new Date().toLocaleString(),
          presaleAddress: result.presaleAddress,
          txHash: result.txHash
        };
        
        setPresales([newPresale, ...presales]);
        alert(`✅ Presale created on-chain!\nAddress: ${result.presaleAddress}\nTx: ${result.txHash}`);
      }
    } catch (error) {
      console.error('Transaction error:', error);
      alert('Transaction failed: ' + error.message);
    } finally {
      setApprovalLoading(false);
      setShowApprovalModal(false);
      setApprovalData(null);
    }
  };

  const tabs = [
    { id: 'create', label: 'Create Token', icon: Coins },
    { id: 'minting', label: 'Minting', icon: Zap },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'launchpad', label: 'Launchpad', icon: Rocket },
    { id: 'liquidity', label: 'Liquidity Pool', icon: Droplets },
    { id: 'trade', label: 'Trade', icon: TrendingUp }
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

      {/* Main Content */}
      <nav className="bg-slate-900/50 border-b border-slate-800/50">
        <div className="max-w-6xl mx-auto px-4 py-2">
          <div className="flex items-center gap-4 text-sm">
            <a href="https://xdex.xyz" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-cyan-400 transition">
              xDEX
            </a>
            <a href="https://t.me/xdex_xyz" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-slate-400 hover:text-cyan-400 transition">
              <MessageCircle className="w-4 h-4" />
              Telegram
            </a>
            <a href="https://x.com/rkbehelvi" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-slate-400 hover:text-cyan-400 transition">
              <Twitter className="w-4 h-4" />
              Twitter
            </a>
          </div>
        </div>
      </nav>
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
                tokenTelegram={tokenTelegram}
                setTokenTelegram={setTokenTelegram}
                tokenTwitter={tokenTwitter}
                setTokenTwitter={setTokenTwitter}
                tokenDescription={tokenDescription}
                setTokenDescription={setTokenDescription}
                lockEnabled={lockEnabled}
                setLockEnabled={setLockEnabled}
                lockDuration={lockDuration}
                setLockDuration={setLockDuration}
                lockReleaseDate={lockReleaseDate}
                setLockReleaseDate={setLockReleaseDate}
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

            {activeTab === 'minting' && (
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
                currency={getNativeCurrency()}
                onMint={handleDirectMint}
                onBurn={handleBurn}
                walletAddress={walletAddress}
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
                    setActiveTab('minting');
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

            {activeTab === 'liquidity' && (
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 text-center">
                <Droplets className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Liquidity Pool Management</h3>
                <p className="text-slate-400 mb-4">Visit our dedicated Liquidity Pool page to manage your pools</p>
                <a 
                  href="/liquidity-pool" 
                  className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl transition"
                >
                  <Droplets className="w-4 h-4" />
                  Go to Liquidity Pool
                </a>
              </div>
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
              <a href="https://t.me/xdex_xyz" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-cyan-400 transition">
                <MessageCircle className="w-5 h-5" />
              </a>
              <a href="https://x.com/rkbehelvi" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-cyan-400 transition">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}