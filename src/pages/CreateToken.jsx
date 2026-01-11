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
import CreateTokenTab from '../components/token/CreateTokenTab';
import { web3Service } from '../components/token/web3/Web3Provider';

export default function CreateTokenPage() {
  const { walletConnected, walletAddress } = useWallet();
  const [network, setNetwork] = useState('x1Mainnet');
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
  const [buyTax, setBuyTax] = useState(0);
  const [sellTax, setSellTax] = useState(0);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalData, setApprovalData] = useState(null);
  const [approvalLoading, setApprovalLoading] = useState(false);

  const TOKEN_CREATION_FEE = 0.2;

  const { refetch: refetchTokens } = useQuery({
    queryKey: ['tokens'],
    queryFn: () => base44.entities.Token.list(),
    enabled: false
  });

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
      // Step 1: Upload metadata to IPFS if metadata fields are provided
      let metadataUri = null;
      if (tokenName && tokenSymbol && (tokenDescription || tokenLogo || tokenWebsite)) {
        try {
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
          console.log('Metadata uploaded:', metadataUri);
        } catch (metadataError) {
          console.warn('Failed to upload metadata, continuing without it:', metadataError);
        }
      }

      // Step 2: Create token on-chain with metadata
      const result = await web3Service.createToken(network, {
        name: tokenName,
        symbol: tokenSymbol,
        decimals: decimals,
        supply: supply,
        lockMint: lockMintAuthority,
        immutable: immutableToken,
        maxPerWallet: fairMintEnabled ? maxPerWallet : 0
      }, TOKEN_CREATION_FEE, metadataUri);

      // Step 3: Save token to database
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
        buyTax: buyTax,
        sellTax: sellTax,
        totalMinted: 0,
        burned: 0,
        txHash: result.txHash,
        creator: walletAddress,
        metadataUri: metadataUri
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

      alert(`✅ Token created with metadata!\nAddress: ${result.tokenAddress}\nTx: ${result.txHash}${result.metadataTxHash ? `\nMetadata Tx: ${result.metadataTxHash}` : ''}`);
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
          buyTax={buyTax}
          setBuyTax={setBuyTax}
          sellTax={sellTax}
          setSellTax={setSellTax}
          walletConnected={walletConnected}
          creationFee={TOKEN_CREATION_FEE}
          currency="XNT"
          onCreateToken={handleCreateToken}
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
    </div>
  );
}