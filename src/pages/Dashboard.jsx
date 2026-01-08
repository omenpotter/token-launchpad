import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useWallet } from '../components/token/WalletContext';
import SharedHeader from '../components/token/SharedHeader';
import SharedFooter from '../components/token/SharedFooter';
import DashboardTab from '../components/token/DashboardTab';

export default function DashboardPage() {
  const { walletConnected, walletAddress } = useWallet();

  const { data: createdTokens = [], refetch: refetchTokens } = useQuery({
    queryKey: ['tokens', walletAddress],
    queryFn: () => base44.entities.Token.filter({ creator: walletAddress }),
    enabled: walletConnected && !!walletAddress,
    initialData: []
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <SharedHeader />

      <main className="max-w-6xl mx-auto px-4 py-6">
        <DashboardTab
          createdTokens={createdTokens}
          setCreatedTokens={async () => {
            await refetchTokens();
          }}
          network="x1Testnet"
          onQuickAction={(action, tokenId) => {
            // Navigation handled by DashboardTab
          }}
          presales={[]}
        />
      </main>

      <SharedFooter />
    </div>
  );
}