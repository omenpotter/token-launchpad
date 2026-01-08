import '../components/token/web3/polyfills';
import React, { useState } from 'react';
import { Wallet, Coins, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { web3Service } from '../components/token/web3/Web3Provider';
import WalletConnectModal from '../components/token/WalletConnectModal';
import WalletApprovalModal from '../components/token/WalletApprovalModal';
import CreateTokenTab from '../components/token/CreateTokenTab';

export default function CreateTokenPage() {
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
  const [lockEnabled, setLockEnabled] = useState(false);
  const [lockDuration, setLockDuration] = useState(30);
  const [lockReleaseDate, setLockReleaseDate] = useState('');
  const [lockMintAuthority, setLockMintAuthority] = useState(false);
  const [whitelistEnabled, setWhitelistEnabled] = useState(false);
  const [whitelistAddresses, setWhitelistAddresses] = useState('');
  const [fairMintEnabled, setFairMintEnabled] = useState(false);
  const [maxPerWallet, setMaxPerWallet] = useState(1000);
  const [immutableToken, setImmutableToken] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalData, setApprovalData] = useState(null);
  const [approvalLoading, setApprovalLoading] = useState(false);

  const TOKEN_CREATION_FEE = 0.2;

  const { refetch: refetchTokens } = useQuery({
    queryKey: ['tokens'],
    queryFn: () => base44.entities.Token.list(),
    enabled: false
  });

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
      currency: 'XNT',
      details: { tokenName, tokenSymbol, tokenType, supply, decimals }
    });
    setShowApprovalModal(true);
  };

  const handleApproveTransaction = async () => {
    setApprovalLoading(true);
    try {
      const result = await web3Service.createToken(network, {
        name: tokenName,
        symbol: tokenSymbol,
        decimals: decimals,
        supply: supply,
        lockMint: lockMintAuthority,
        immutable: immutableToken,
        maxPerWallet: fairMintEnabled ? maxPerWallet : 0
      }, TOKEN_CREATION_FEE);

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

      await base44.entities.Token.create(newToken);
      await refetchTokens();

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

      alert(`✅ Token created!\nAddress: ${result.tokenAddress}\nTx: ${result.txHash}`);
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
            <Link to={createPageUrl('X1TokenLauncher')} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Coins className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">X1Space Launcher</h1>
                <p className="text-xs text-slate-400">Create, mint & launch tokens</p>
              </div>
            </Link>

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
          currency="XNT"
          onCreateToken={handleCreateToken}
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
    </div>
  );
}