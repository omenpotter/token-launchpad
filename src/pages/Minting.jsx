// FILE: src/pages/Minting.jsx
// REPLACE ENTIRE FILE WITH THIS CODE

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
      return tokens.filter(t => t.network === 'x1Mainnet' && !t.verificationStatus);
    },
    initialData: []
  });

  // ✅ FIX: Complete mint handler with proper validation
  const handleDirectMint = async () => {
    if (!walletConnected) {
      alert('Please connect wallet first');
      return;
    }
    
    if (!selectedTokenForMint || !mintAmount) {
      alert('Please select token and enter amount');
      return;
    }

    setApprovalLoading(true);
    try {
      // Fetch all minting tokens
      const tokens = await base44.entities.Token.filter({ sentForMinting: true });
      const mintingTokens = tokens.filter(t => t.network === 'x1Mainnet');
      const token = mintingTokens.find(t => t.id?.toString() === selectedTokenForMint);
      
      if (!token) {
        throw new Error('Token not found');
      }

      // ✅ Validate mint address
      if (!token.mint || typeof token.mint !== 'string' || token.mint.length < 32) {
        throw new Error('Invalid token mint address');
      }

      // ✅ Initialize connection if needed
      if (!web3Service.connection) {
        web3Service.initConnection('x1Mainnet');
      }

      // Check fair mint limits
      if (token.fairMint && token.maxPerWallet > 0) {
        const totalMintedByUser = (token.totalMinted || 0) + mintAmount;
        if (totalMintedByUser > token.maxPerWallet) {
          throw new Error(`Fair mint limit exceeded. Max per wallet: ${token.maxPerWallet}`);
        }
      }

      const userMintFee = token.mintingFee ?? 0;
      const programId = token.type === 'TOKEN2022' 
        ? 'TokenzQdBNbNbGKPFXCWuBvf9Ss623VQ5DA' 
        : 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
      
      console.log('[Minting] Executing mint:', {
        mint: token.mint.trim(),
        amount: mintAmount,
        decimals: token.decimals,
        fee: userMintFee,
        programId
      });

      const result = await web3Service.mintTokens(
        token.mint.trim(), 
        mintAmount, 
        token.decimals, 
        userMintFee, 
        programId
      );
      
      // Update database
      await base44.entities.Token.update(token.id, {
        totalMinted: (token.totalMinted || 0) + mintAmount,
        supply: token.supply + mintAmount
      });
      
      await refetchTokens();
      setMintAmount(100);
      setSelectedTokenForMint('');
      
      alert(`✅ Minted ${mintAmount} ${token.symbol} successfully!\n\nTransaction: ${result.txHash}\n\nView on Explorer:\nhttps://explorer.x1.xyz/tx/${result.txHash}`);
    } catch (error) {
      console.error('[Minting] Mint error:', error);
      alert('Failed to mint tokens: ' + error.message);
    } finally {
      setApprovalLoading(false);
    }
  };

  // ✅ FIX: Complete burn handler with proper validation
  const handleBurn = async () => {
    if (!walletConnected) {
      alert('Please connect wallet first');
      return;
    }
    
    if (!selectedTokenForMint || !burnAmount) {
      alert('Please select token and enter burn amount');
      return;
    }

    // ⚠️ Burn confirmation
    const confirmBurn = window.confirm(
      `⚠️ WARNING: Burn ${burnAmount} tokens?\n\n` +
      `This action is PERMANENT and IRREVERSIBLE.\n` +
      `Burned tokens will be sent to:\n` +
      `1nc1nerator11111111111111111111111111111111\n\n` +
      `Are you sure you want to continue?`
    );

    if (!confirmBurn) {
      return;
    }

    setApprovalLoading(true);
    try {
      // Fetch all minting tokens
      const tokens = await base44.entities.Token.filter({ sentForMinting: true });
      const mintingTokens = tokens.filter(t => t.network === 'x1Mainnet');
      const token = mintingTokens.find(t => t.id?.toString() === selectedTokenForMint);
      
      if (!token) {
        throw new Error('Token not found');
      }

      // ✅ Validate mint address
      if (!token.mint || typeof token.mint !== 'string' || token.mint.length < 32) {
        throw new Error('Invalid token mint address');
      }

      // ✅ Initialize connection if needed
      if (!web3Service.connection) {
        web3Service.initConnection('x1Mainnet');
      }

      const programId = token.type === 'TOKEN2022' 
        ? 'TokenzQdBNbNbGKPFXCWuBvf9Ss623VQ5DA' 
        : 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
      
      console.log('[Minting] Executing burn:', {
        mint: token.mint.trim(),
        amount: burnAmount,
        decimals: token.decimals,
        programId,
        destination: '1nc1nerator11111111111111111111111111111111'
      });

      const result = await web3Service.burnTokens(
        token.mint.trim(), 
        burnAmount, 
        token.decimals, 
        programId
      );
      
      // Update database
      await base44.entities.Token.update(token.id, {
        burned: (token.burned || 0) + burnAmount,
        supply: Math.max(0, token.supply - burnAmount)
      });
      
      await refetchTokens();
      setBurnAmount(0);
      
      alert(`✅ Burned ${burnAmount} ${token.symbol} tokens!\n\nTokens sent to incinerator:\n1nc1nerator11111111111111111111111111111111\n\nTransaction: ${result.txHash}\n\nView on Explorer:\nhttps://explorer.x1.xyz/tx/${result.txHash}`);
    } catch (error) {
      console.error('[Minting] Burn error:', error);
      alert('Failed to burn tokens: ' + error.message);
    } finally {
      setApprovalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <SharedHeader />

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link
            to={createPageUrl('Dashboard')}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition"
          >
            <span>← Back to Dashboard</span>
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
          onMint={handleDirectMint}  // ✅ FIXED: Properly wired
          onBurn={handleBurn}         // ✅ FIXED: Properly wired
          walletAddress={walletAddress}
        />
      </main>

      <SharedFooter />
    </div>
  );
}
