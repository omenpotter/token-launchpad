import './polyfills';
import * as web3 from '@solana/web3.js';
import * as splToken from '@solana/spl-token';
import { NETWORK_CONFIG, PROGRAM_ADDRESSES, FEE_RECIPIENT_ADDRESS, TOKEN_CREATION_FEE, PRESALE_CREATION_FEE, DIRECT_MINT_FEE } from './contracts';

const { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram,
  LAMPORTS_PER_SOL,
  Keypair
} = web3;

const {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  createInitializeMint2Instruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  createBurnInstruction,
  createSetAuthorityInstruction,
  getAssociatedTokenAddress,
  getAccount,
  getMint,
  getMintLen,
  AuthorityType,
  ExtensionType,
  createInitializeMetadataPointerInstruction,
  createInitializeTransferFeeConfigInstruction,
  createInitializeNonTransferableMintInstruction,
  TYPE_SIZE,
  LENGTH_SIZE
} = splToken;

// CRITICAL: Standardized dApp metadata - MUST be used in ALL wallet connects
const DAPP_METADATA = {
  name: 'X1Nexus',
  icon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695ece00f88266143b4441ac/5910381b6_711323c7-8ae9-4314-922d-ccab7986c619.jpg',
  url: 'https://x1slauncher.base44.app'
};

class SolanaWeb3Service {
  constructor() {
    this.connection = null;
    this.wallet = null;
    this.publicKey = null;
    this.network = 'x1Testnet';
    this.appName = 'X1Nexus';
  }

  initConnection(network, appName = 'X1Nexus') {
    this.network = network;
    this.appName = appName;
    const config = NETWORK_CONFIG[network];
    this.connection = new Connection(config.rpcUrl, 'confirmed');
    return this.connection;
  }

  // FIXED: Explicit branding metadata passed to wallet
  async connectWallet(walletAdapter, appName = 'X1Nexus') {
    try {
      if (!walletAdapter) {
        throw new Error('No wallet adapter provided');
      }

      this.wallet = walletAdapter;
      this.appName = appName;

      console.log('[Web3Provider] Wallet adapter:', walletAdapter.name || 'Unknown');
      console.log('[Web3Provider] Is connected:', walletAdapter.connected);

      if (!walletAdapter.connected) {
        console.log('[Web3Provider] Connecting with explicit branding metadata:', DAPP_METADATA);
        
        // CRITICAL FIX: Pass metadata object explicitly
        try {
          await walletAdapter.connect(DAPP_METADATA);
        } catch (firstError) {
          console.log('[Web3Provider] First connect attempt failed, trying alternatives...');
          try {
            await walletAdapter.connect({ 
              name: DAPP_METADATA.name,
              icon: DAPP_METADATA.icon,
              url: DAPP_METADATA.url
            });
          } catch (secondError) {
            console.log('[Web3Provider] Second connect attempt failed, trying basic connect...');
            await walletAdapter.connect();
          }
        }
      }

      this.publicKey = walletAdapter.publicKey;
      console.log('[Web3Provider] ✅ Connected to:', this.publicKey.toString());

      return {
        address: this.publicKey.toString(),
        connected: true
      };
    } catch (error) {
      console.error('[Web3Provider] Connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.wallet) {
      await this.wallet.disconnect();
    }
    this.wallet = null;
    this.publicKey = null;
  }

  async getBalance(address) {
    if (!this.connection) throw new Error('Connection not initialized');
    const publicKey = new PublicKey(address || this.publicKey);
    const balance = await this.connection.getBalance(publicKey);
    return balance / LAMPORTS_PER_SOL;
  }

  async createToken(network, tokenData, fee, metadataUri = null) {
    // All tokens are now Token-2022 by default
    return this.createToken2022(network, tokenData, fee, metadataUri);
  }

  async createToken2022(network, tokenData, fee, metadataUri = null) {
    if (!this.wallet || !this.publicKey) throw new Error('Wallet not connected');
    if (!this.connection) this.initConnection(network);

    try {
      const mintKeypair = Keypair.generate();
      const mint = mintKeypair.publicKey;

      // CRITICAL FIX: Don't add MetadataPointer extension to initial creation
      // This prevents "invalid account data" errors during mint initialization
      // Metadata will be added via separate transaction after token is created
      const extensions = [];

      // Add transfer fee extension if specified
      if (tokenData.transferFee) {
        extensions.push(ExtensionType.TransferFeeConfig);
      }

      // Add non-transferable extension if specified
      if (tokenData.nonTransferable) {
        extensions.push(ExtensionType.NonTransferable);
      }

      // Calculate space for mint + extensions only (no metadata)
      const mintLen = getMintLen(extensions);
      const lamports = await this.connection.getMinimumBalanceForRentExemption(mintLen);

      const transaction = new Transaction();

      if (fee > 0) {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: this.publicKey,
            toPubkey: new PublicKey(FEE_RECIPIENT_ADDRESS),
            lamports: fee * LAMPORTS_PER_SOL
          })
        );
      }

      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: this.publicKey,
          newAccountPubkey: mint,
          space: mintLen,
          lamports,
          programId: TOKEN_2022_PROGRAM_ID
        })
      );

      // Initialize other extensions
      if (tokenData.transferFee) {
        const feeBasisPoints = tokenData.transferFeeBasisPoints || 0;
        const maxFee = tokenData.transferFeeMaximum || BigInt(0);

        transaction.add(
          createInitializeTransferFeeConfigInstruction(
            mint,
            this.publicKey,
            this.publicKey,
            feeBasisPoints,
            maxFee,
            TOKEN_2022_PROGRAM_ID
          )
        );
      }

      if (tokenData.nonTransferable) {
        transaction.add(
          createInitializeNonTransferableMintInstruction(
            mint,
            TOKEN_2022_PROGRAM_ID
          )
        );
      }

      // CRITICAL FIX: Use createInitializeMint2Instruction (not Mint) when metadata extensions exist
      transaction.add(
        createInitializeMint2Instruction(
          mint,
          tokenData.decimals,
          this.publicKey,
          tokenData.immutable ? null : this.publicKey,
          TOKEN_2022_PROGRAM_ID
        )
      );

      // NOTE: Token-2022 metadata will be initialized in a separate transaction after mint is confirmed
      // This prevents "invalid account data" errors that occur when trying to initialize metadata 
      // before the mint account is fully settled on-chain

      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.publicKey;

      transaction.partialSign(mintKeypair);

      const signedTx = await this.wallet.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        maxRetries: 3
      });

      await this.connection.confirmTransaction(signature, 'confirmed');
      
      console.log('[Web3Provider] ✅ Token created successfully on-chain');
      console.log('[Web3Provider] Token Address:', mint.toString());

      // NOTE: Token-2022 metadata can be initialized later via initializeToken2022Metadata() method
      // This is optional and doesn't affect token functionality
      const associatedToken = await getAssociatedTokenAddress(
        mint,
        this.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const transaction2 = new Transaction();

      transaction2.add(
        createAssociatedTokenAccountInstruction(
          this.publicKey,
          associatedToken,
          this.publicKey,
          mint,
          TOKEN_2022_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );

      if (tokenData.supply > 0) {
        transaction2.add(
          createMintToInstruction(
            mint,
            associatedToken,
            this.publicKey,
            tokenData.supply * Math.pow(10, tokenData.decimals),
            [],
            TOKEN_2022_PROGRAM_ID
          )
        );
      }

      if (tokenData.lockMint) {
        transaction2.add(
          createSetAuthorityInstruction(
            mint,
            this.publicKey,
            AuthorityType.MintTokens,
            null,
            [],
            TOKEN_2022_PROGRAM_ID
          )
        );
      }

      const { blockhash: blockhash2 } = await this.connection.getLatestBlockhash();
      transaction2.recentBlockhash = blockhash2;
      transaction2.feePayer = this.publicKey;

      const signedTx2 = await this.wallet.signTransaction(transaction2);
      const signature2 = await this.connection.sendRawTransaction(signedTx2.serialize(), {
        skipPreflight: false,
        maxRetries: 3
      });

      await this.connection.confirmTransaction(signature2, 'confirmed');

      return {
        txHash: signature,
        tokenAddress: mint.toString(),
        associatedTokenAccount: associatedToken.toString(),
        tokenType: 'TOKEN2022'
      };
    } catch (error) {
      console.error('Error creating Token-2022:', error);
      throw error;
    }
  }

  async initializeToken2022Metadata(mint, name, symbol, uri) {
    if (!this.wallet || !this.publicKey) throw new Error('Wallet not connected');
    if (!this.connection) throw new Error('Connection not initialized');

    try {
      const mintPubkey = new PublicKey(mint);

      const { 
        createInitializeInstruction
      } = await import('@solana/spl-token-metadata');

      const initMetadataIx = createInitializeInstruction({
        programId: TOKEN_2022_PROGRAM_ID,
        mint: mintPubkey,
        metadata: mintPubkey,
        name: name || 'Unknown',
        symbol: symbol || 'UNK',
        uri: uri || '',
        mintAuthority: this.publicKey,
        updateAuthority: this.publicKey
      });

      const transaction = new Transaction().add(initMetadataIx);

      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.publicKey;

      const signedTx = await this.wallet.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        maxRetries: 3
      });
      
      await this.connection.confirmTransaction(signature, 'confirmed');

      console.log('[Web3Provider] Metadata initialization successful:', signature);
      return signature;
    } catch (error) {
      console.error('[Web3Provider] Error initializing Token-2022 metadata:', error);
      throw error;
    }
  }

  async createMetaplexMetadata(tokenMint, metadataUri, name, symbol, isMutable = true) {
    if (!this.wallet || !this.publicKey) throw new Error('Wallet not connected');
    if (!this.connection) throw new Error('Connection not initialized');

    try {
      const { createCreateMetadataAccountV3Instruction, PROGRAM_ID } = await import('@metaplex-foundation/mpl-token-metadata');
      
      const mint = new PublicKey(tokenMint);
      
      // Derive metadata PDA
      const [metadataPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('metadata'),
          PROGRAM_ID.toBuffer(),
          mint.toBuffer()
        ],
        PROGRAM_ID
      );

      const createMetadataInstruction = createCreateMetadataAccountV3Instruction(
        {
          metadata: metadataPDA,
          mint: mint,
          mintAuthority: this.publicKey,
          payer: this.publicKey,
          updateAuthority: this.publicKey
        },
        {
          createMetadataAccountArgsV3: {
            data: {
              name: name,
              symbol: symbol,
              uri: metadataUri,
              sellerFeeBasisPoints: 0,
              creators: null,
              collection: null,
              uses: null
            },
            isMutable: isMutable,
            collectionDetails: null
          }
        }
      );

      const transaction = new Transaction().add(createMetadataInstruction);
      
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.publicKey;

      const signedTx = await this.wallet.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(signedTx.serialize());
      await this.connection.confirmTransaction(signature, 'confirmed');

      return signature;
    } catch (error) {
      console.error('Error creating Metaplex metadata:', error);
      throw error;
    }
  }

  async mintTokens(tokenAddress, amount, decimals, fee, programId = TOKEN_PROGRAM_ID) {
    if (!this.wallet || !this.publicKey) throw new Error('Wallet not connected');
    if (!this.connection) throw new Error('Connection not initialized');

    try {
      const mint = new PublicKey(tokenAddress);
      const tokenProgramId = new PublicKey(programId);
      
      // Check if mint authority exists
      const mintInfo = await getMint(this.connection, mint, 'confirmed', tokenProgramId);
      if (!mintInfo.mintAuthority) {
        throw new Error('Mint authority has been revoked. Cannot mint more tokens.');
      }
      
      if (mintInfo.mintAuthority.toString() !== this.publicKey.toString()) {
        throw new Error('You are not the mint authority for this token.');
      }

      const associatedToken = await getAssociatedTokenAddress(
        mint,
        this.publicKey,
        false,
        tokenProgramId,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const transaction = new Transaction();

      if (fee > 0) {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: this.publicKey,
            toPubkey: new PublicKey(FEE_RECIPIENT_ADDRESS),
            lamports: fee * LAMPORTS_PER_SOL
          })
        );
      }

      transaction.add(
        createMintToInstruction(
          mint,
          associatedToken,
          this.publicKey,
          amount * Math.pow(10, decimals),
          [],
          tokenProgramId
        )
      );

      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.publicKey;

      const signedTx = await this.wallet.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(signedTx.serialize());
      await this.connection.confirmTransaction(signature, 'confirmed');

      return {
        txHash: signature
      };
    } catch (error) {
      console.error('Error minting tokens:', error);
      throw error;
    }
  }

  async burnTokens(tokenAddress, amount, decimals, programId = TOKEN_PROGRAM_ID) {
    if (!this.wallet || !this.publicKey) throw new Error('Wallet not connected');
    if (!this.connection) throw new Error('Connection not initialized');

    try {
      const mint = new PublicKey(tokenAddress);
      const tokenProgramId = new PublicKey(programId);
      
      const associatedToken = await getAssociatedTokenAddress(
        mint,
        this.publicKey,
        false,
        tokenProgramId,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      try {
        const accountInfo = await getAccount(this.connection, associatedToken, 'confirmed', tokenProgramId);
        const balance = Number(accountInfo.amount) / Math.pow(10, decimals);
        
        if (balance < amount) {
          throw new Error(`Insufficient balance. You have ${balance} tokens, trying to burn ${amount}`);
        }
      } catch (error) {
        if (error.message.includes('could not find account')) {
          throw new Error('Token account not found. You may not hold any of these tokens.');
        }
        throw error;
      }

      const transaction = new Transaction();

      transaction.add(
        createBurnInstruction(
          associatedToken,
          mint,
          this.publicKey,
          amount * Math.pow(10, decimals),
          [],
          tokenProgramId
        )
      );

      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.publicKey;

      const signedTx = await this.wallet.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(signedTx.serialize());
      await this.connection.confirmTransaction(signature, 'confirmed');

      return {
        txHash: signature
      };
    } catch (error) {
      console.error('Error burning tokens:', error);
      throw error;
    }
  }

  async getTokenInfo(tokenAddress, programId = TOKEN_PROGRAM_ID) {
    if (!this.connection) throw new Error('Connection not initialized');

    try {
      const mint = new PublicKey(tokenAddress);
      const tokenProgramId = new PublicKey(programId);
      const mintInfo = await getMint(this.connection, mint, 'confirmed', tokenProgramId);

      return {
        address: tokenAddress,
        decimals: mintInfo.decimals,
        supply: Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals),
        mintAuthority: mintInfo.mintAuthority?.toString() || null,
        freezeAuthority: mintInfo.freezeAuthority?.toString() || null,
        programId: programId
      };
    } catch (error) {
      console.error('Error getting token info:', error);
      throw error;
    }
  }

  async addLiquidity(network, tokenAddress, tokenAmount, solAmount, decimals) {
    if (!this.wallet || !this.publicKey) throw new Error('Wallet not connected');
    if (!this.connection) this.initConnection(network);

    try {
      const transaction = new Transaction();

      transaction.add(
        SystemProgram.transfer({
          fromPubkey: this.publicKey,
          toPubkey: new PublicKey(PROGRAM_ADDRESSES[network].DEXProgram),
          lamports: solAmount * LAMPORTS_PER_SOL
        })
      );

      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.publicKey;

      const signedTx = await this.wallet.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(signedTx.serialize());
      await this.connection.confirmTransaction(signature, 'confirmed');

      return {
        txHash: signature
      };
    } catch (error) {
      console.error('Error adding liquidity:', error);
      throw error;
    }
  }

  async swapTokens(network, fromToken, toToken, amountIn, decimals) {
    if (!this.wallet || !this.publicKey) throw new Error('Wallet not connected');
    if (!this.connection) this.initConnection(network);

    try {
      const transaction = new Transaction();

      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.publicKey;

      const signedTx = await this.wallet.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(signedTx.serialize());
      await this.connection.confirmTransaction(signature, 'confirmed');

      return {
        txHash: signature
      };
    } catch (error) {
      console.error('Error swapping tokens:', error);
      throw error;
    }
  }

  async createPresale(network, presaleData, fee) {
    if (!this.wallet || !this.publicKey) throw new Error('Wallet not connected');
    if (!this.connection) this.initConnection(network);

    try {
      const transaction = new Transaction();

      if (fee > 0) {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: this.publicKey,
            toPubkey: new PublicKey(FEE_RECIPIENT_ADDRESS),
            lamports: fee * LAMPORTS_PER_SOL
          })
        );
      }

      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.publicKey;

      const signedTx = await this.wallet.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(signedTx.serialize());
      await this.connection.confirmTransaction(signature, 'confirmed');

      return {
        txHash: signature,
        presaleAddress: 'PRESALE_ACCOUNT_ADDRESS'
      };
    } catch (error) {
      console.error('Error creating presale:', error);
      throw error;
    }
  }

  async investInPresale(presaleAddress, amount) {
    if (!this.wallet || !this.publicKey) throw new Error('Wallet not connected');
    if (!this.connection) throw new Error('Connection not initialized');

    try {
      const transaction = new Transaction();

      transaction.add(
        SystemProgram.transfer({
          fromPubkey: this.publicKey,
          toPubkey: new PublicKey(presaleAddress),
          lamports: amount * LAMPORTS_PER_SOL
        })
      );

      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.publicKey;

      const signedTx = await this.wallet.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(signedTx.serialize());
      await this.connection.confirmTransaction(signature, 'confirmed');

      return {
        txHash: signature
      };
    } catch (error) {
      console.error('Error investing in presale:', error);
      throw error;
    }
  }
}

export const web3Service = new SolanaWeb3Service();