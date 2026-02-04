// FILE: src/components/token/DashboardTab.jsx
// COMPLETE FILE - REPLACE ENTIRE FILE WITH THIS CODE
// ✅ FIXED: Includes proper mint/burn validation + on-chain authority locking

import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { useWallet } from './WalletContext';
import { Coins, ExternalLink, Clock, Shield, Copy, CheckCircle, Zap, Flame, Rocket, Eye, Edit2, Lock, Users, TrendingUp, BarChart3, Droplets, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import EnhancedTokenAnalytics from './EnhancedTokenAnalytics';
import LiquidityManagement from './LiquidityManagement';
import SendToMintingModal from './SendToMintingModal';
import { web3Service } from './web3/Web3Provider';

export default function DashboardTab({ createdTokens, refetchTokens, network, onQuickAction, presales }) {
  const { walletConnected } = useWallet();
  const [copiedId, setCopiedId] = useState(null);
  const [expandedTokenId, setExpandedTokenId] = useState(null);
  const [editingTokenId, setEditingTokenId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [showAnalytics, setShowAnalytics] = useState(null);
  const [showLiquidity, setShowLiquidity] = useState(null);
  const [showSendToMinting, setShowSendToMinting] = useState(null);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getExplorerUrl = (mint, tokenNetwork) => {
  if (tokenNetwork === 'x1Testnet') {
    return `https://explorer.mainnet.x1.xyz/address/${mint}?network=testnet`;
  } else if (tokenNetwork === 'x1Mainnet') {
    return `https://explorer.mainnet.x1.xyz/address/${mint}`;
  }
  return '#';
};

  const toggleAdvancedOptions = (tokenId) => {
    setExpandedTokenId(expandedTokenId === tokenId ? null : tokenId);
  };

  const startEditing = (token) => {
    setEditingTokenId(token.id);
    setEditValues({
      lockMint: token.lockMint || false,
      immutable: token.immutable || false,
      fairMint: token.fairMint || false,
      maxPerWallet: token.maxPerWallet || 1000,
      lockEnabled: token.lockEnabled || false,
      lockDuration: token.lockDuration || 30,
      lockReleaseDate: token.lockReleaseDate || '',
      buyTax: token.buyTax || 0,
      sellTax: token.sellTax || 0,
      website: token.website || '',
      telegram: token.telegram || '',
      twitter: token.twitter || '',
      description: token.description || ''
    });
  };

  // ✅ FIXED: Complete save function with on-chain authority locking
  const saveEditing = async () => {
    try {
      const updates = { ...editValues };
      const token = createdTokens.find(t => t.id === editingTokenId);
      
      if (!token) {
        throw new Error('Token not found');
      }

      // ✅ CRITICAL: Handle on-chain authority locking
      
      // LOCK MINT AUTHORITY
      if (editValues.lockMint && !token.lockMint) {
        const confirm = window.confirm(
          '🔒 WARNING: Lock Mint Authority?\n\n' +
          '⚠️ This action is PERMANENT and IRREVERSIBLE ⚠️\n\n' +
          'Once locked, you will NEVER be able to:\n' +
          '• Mint new tokens\n' +
          '• Increase token supply\n' +
          '• Recover this authority\n\n' +
          'The mint authority will be set to null on-chain.\n\n' +
          'Type "LOCK" to confirm you understand this is permanent:'
        );
        
        const userInput = prompt('Type LOCK to confirm:');
        
        if (userInput !== 'LOCK') {
          alert('❌ Cancelled. Mint authority was NOT locked.');
          return;
        }

        try {
          if (!web3Service.connection) {
            web3Service.initConnection(network || 'x1Mainnet');
          }

          const programId = token.type === 'TOKEN2022'
            ? 'TokenzQdBNbNbGKPFXCWuBvf9Ss623VQ5DA'
            : 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

          alert('🔒 Locking mint authority on-chain...\n\nPlease approve the transaction in your wallet.');
          
          const result = await web3Service.lockMintAuthority(token.mint, programId);
          
          updates.lockMint = true;
          updates.lockMintTxHash = result.txHash;
          updates.lockMintDate = new Date().toISOString();
          
          alert(
            `✅ Mint Authority Locked Permanently!\n\n` +
            `Transaction: ${result.txHash}\n\n` +
            `View on Explorer:\n` +
            `https://explorer.x1.xyz/tx/${result.txHash}\n\n` +
            `⚠️ No more tokens can ever be minted for ${token.symbol}`
          );
        } catch (error) {
          console.error('[Dashboard] Lock mint error:', error);
          alert('❌ Failed to lock mint authority: ' + error.message);
          return;
        }
      }

      // MAKE TOKEN IMMUTABLE
      if (editValues.immutable && !token.immutable) {
        const confirm1 = window.confirm(
          '🔐 WARNING: Make Token Immutable?\n\n' +
          '⚠️ THIS IS THE MOST EXTREME ACTION ⚠️\n\n' +
          'This will PERMANENTLY lock BOTH:\n' +
          '1. Mint Authority (can never mint more)\n' +
          '2. Freeze Authority (can never freeze accounts)\n\n' +
          'Once immutable, you will NEVER be able to:\n' +
          '• Mint new tokens\n' +
          '• Freeze any accounts\n' +
          '• Change any token properties\n' +
          '• Recover any authorities\n\n' +
          'Click OK to continue to final confirmation...'
        );
        
        if (!confirm1) {
          alert('❌ Cancelled. Token was NOT made immutable.');
          return;
        }

        const userInput = prompt(
          '⚠️ FINAL WARNING ⚠️\n\n' +
          'Type the token symbol to confirm:\n' +
          `Token: ${token.name} (${token.symbol})\n\n` +
          `Type "${token.symbol}" exactly to proceed:`
        );
        
        if (userInput !== token.symbol) {
          alert('❌ Cancelled. Token was NOT made immutable.');
          return;
        }

        try {
          if (!web3Service.connection) {
            web3Service.initConnection(network || 'x1Mainnet');
          }

          const programId = token.type === 'TOKEN2022'
            ? 'TokenzQdBNbNbGKPFXCWuBvf9Ss623VQ5DA'
            : 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

          alert(
            '🔐 Making token immutable...\n\n' +
            'You will need to approve 2 transactions:\n' +
            '1. Lock Mint Authority\n' +
            '2. Lock Freeze Authority\n\n' +
            'Please approve both in your wallet.'
          );
          
          const result = await web3Service.makeTokenImmutable(token.mint, programId);
          
          updates.immutable = true;
          updates.lockMint = true;
          updates.immutableMintTxHash = result.mintTxHash;
          updates.immutableFreezeTxHash = result.freezeTxHash;
          updates.immutableDate = new Date().toISOString();
          
          alert(
            `✅ ${token.symbol} is now COMPLETELY IMMUTABLE!\n\n` +
            `Mint Lock Transaction:\n${result.mintTxHash}\n\n` +
            `Freeze Lock Transaction:\n${result.freezeTxHash}\n\n` +
            `View on Explorer:\n` +
            `https://explorer.x1.xyz/tx/${result.mintTxHash}\n\n` +
            `⚠️ All authorities are permanently locked.\n` +
            `This token can never be changed again.`
          );
        } catch (error) {
          console.error('[Dashboard] Make immutable error:', error);
          alert('❌ Failed to make token immutable: ' + error.message);
          return;
        }
      }

      await base44.entities.Token.update(editingTokenId, updates);
      
      if (typeof refetchTokens === 'function') {
        await refetchTokens();
      }
      
      setEditingTokenId(null);
      setEditValues({});
      
      alert('✅ Token settings saved successfully!');
    } catch (error) {
      console.error('[Dashboard] Save error:', error);
      alert('❌ Failed to save changes: ' + error.message);
    }
  };

  const getTokenPresales = (tokenId) => {
    return presales.filter(p => {
      const token = createdTokens.find(t => t.id === tokenId);
      return token && p.tokenSymbol === token.symbol;
    });
  };

  const handleSendToMinting = async (token, settings) => {
    try {
      await base44.entities.Token.update(token.id, {
        sentForMinting: true,
        mintingMaxPerWallet: settings.maxPerWallet,
        fairMint: settings.enableFairMint,
        mintingFee: settings.mintingFee ?? 0
      });

      if (typeof refetchTokens === 'function') {
        await refetchTokens();
      }
      
      alert(`✅ ${token.symbol} sent to Minting Page!`);
    } catch (error) {
      alert('Failed to send token: ' + error.message);
    }
  };

  if (createdTokens.length === 0) {
    return (
      <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
          <Coins className="w-8 h-8 text-slate-500" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No Tokens Created</h3>
        <p className="text-slate-400">Tokens you create will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Your Tokens</h3>
        <span className="text-sm text-slate-400">{createdTokens.length} token(s)</span>
      </div>

      <div className="grid gap-4">
        {createdTokens.map((token, index) => (
          <motion.div
            key={token.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden hover:border-slate-600/50 transition"
          >
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                    {token.symbol.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white">{token.name}</h4>
                    <p className="text-slate-400 text-sm">{token.symbol}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {token.lockMint && (
                    <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-lg flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Locked
                    </span>
                  )}
                  {token.immutable && (
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-lg">
                      Immutable
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-slate-700/30 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-1">Total Supply</p>
                  <p className="text-white font-semibold">{token.supply.toLocaleString()}</p>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-1">Decimals</p>
                  <p className="text-white font-semibold">{token.decimals}</p>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-1">Type</p>
                  <p className="text-white font-semibold">{token.type}</p>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-1">Network</p>
                  <p className="text-white font-semibold">{token.network.includes('x1') ? 'X1' : 'Solana'}</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-700/20 rounded-xl mb-4">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xs text-slate-400">Mint:</span>
                  <a 
                    href={`https://explorer.mainnet.x1.xyz/address/${token.mint}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 font-mono hover:text-blue-300 transition flex items-center gap-1 truncate"
                  >
                    {token.mint}
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`https://x1.ninja/token/${token.mint}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 text-xs bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded transition"
                  >
                    x1.ninja
                  </a>
                  <button
                    onClick={() => copyToClipboard(token.mint, token.id)}
                    className="p-2 hover:bg-slate-600/50 rounded-lg transition"
                  >
                    {copiedId === token.id ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* ✅ FIXED: Quick Actions with proper mint/burn */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
                <button
                  onClick={async () => {
                    if (!walletConnected) {
                      alert('Please connect your wallet first');
                      return;
                    }

                    const mintAmount = prompt(`Enter amount of ${token.symbol} to mint:`);
                    if (!mintAmount || isNaN(mintAmount) || parseFloat(mintAmount) <= 0) {
                      alert('Invalid mint amount');
                      return;
                    }

                    try {
                      if (!token.mint || typeof token.mint !== 'string') {
                        throw new Error('Invalid token mint address in database');
                      }

                      const mintAddress = token.mint.trim();
                      if (mintAddress.length < 32 || mintAddress.length > 44) {
                        throw new Error(`Invalid mint address length: ${mintAddress.length} (expected 32-44)`);
                      }

                      if (!web3Service.connection) {
                        web3Service.initConnection(network || 'x1Mainnet');
                      }

                      const programId = token.type === 'TOKEN2022' 
                        ? 'TokenzQdBNbNbGKPFXCWuBvf9Ss623VQ5DA' 
                        : 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
                      
                      const result = await web3Service.mintTokens(
                        mintAddress,
                        parseFloat(mintAmount),
                        token.decimals || 9,
                        0,
                        programId
                      );

                      await base44.entities.Token.update(token.id, {
                        totalMinted: (token.totalMinted || 0) + parseFloat(mintAmount),
                        supply: token.supply + parseFloat(mintAmount)
                      });

                      if (typeof refetchTokens === 'function') {
                        await refetchTokens();
                      }

                      alert(`✅ Minted ${mintAmount} ${token.symbol} successfully!\n\nTransaction: ${result.txHash}\n\nView on Explorer:\nhttps://explorer.x1.xyz/tx/${result.txHash}`);
                    } catch (error) {
                      console.error('[Dashboard] Mint error:', error);
                      alert('Failed to mint tokens: ' + error.message);
                    }
                  }}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition text-sm font-medium"
                >
                  <Zap className="w-4 h-4" />
                  Mint More
                </button>

                <button
                  onClick={async () => {
                    if (!walletConnected) {
                      alert('Please connect your wallet first');
                      return;
                    }

                    const burnAmount = prompt(`Enter amount of ${token.symbol} to burn:`);
                    if (!burnAmount || isNaN(burnAmount) || parseFloat(burnAmount) <= 0) {
                      alert('Invalid burn amount');
                      return;
                    }

                    const confirmBurn = window.confirm(
                      `⚠️ WARNING: Burn ${burnAmount} ${token.symbol}?\n\n` +
                      `This action is PERMANENT and IRREVERSIBLE.\n` +
                      `Burned tokens will be sent to:\n` +
                      `1nc1nerator11111111111111111111111111111111\n\n` +
                      `Are you absolutely sure?`
                    );

                    if (!confirmBurn) {
                      return;
                    }

                    try {
                      if (!token.mint || typeof token.mint !== 'string') {
                        throw new Error('Invalid token mint address in database');
                      }

                      const mintAddress = token.mint.trim();
                      if (mintAddress.length < 32 || mintAddress.length > 44) {
                        throw new Error(`Invalid mint address length: ${mintAddress.length} (expected 32-44)`);
                      }

                      if (!web3Service.connection) {
                        web3Service.initConnection(network || 'x1Mainnet');
                      }

                      const programId = token.type === 'TOKEN2022' 
                        ? 'TokenzQdBNbNbGKPFXCWuBvf9Ss623VQ5DA' 
                        : 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
                      
                      const result = await web3Service.burnTokens(
                        mintAddress,
                        parseFloat(burnAmount),
                        token.decimals || 9,
                        programId
                      );

                      await base44.entities.Token.update(token.id, {
                        burned: (token.burned || 0) + parseFloat(burnAmount),
                        supply: Math.max(0, token.supply - parseFloat(burnAmount))
                      });

                      if (typeof refetchTokens === 'function') {
                        await refetchTokens();
                      }

                      alert(`✅ Burned ${burnAmount} ${token.symbol} successfully!\n\nTokens sent to incinerator:\n1nc1nerator11111111111111111111111111111111\n\nTransaction: ${result.txHash}\n\nView on Explorer:\nhttps://explorer.x1.xyz/tx/${result.txHash}`);
                    } catch (error) {
                      console.error('[Dashboard] Burn error:', error);
                      alert('Failed to burn tokens: ' + error.message);
                    }
                  }}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition text-sm font-medium"
                >
                  <Flame className="w-4 h-4" />
                  Burn
                </button>

                <button
                  onClick={() => setShowSendToMinting(token)}
                  disabled={token.sentForMinting}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  {token.sentForMinting ? 'Sent' : 'Minting'}
                </button>

                <Link
                  to={createPageUrl('Launchpad')}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg transition text-sm font-medium"
                >
                  <Rocket className="w-4 h-4" />
                  Launch
                </Link>

                <button
                  onClick={() => toggleAdvancedOptions(token.id)}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition text-sm font-medium"
                >
                  <Eye className="w-4 h-4" />
                  Options
                </button>
              </div>

              {/* Analytics & Liquidity Actions */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  onClick={() => setShowAnalytics(showAnalytics === token.id ? null : token.id)}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition text-sm font-medium"
                >
                  <BarChart3 className="w-4 h-4" />
                  Show Analytics
                </button>
                <button
                  onClick={() => setShowLiquidity(showLiquidity === token.id ? null : token.id)}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition text-sm font-medium"
                >
                  <Droplets className="w-4 h-4" />
                  Manage Liquidity
                </button>
              </div>

              {/* Analytics Section */}
              {showAnalytics === token.id && (
                <EnhancedTokenAnalytics tokenMint={token.mint} tokenName={token.name} />
              )}

              {/* Liquidity Management Section */}
              {showLiquidity === token.id && (
                <LiquidityManagement 
                  token={token}
                  walletConnected={walletConnected}
                  network={network}
                />
              )}

              {/* Advanced Options Panel */}
              {expandedTokenId === token.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-4 bg-slate-700/30 rounded-xl border border-slate-600/50"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="font-semibold text-white flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Advanced Options
                    </h5>
                    {editingTokenId === token.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={saveEditing}
                          className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm transition"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => {
                            setEditingTokenId(null);
                            setEditValues({});
                          }}
                          className="px-3 py-1 bg-slate-600/50 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditing(token)}
                        className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm transition flex items-center gap-2"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit Settings
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {/* Lock Mint Authority */}
                    <div className="p-3 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-300">Lock Mint Authority</span>
                        </div>
                        {editingTokenId === token.id ? (
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={editValues.lockMint} 
                              onChange={(e) => setEditValues({...editValues, lockMint: e.target.checked})}
                              className="sr-only peer" 
                            />
                            <div className="w-9 h-5 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                          </label>
                        ) : (
                          <span className={`text-sm font-medium ${token.lockMint ? 'text-amber-400' : 'text-slate-500'}`}>
                            {token.lockMint ? 'Locked' : 'Unlocked'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Immutable Token */}
                    <div className="p-3 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-300">Immutable Token</span>
                        </div>
                        {editingTokenId === token.id ? (
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={editValues.immutable} 
                              onChange={(e) => setEditValues({...editValues, immutable: e.target.checked})}
                              className="sr-only peer" 
                            />
                            <div className="w-9 h-5 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-500"></div>
                          </label>
                        ) : (
                          <span className={`text-sm font-medium ${token.immutable ? 'text-purple-400' : 'text-slate-500'}`}>
                            {token.immutable ? 'Yes' : 'No'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Fair Mint */}
                    <div className="p-3 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-300">Fair Mint</span>
                        </div>
                        {editingTokenId === token.id ? (
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={editValues.fairMint} 
                              onChange={(e) => setEditValues({...editValues, fairMint: e.target.checked})}
                              className="sr-only peer" 
                            />
                            <div className="w-9 h-5 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                          </label>
                        ) : (
                          <span className={`text-sm font-medium ${token.fairMint ? 'text-blue-400' : 'text-slate-500'}`}>
                            {token.fairMint ? 'Enabled' : 'Disabled'}
                          </span>
                        )}
                      </div>
                      {(editingTokenId === token.id ? editValues.fairMint : token.fairMint) && (
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">Max Per Wallet</label>
                          {editingTokenId === token.id ? (
                            <input
                              type="number"
                              value={editValues.maxPerWallet}
                              onChange={(e) => setEditValues({...editValues, maxPerWallet: Number(e.target.value)})}
                              className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm"
                            />
                          ) : (
                            <span className="text-white font-medium">{token.maxPerWallet?.toLocaleString() || 'Not Set'}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Token Lock Settings */}
                    <div className="p-3 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-300">Token Lock Enabled</span>
                        </div>
                        {editingTokenId === token.id ? (
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={editValues.lockEnabled} 
                              onChange={(e) => setEditValues({...editValues, lockEnabled: e.target.checked})}
                              className="sr-only peer" 
                            />
                            <div className="w-9 h-5 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                          </label>
                        ) : (
                          <span className={`text-sm font-medium ${token.lockEnabled ? 'text-green-400' : 'text-slate-500'}`}>
                            {token.lockEnabled ? 'Yes' : 'No'}
                          </span>
                        )}
                      </div>
                      {(editingTokenId === token.id ? editValues.lockEnabled : token.lockEnabled) && (
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <div>
                            <label className="text-xs text-slate-400 mb-1 block">Duration (Days)</label>
                            {editingTokenId === token.id ? (
                              <input
                                type="number"
                                value={editValues.lockDuration}
                                onChange={(e) => setEditValues({...editValues, lockDuration: Number(e.target.value)})}
                                className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm"
                              />
                            ) : (
                              <span className="text-white text-sm">{token.lockDuration || 'N/A'}</span>
                            )}
                          </div>
                          <div>
                            <label className="text-xs text-slate-400 mb-1 block">Release Date</label>
                            {editingTokenId === token.id ? (
                              <input
                                type="date"
                                value={editValues.lockReleaseDate}
                                onChange={(e) => setEditValues({...editValues, lockReleaseDate: e.target.value})}
                                className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm"
                              />
                            ) : (
                              <span className="text-white text-sm">{token.lockReleaseDate || 'N/A'}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Tax Settings */}
                    <div className="p-3 bg-slate-700/30 rounded-lg">
                      <label className="text-sm text-slate-300 mb-2 block flex items-center gap-2">
                        <Coins className="w-4 h-4" />
                        Transaction Taxes
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">Buy Tax (%)</label>
                          {editingTokenId === token.id ? (
                            <input
                              type="number"
                              min={0}
                              max={3}
                              step={0.1}
                              value={editValues.buyTax}
                              onChange={(e) => setEditValues({...editValues, buyTax: Math.min(3, Math.max(0, Number(e.target.value)))})}
                              className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm"
                            />
                          ) : (
                            <span className="text-white text-sm">{token.buyTax || 0}%</span>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">Sell Tax (%)</label>
                          {editingTokenId === token.id ? (
                            <input
                              type="number"
                              min={0}
                              max={3}
                              step={0.1}
                              value={editValues.sellTax}
                              onChange={(e) => setEditValues({...editValues, sellTax: Math.min(3, Math.max(0, Number(e.target.value)))})}
                              className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm"
                            />
                          ) : (
                            <span className="text-white text-sm">{token.sellTax || 0}%</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {editingTokenId === token.id && (
                      <>
                        <div className="p-3 bg-slate-700/30 rounded-lg">
                          <label className="text-sm text-slate-300 mb-2 block">Website URL</label>
                          <input
                            type="url"
                            placeholder="https://example.com"
                            value={editValues.website}
                            onChange={(e) => setEditValues({...editValues, website: e.target.value})}
                            className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="p-3 bg-slate-700/30 rounded-lg">
                          <label className="text-sm text-slate-300 mb-2 block">Telegram Link</label>
                          <input
                            type="url"
                            placeholder="https://t.me/..."
                            value={editValues.telegram}
                            onChange={(e) => setEditValues({...editValues, telegram: e.target.value})}
                            className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="p-3 bg-slate-700/30 rounded-lg">
                          <label className="text-sm text-slate-300 mb-2 block">X (Twitter) Link</label>
                          <input
                            type="url"
                            placeholder="https://x.com/..."
                            value={editValues.twitter}
                            onChange={(e) => setEditValues({...editValues, twitter: e.target.value})}
                            className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}

              <div className="flex items-center gap-2 mt-4 text-xs text-slate-500">
                <Clock className="w-3 h-3" />
                Created: {token.timestamp}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <SendToMintingModal
        isOpen={!!showSendToMinting}
        onClose={() => setShowSendToMinting(null)}
        token={showSendToMinting}
        onConfirm={(settings) => handleSendToMinting(showSendToMinting, settings)}
      />
    </div>
  );
}
