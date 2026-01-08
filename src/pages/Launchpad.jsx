import '../components/token/web3/polyfills';
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useWallet } from '../components/token/WalletContext';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft } from 'lucide-react';
import SharedHeader from '../components/token/SharedHeader';
import SharedFooter from '../components/token/SharedFooter';
import WalletApprovalModal from '../components/token/WalletApprovalModal';
import LaunchpadTab from '../components/token/LaunchpadTab';
import PresaleDetailModal from '../components/token/PresaleDetailModal';
import InvestModal from '../components/token/InvestModal';
import { web3Service } from '../components/token/web3/Web3Provider';

export default function LaunchpadPage() {
  const { walletConnected, walletAddress } = useWallet();
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalData, setApprovalData] = useState(null);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [presales, setPresales] = useState([]);
  const [selectedPresale, setSelectedPresale] = useState(null);
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [investAmount, setInvestAmount] = useState(0);
  const [selectedTokenForPresale, setSelectedTokenForPresale] = useState('');

  const PRESALE_CREATION_FEE = 0.2;

  const { data: createdTokens = [] } = useQuery({
    queryKey: ['tokens', walletAddress],
    queryFn: () => base44.entities.Token.filter({ creator: walletAddress }),
    enabled: walletConnected && !!walletAddress,
    initialData: []
  });

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
      currency: 'XNT',
      details: {
        tokenName: token.name,
        tokenSymbol: token.symbol,
        action: `Create presale: ${presaleData.name}`
      },
      presaleData: { ...presaleData, token }
    });
    setShowApprovalModal(true);
  };

  const handleApproveTransaction = async () => {
    setApprovalLoading(true);
    try {
      if (approvalData.type === 'presale_creation') {
        const { presaleData } = approvalData;
        const token = presaleData.token;

        const result = await web3Service.createPresale('x1Mainnet', {
          tokenAddress: token.mint,
          softCap: presaleData.softCap,
          hardCap: presaleData.hardCap,
          startDate: presaleData.startDate,
          endDate: presaleData.endDate,
          minContribution: presaleData.minContribution,
          maxContribution: presaleData.maxContribution
        }, PRESALE_CREATION_FEE);

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
          currency: 'XNT',
          status: 'upcoming',
          raised: 0,
          investors: 0,
          createdAt: new Date().toLocaleString(),
          presaleAddress: result.presaleAddress,
          txHash: result.txHash
        };

        setPresales([newPresale, ...presales]);
        alert(`✅ Presale created!\nAddress: ${result.presaleAddress}\nTx: ${result.txHash}`);
      } else if (approvalData.type === 'presale_investment') {
        const result = await web3Service.investInPresale(
          selectedPresale.presaleAddress || '0x1234567890',
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

        alert(`✅ Investment successful!\nAmount: ${investAmount} XNT\nTx: ${result.txHash}`);
      }
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
      <SharedHeader />

      <main className="max-w-6xl mx-auto px-4 py-6">
        <Link
          to={createPageUrl('Minting')}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Minting</span>
        </Link>
        
        <LaunchpadTab
          createdTokens={createdTokens}
          presales={presales}
          walletConnected={walletConnected}
          presaleFee={PRESALE_CREATION_FEE}
          currency="XNT"
          onCreatePresale={handleCreatePresale}
          onViewPresale={(presale) => setSelectedPresale(presale)}
          selectedTokenForPresale={selectedTokenForPresale}
          setSelectedTokenForPresale={setSelectedTokenForPresale}
        />
      </main>

      <SharedFooter />

      <WalletApprovalModal 
        isOpen={showApprovalModal} 
        onClose={() => { setShowApprovalModal(false); setApprovalData(null); }} 
        onApprove={handleApproveTransaction} 
        isLoading={approvalLoading} 
        approvalData={approvalData} 
      />
      <PresaleDetailModal 
        presale={selectedPresale} 
        onClose={() => setSelectedPresale(null)} 
        onInvest={(presale) => { setShowInvestModal(true); setInvestAmount(0); }} 
        walletConnected={walletConnected} 
      />
      <InvestModal 
        isOpen={showInvestModal} 
        onClose={() => { setShowInvestModal(false); setInvestAmount(0); }} 
        presale={selectedPresale} 
        investAmount={investAmount} 
        setInvestAmount={setInvestAmount} 
        currency="XNT" 
        onConfirm={() => {
          setApprovalData({
            type: 'presale_investment',
            title: 'Invest in Presale',
            amount: investAmount,
            currency: 'XNT',
            details: {
              tokenName: selectedPresale.tokenName,
              tokenSymbol: selectedPresale.tokenSymbol,
              action: `Invest ${investAmount} XNT`
            }
          });
          setShowInvestModal(false);
          setShowApprovalModal(true);
        }} 
      />
    </div>
  );
}