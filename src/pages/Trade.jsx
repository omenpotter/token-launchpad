import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useWallet } from '../components/token/WalletContext';
import SharedHeader from '../components/token/SharedHeader';
import SharedFooter from '../components/token/SharedFooter';
import TradeTab from '../components/token/TradeTab';

export default function TradePage() {
  const { walletConnected } = useWallet();

  const { data: createdTokens = [] } = useQuery({
    queryKey: ['tokens'],
    queryFn: () => base44.entities.Token.list(),
    initialData: []
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <SharedHeader />

      <main className="max-w-6xl mx-auto px-4 py-6">
        <TradeTab
          createdTokens={createdTokens}
          walletConnected={walletConnected}
          currency="XNT"
        />
      </main>

      <SharedFooter />
    </div>
  );
}