import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useWallet } from '../components/token/WalletContext';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft } from 'lucide-react';
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
        <Link
          to={createPageUrl('Minting')}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Minting</span>
        </Link>
        
        <DashboardTab
          createdTokens={createdTokens}
          setCreatedTokens={(updatedTokens) => {
            // Update function - refetch will be called after DB updates
            refetchTokens();
          }}
          network="x1Mainnet"
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