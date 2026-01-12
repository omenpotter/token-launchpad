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
  
  // Metadata Initialization State
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  const [createdTokens, setCreatedTokens] = useState([]);
  const [selectedTokenForMetadata, setSelectedTokenForMetadata] = useState(null);
  const [metadataLoading, setMetadataLoading] = useState(false);

  const TOKEN_CREATION_FEE = 0.2;

  const { refetch: refetchTokens } = useQuery({
    queryKey: ['tokens', walletAddress],
    queryFn: async () => {
      const tokens = await base44.entities.Token.filter({ creator: walletAddress });
      setCreatedTokens(tokens);
      return tokens;
    },
    enabled: walletConnected && !!walletAddress,
    initialData: []
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

  const handleInitializeMetadata = async () => {
    if (!selectedTokenForMetadata) {
      alert('Please select a token');
      return;
    }

    if (!tokenName || !tokenSymbol) {
      alert('Please fill in token name and symbol');
      return;
    }

    setMetadataLoading(true);
    try {
      // Initialize web3 connection if needed
      if (!web3Service.connection) {
        web3Service.initConnection(network);
      }

      // Step 1: Upload metadata to IPFS if metadata fields are provided
      let metadataUri = null;
      if (tokenDescription || tokenLogo || tokenWebsite) {
        try {
          console.log('[CreateToken] Uploading metadata to IPFS...');
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
          console.log('[CreateToken] Metadata uploaded successfully:', metadataUri);
        } catch (metadataError) {
          console.warn('[CreateToken] Failed to upload to IPFS:', metadataError.message);
          metadataUri = null;
        }
      }

      // Step 2: Initialize metadata on-chain
      console.log('[CreateToken] Initializing metadata on-chain...');
      const token = selectedTokenForMetadata;
      const signature = await web3Service.initializeToken2022Metadata(
        token.mint,
        tokenName,
        tokenSymbol,
        metadataUri || ''
      );

      // Step 3: Update token in database
      await base44.entities.Token.update(token.id, {
        metadataUri: metadataUri,
        metadataInitialized: true,
        metadataTxHash: signature
      });

      await refetchTokens();

      alert(`✅ Metadata Initialized Successfully!\n\nTransaction: ${signature}${metadataUri ? `\nMetadata URI: ${metadataUri}` : ''}`);
      
      setShowMetadataModal(false);
      setSelectedTokenForMetadata(null);
      console.log('[CreateToken] Metadata initialization completed successfully');
    } catch (error) {
      console.error('[CreateToken] Metadata initialization error:', error);
      alert('Metadata initialization failed: ' + error.message);
    } finally {
      setMetadataLoading(false);
    }
  };

  const handleApproveTransaction = async () => {
    setApprovalLoading(true);
    try {
      // Initialize web3 connection
      if (!web3Service.connection) {
        web3Service.initConnection(network);
      }

      // Step 1: Create token on-chain (WITHOUT metadata)
      console.log('[CreateToken] Creating token on-chain...');
      const result = await web3Service.createToken(network, {
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
      }, TOKEN_CREATION_FEE, null); // No metadata URI passed initially

      // Step 2: Save token to database
      console.log('[CreateToken] Token created successfully, saving to database...');
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
        associatedTokenAccount: result.associatedTokenAccount,
        creator: walletAddress,
        metadataUri: null, // Will be set after metadata initialization
        metadataInitialized: false,
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

      // Show success message
      const successMessage = `✅ Token Created Successfully!\n\nName: ${tokenName}\nSymbol: ${tokenSymbol}\nAddress: ${result.tokenAddress}\nTransaction: ${result.txHash}\n\n📝 Next Step: Initialize Metadata (Optional)\nYou can now add metadata to your token using the "Initialize Metadata" button - at no additional cost!`;
      alert(successMessage);
      
      console.log('[CreateToken] Token creation completed successfully');
    } catch (error) {
      console.error('[CreateToken] Transaction error:', error);
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

        {/* Initialize Metadata Section - Shows after token creation */}
        {createdTokens.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-6 border border-blue-500/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Token Metadata (Optional)</h3>
                <p className="text-slate-400">Add metadata to your existing tokens - No Platform Charge!</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-300">Tokens without metadata: <strong className="text-yellow-400">{createdTokens.filter(t => !t.metadataInitialized).length}</strong></p>
              </div>
            </div>

            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3 mb-4 flex items-start gap-3">
              <div className="text-blue-400 mt-0.5">ℹ️</div>
              <div className="text-sm text-blue-300">
                <strong>No Platform Charge:</strong> Metadata initialization has no platform fees. You only pay blockchain gas fees. Your token is already created and tradeable!
              </div>
            </div>

            <button
              onClick={() => setShowMetadataModal(true)}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl transition font-medium flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Initialize Metadata
            </button>
          </div>
        )}
      </main>

      <SharedFooter />

      <WalletApprovalModal 
        isOpen={showApprovalModal} 
        onClose={() => { setShowApprovalModal(false); setApprovalData(null); }} 
        onApprove={handleApproveTransaction} 
        isLoading={approvalLoading} 
        approvalData={approvalData} 
      />

      {/* Initialize Metadata Modal */}
      {showMetadataModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-4">Initialize Metadata</h3>
            
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-4">
              <p className="text-sm text-blue-300">
                ℹ️ <strong>No Platform Charge</strong> - You only pay blockchain gas fees!
              </p>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
              {createdTokens.length === 0 ? (
                <p className="text-slate-400 text-center py-4">No tokens created yet</p>
              ) : (
                createdTokens.map((token) => (
                  <button
                    key={token.id}
                    onClick={() => {
                      setSelectedTokenForMetadata(token);
                      setTokenName(token.name);
                      setTokenSymbol(token.symbol);
                      setTokenLogo(token.logo || '');
                      setTokenWebsite(token.website || '');
                      setTokenTelegram(token.telegram || '');
                      setTokenTwitter(token.twitter || '');
                      setTokenDescription(token.description || '');
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition ${
                      selectedTokenForMetadata?.id === token.id
                        ? 'bg-blue-600 border-blue-500'
                        : 'bg-slate-700 border-slate-600 hover:border-blue-500'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-white font-medium">{token.name}</p>
                        <p className="text-slate-400 text-sm">{token.symbol}</p>
                      </div>
                      {token.metadataInitialized ? (
                        <span className="text-green-400 text-xs font-medium">✓ Done</span>
                      ) : (
                        <span className="text-yellow-400 text-xs font-medium">Pending</span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>

            {selectedTokenForMetadata && (
              <div className="bg-slate-700/30 rounded-lg p-3 mb-4 text-sm">
                <p className="text-slate-300">
                  <strong>Token:</strong> {selectedTokenForMetadata.name} ({selectedTokenForMetadata.symbol})
                </p>
                <p className="text-slate-400 text-xs font-mono truncate mt-1">
                  {selectedTokenForMetadata.mint}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowMetadataModal(false);
                  setSelectedTokenForMetadata(null);
                }}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleInitializeMetadata}
                disabled={!selectedTokenForMetadata || metadataLoading}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white rounded-xl transition font-medium"
              >
                {metadataLoading ? 'Initializing...' : 'Initialize Metadata'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}