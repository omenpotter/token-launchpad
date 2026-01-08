import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useWallet } from '../components/token/WalletContext';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft } from 'lucide-react';
import SharedHeader from '../components/token/SharedHeader';
import SharedFooter from '../components/token/SharedFooter';
import AdvancedTradingPanel from '../components/token/AdvancedTradingPanel';

export default function TradePage() {
  const { walletConnected, wallet } = useWallet();
  const [selectedToken, setSelectedToken] = useState('');

  const { data: createdTokens = [], refetch } = useQuery({
    queryKey: ['tokens'],
    queryFn: () => base44.entities.Token.list(),
    initialData: []
  });

  const token = createdTokens.find(t => t.id?.toString() === selectedToken);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <SharedHeader />

      <main className="max-w-6xl mx-auto px-4 py-6">
        <Link
          to={createPageUrl('Minting')}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Minting</span>
        </Link>
        
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">Trade Tokens</h2>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <label className="block text-sm text-slate-300 mb-2">Select Token to Trade</label>
            <select
              value={selectedToken}
              onChange={(e) => setSelectedToken(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition"
            >
              <option value="">Choose a token...</option>
              {createdTokens.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>

        {token ? (
          <AdvancedTradingPanel
            tokenAddress={token.mint}
            tokenSymbol={token.symbol}
            tokenName={token.name}
            walletConnected={walletConnected}
            wallet={wallet}
            onTradeComplete={() => refetch()}
          />
        ) : (
          <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50 text-center">
            <p className="text-slate-400">Select a token to start trading</p>
          </div>
        )}
      </main>

      <SharedFooter />
    </div>
  );
}