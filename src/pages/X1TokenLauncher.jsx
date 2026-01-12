import React, { useState, useEffect } from 'react';
import { Coins, Zap, LayoutDashboard, Rocket, TrendingUp, Droplets } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useWallet } from '../components/token/WalletContext';
import SharedHeader from '../components/token/SharedHeader';
import SharedFooter from '../components/token/SharedFooter';
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
  const { walletConnected, walletAddress, network } = useWallet();
  
  // Token States
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
  const [buyTax, setBuyTax] = useState(0);
  const [sellTax, setSellTax] = useState(0);
  
  // Approval Modal
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalData, setApprovalData] = useState(null);
  const [approvalLoading, setApprovalLoading] = useState(false);
  
  // Data
  const [createdTokens, setCreatedTokens] = useState([]);
  const [presales, setPresales] = useState([]);
  const [currentNetwork, setCurrentNetwork] = useState('x1Testnet');

  // Fetch tokens from database
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
    return currentNetwork.includes('x1') ? 'XNT' : 'SOL';
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
      // Initialize connection if needed
      if (!web3Service.connection) {
        web3Service.initConnection(currentNetwork);
      }

      const result = await web3Service.burnTokens(
        token.mint,
        burnAmount,
        token.decimals,
        token.programId
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
      console.error('[X1TokenLauncher] Burn error:', error);
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

  // Approve Transaction
  const handleApproveTransaction = async () => {
    setApprovalLoading(true);
    
    try {
      if (approvalData.type === 'token_creation') {
        // Initialize connection
        if (!web3Service.connection) {
          web3Service.initConnection(currentNetwork);
        }

        // Upload metadata to IPFS if provided
        let metadataUri = null;
        if (tokenName && tokenSymbol && (tokenDescription || tokenLogo || tokenWebsite)) {
          try {
            console.log('[X1TokenLauncher] Uploading metadata to IPFS...');
            const metadataResponse = await base44.functions.invoke('uploadMetadataToIPFS', {
              name: tokenName,
              symbol: tokenSymbol,
              description: tokenDescription,
              imageUrl: tokenLogo,
              website: tokenWebsite,
              telegram: tokenTelegram,
              twitter: tokenTwitter
            });
            
            metadataUri = metadataResponse.data?.metadataUri || null;
            console.log('[X1TokenLauncher] Metadata uploaded:', metadataUri);
          } catch (metadataError) {
            console.warn('[X1TokenLauncher] Metadata upload failed, continuing without it:', metadataError.message);
          }
        }

        // Create token
        console.log('[X1TokenLauncher] Creating token with metadata URI:', metadataUri);
        const result = await web3Service.createToken(
          currentNetwork,
          {
            type: tokenType,
            name: tokenName,
            symbol: tokenSymbol,
            decimals: decimals,
            supply: supply,
            lockMint: lockMintAuthority,
            immutable: immutableToken,
            maxPerWallet: fairMintEnabled ? maxPerWallet : 0,
            transferFee: buyTax > 0 || sellTax > 0,
            transferFeeBasisPoints: Math.max(buyTax, sellTax) * 100,
            transferFeeMaximum: BigInt(1000000),
            nonTransferable: false
          },
          TOKEN_CREATION_FEE,
          metadataUri
        );
        
        const newToken = {
          name: tokenName,
          symbol: tokenSymbol,
          mint: result.tokenAddress,
          type: tokenType,
          decimals: decimals,
          supply: supply,
          initialSupply: supply,
          network: currentNetwork,
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
          buyTax: buyTax,
          sellTax: sellTax,
          totalMinted: 0,
          burned: 0,
          txHash: result.txHash,
          associatedTokenAccount: result.associatedTokenAccount,
          creator: walletAddress,
          metadataUri: metadataUri,
          createdAt: new Date().toISOString()
        };
        
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
        setBuyTax(0);
        setSellTax(0);
        
        const successMessage = `✅ Token Created Successfully!\n\nName: ${tokenName}\nSymbol: ${tokenSymbol}\nAddress: ${result.tokenAddress}\nTransaction: ${result.txHash}${metadataUri ? `\nMetadata: ${metadataUri}` : '\n(Created without inline metadata)'}`;
        alert(successMessage);
      } 
      else if (approvalData.type === 'direct_mint') {
        // Initialize connection
        if (!web3Service.connection) {
          web3Service.initConnection(currentNetwork);
        }

        const token = createdTokens.find(t => t.id === parseInt(selectedTokenForMint));
        
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
          DIRECT_MINT_FEE,
          token.programId
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
        // Initialize connection
        if (!web3Service.connection) {
          web3Service.initConnection(currentNetwork);
        }

        const result = await web3Service.investInPresale(
          selectedPresale.presaleAddress || '0x1234567890123456789012345678901234567890',
          investAmount
        );
        
        const updatedPresales = presales.map(p => {
          if (p.id === selectedPresale.id) {
            return {
              ...p,
              raised: (p.raised || 0) + investAmount,
              investors: (p.investors || 0) + 1,
              status: (p.raised || 0) + investAmount >= p.hardCap ? 'completed' : 
                      (p.raised || 0) + investAmount >= p.softCap ? 'active' : p.status
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
        // Initialize connection
        if (!web3Service.connection) {
          web3Service.initConnection(currentNetwork);
        }

        const { presaleData } = approvalData;
        const token = presaleData.token;
        
        const result = await web3Service.createPresale(
          currentNetwork,
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
      console.error('[X1TokenLauncher] Transaction error:', error);
      alert('Transaction failed: ' + error.message);
    } finally {
      setApprovalLoading(false);
      setShowApprovalModal(false);
      setApprovalData(null);
    }
  };

  const tabs = [
    { id: 'minting', label: 'Minting', icon: Zap, path: 'Minting' },
    { id: 'create', label: 'Create Token', icon: Coins, path: 'CreateToken' },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: 'Dashboard' },
    { id: 'launchpad', label: 'Launchpad', icon: Rocket, path: 'Launchpad' },
    { id: 'liquidity', label: 'Liquidity Pool', icon: Droplets, path: 'LiquidityPool' },
    { id: 'trade', label: 'Trade', icon: TrendingUp, path: 'Trade' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <SharedHeader />

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex overflow-x-auto gap-2 mb-6 pb-2 scrollbar-hide">
          {tabs.map(tab => (
            <Link
              key={tab.id}
              to={createPageUrl(tab.path)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-medium whitespace-nowrap transition bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300 border border-transparent"
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </Link>
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
                network={currentNetwork}
                setNetwork={setCurrentNetwork}
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
                buyTax={buyTax}
                setBuyTax={setBuyTax}
                sellTax={sellTax}
                setSellTax={setSellTax}
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
                network={currentNetwork}
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
                <Link 
                  to={createPageUrl('LiquidityPool')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl transition"
                >
                  <Droplets className="w-4 h-4" />
                  Go to Liquidity Pool
                </Link>
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

      <SharedFooter />
    </div>
  );
}
