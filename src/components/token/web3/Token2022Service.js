import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  Keypair,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';

import {
  createInitializeMint2Instruction,
  createInitializeMetadataPointerInstruction,
  createInitializeTransferFeeConfigInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  createBurnInstruction,
  createSetAuthorityInstruction,
  getAssociatedTokenAddress,
  getMint,
  getAccount,
  getMintLen,
  ExtensionType,
  AuthorityType,
  TOKEN_2022_PROGRAM_ID as SPL_TOKEN_2022_ID
} from '@solana/spl-token';

import {
  createCreateMetadataAccountV3Instruction,
  PROGRAM_ID as METADATA_PROGRAM_ID
} from '@metaplex-foundation/mpl-token-metadata';

import {
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_METADATA_PROGRAM_ID,
  INCINERATOR_ADDRESS,
  X1_RPC_ENDPOINTS
} from './constants';

/**
 * Token-2022 Service for X1 Blockchain
 * Handles all token operations using ONLY Token-2022 Program
 */
class Token2022Service {
  constructor() {
    this.connection = null;
    this.wallet = null;
    this.publicKey = null;
    this.network = 'mainnet';
  }

  /**
   * Initialize connection to X1 blockchain
   */
  initConnection(network = 'mainnet') {
    this.network = network;
    const rpcUrl = X1_RPC_ENDPOINTS[network];
    this.connection = new Connection(rpcUrl, 'confirmed');
    console.log(`[Token2022] Connected to X1 ${network}: ${rpcUrl}`);
    return this.connection;
  }

  /**
   * Connect wallet
   */
  async connectWallet(walletAdapter) {
    try {
      this.wallet = walletAdapter;
      
      if (!walletAdapter.connected) {
        await walletAdapter.connect();
      }
      
      this.publicKey = walletAdapter.publicKey;
      console.log('[Token2022] Wallet connected:', this.publicKey.toString());
      
      return {
        address: this.publicKey.toString(),
        connected: true
      };
    } catch (error) {
      console.error('[Token2022] Wallet connection error:', error);
      throw error;
    }
  }

  /**
   * Create Token-2022 with metadata in ONE transaction
   */
  async createToken(tokenConfig) {
    try {
      if (!this.wallet || !this.publicKey) {
        throw new Error('Wallet not connected');
      }

      console.log('[Token2022] Creating token with config:', tokenConfig);

      const mintKeypair = Keypair.generate();
      const transaction = new Transaction();

      // Determine which extensions to enable
      const extensions = [ExtensionType.MetadataPointer];
      
      if (tokenConfig.transferFee) {
        extensions.push(ExtensionType.TransferFeeConfig);
      }
      
      if (tokenConfig.nonTransferable) {
        extensions.push(ExtensionType.NonTransferable);
      }

      // Calculate space needed for mint account with extensions
      const mintLen = getMintLen(extensions);
      const lamports = await this.connection.getMinimumBalanceForRentExemption(mintLen);

      // 1. Create account
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: this.publicKey,
          newAccountPubkey: mintKeypair.publicKey,
          space: mintLen,
          lamports,
          programId: new PublicKey(TOKEN_2022_PROGRAM_ID)
        })
      );

      // 2. Initialize metadata pointer (points to the mint itself)
      transaction.add(
        createInitializeMetadataPointerInstruction(
          mintKeypair.publicKey,
          this.publicKey,
          mintKeypair.publicKey, // Metadata stored on mint account
          new PublicKey(TOKEN_2022_PROGRAM_ID)
        )
      );

      // 3. Initialize transfer fee if enabled
      if (tokenConfig.transferFee) {
        const feeBasisPoints = Math.floor(tokenConfig.transferFeePercent * 100);
        const maxFee = tokenConfig.maxTransferFee * Math.pow(10, tokenConfig.decimals);
        
        transaction.add(
          createInitializeTransferFeeConfigInstruction(
            mintKeypair.publicKey,
            this.publicKey, // Transfer fee config authority
            this.publicKey, // Withdraw withheld authority
            feeBasisPoints,
            BigInt(maxFee),
            new PublicKey(TOKEN_2022_PROGRAM_ID)
          )
        );
      }

      // 4. Initialize mint
      transaction.add(
        createInitializeMint2Instruction(
          mintKeypair.publicKey,
          tokenConfig.decimals,
          this.publicKey, // Mint authority
          tokenConfig.freezeAuthority ? this.publicKey : null, // Freeze authority
          new PublicKey(TOKEN_2022_PROGRAM_ID)
        )
      );

      // 5. Create Metaplex metadata account
      const [metadataPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('metadata'),
          new PublicKey(TOKEN_METADATA_PROGRAM_ID).toBuffer(),
          mintKeypair.publicKey.toBuffer()
        ],
        new PublicKey(TOKEN_METADATA_PROGRAM_ID)
      );

      transaction.add(
        createCreateMetadataAccountV3Instruction(
          {
            metadata: metadataPDA,
            mint: mintKeypair.publicKey,
            mintAuthority: this.publicKey,
            payer: this.publicKey,
            updateAuthority: this.publicKey
          },
          {
            createMetadataAccountArgsV3: {
              data: {
                name: tokenConfig.name,
                symbol: tokenConfig.symbol,
                uri: tokenConfig.uri || '',
                sellerFeeBasisPoints: 0,
                creators: null,
                collection: null,
                uses: null
              },
              isMutable: true,
              collectionDetails: null
            }
          }
        )
      );

      // 6. If initial supply, create token account and mint
      if (tokenConfig.initialSupply && tokenConfig.initialSupply > 0) {
        const associatedToken = await getAssociatedTokenAddress(
          mintKeypair.publicKey,
          this.publicKey,
          false,
          new PublicKey(TOKEN_2022_PROGRAM_ID),
          new PublicKey(ASSOCIATED_TOKEN_PROGRAM_ID)
        );

        // Create associated token account
        transaction.add(
          createAssociatedTokenAccountInstruction(
            this.publicKey,
            associatedToken,
            this.publicKey,
            mintKeypair.publicKey,
            new PublicKey(TOKEN_2022_PROGRAM_ID),
            new PublicKey(ASSOCIATED_TOKEN_PROGRAM_ID)
          )
        );

        // Mint initial supply
        const mintAmount = tokenConfig.initialSupply * Math.pow(10, tokenConfig.decimals);
        transaction.add(
          createMintToInstruction(
            mintKeypair.publicKey,
            associatedToken,
            this.publicKey,
            BigInt(mintAmount),
            [],
            new PublicKey(TOKEN_2022_PROGRAM_ID)
          )
        );
      }

      // Sign and send transaction
      transaction.recentBlockhash = (
        await this.connection.getLatestBlockhash()
      ).blockhash;
      transaction.feePayer = this.publicKey;
      
      // Sign with mint keypair
      transaction.partialSign(mintKeypair);
      
      // Sign with wallet
      const signed = await this.wallet.signTransaction(transaction);
      const txHash = await this.connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed'
      });
      
      await this.connection.confirmTransaction(txHash, 'confirmed');

      console.log('[Token2022] ✅ Token created:', {
        mint: mintKeypair.publicKey.toString(),
        metadata: metadataPDA.toString(),
        txHash
      });

      return {
        success: true,
        mintAddress: mintKeypair.publicKey.toString(),
        metadataAddress: metadataPDA.toString(),
        txHash,
        explorerUrl: `https://explorer.x1.xyz/tx/${txHash}`
      };
    } catch (error) {
      console.error('[Token2022] Create token error:', error);
      throw error;
    }
  }

  /**
   * Check if wallet has mint authority
   */
  async checkMintAuthority(mintAddress) {
    try {
      const mint = new PublicKey(mintAddress);
      const mintInfo = await getMint(
        this.connection,
        mint,
        'confirmed',
        new PublicKey(TOKEN_2022_PROGRAM_ID)
      );

      const isAuthority = mintInfo.mintAuthority && 
        mintInfo.mintAuthority.equals(this.publicKey);

      return {
        hasAuthority: isAuthority,
        currentAuthority: mintInfo.mintAuthority?.toBase58() || null,
        isLocked: mintInfo.mintAuthority === null
      };
    } catch (error) {
      console.error('[Token2022] Check authority error:', error);
      throw error;
    }
  }

  /**
   * Mint tokens (only if you have authority)
   */
  async mintTokens(mintAddress, amount, decimals = 9) {
    try {
      if (!this.wallet || !this.publicKey) {
        throw new Error('Wallet not connected');
      }

      // Check authority first
      const authCheck = await this.checkMintAuthority(mintAddress);
      
      if (!authCheck.hasAuthority) {
        throw new Error(
          `❌ You don't have mint authority for this token.\n\n` +
          `Mint Authority: ${authCheck.currentAuthority || 'Locked (null)'}\n` +
          `Your Wallet: ${this.publicKey.toBase58()}\n\n` +
          `Only the wallet that created this token can mint more tokens.`
        );
      }

      const mint = new PublicKey(mintAddress);
      
      // Get or create associated token account
      const associatedToken = await getAssociatedTokenAddress(
        mint,
        this.publicKey,
        false,
        new PublicKey(TOKEN_2022_PROGRAM_ID),
        new PublicKey(ASSOCIATED_TOKEN_PROGRAM_ID)
      );

      const transaction = new Transaction();

      // Check if account exists
      try {
        await getAccount(
          this.connection,
          associatedToken,
          'confirmed',
          new PublicKey(TOKEN_2022_PROGRAM_ID)
        );
      } catch (error) {
        // Create if doesn't exist
        transaction.add(
          createAssociatedTokenAccountInstruction(
            this.publicKey,
            associatedToken,
            this.publicKey,
            mint,
            new PublicKey(TOKEN_2022_PROGRAM_ID),
            new PublicKey(ASSOCIATED_TOKEN_PROGRAM_ID)
          )
        );
      }

      // Mint tokens
      const mintAmount = BigInt(amount * Math.pow(10, decimals));
      transaction.add(
        createMintToInstruction(
          mint,
          associatedToken,
          this.publicKey,
          mintAmount,
          [],
          new PublicKey(TOKEN_2022_PROGRAM_ID)
        )
      );

      transaction.recentBlockhash = (
        await this.connection.getLatestBlockhash()
      ).blockhash;
      transaction.feePayer = this.publicKey;

      const signed = await this.wallet.signTransaction(transaction);
      const txHash = await this.connection.sendRawTransaction(signed.serialize());
      
      await this.connection.confirmTransaction(txHash, 'confirmed');

      console.log('[Token2022] ✅ Minted tokens:', {
        amount,
        txHash
      });

      return {
        success: true,
        txHash,
        amount,
        explorerUrl: `https://explorer.x1.xyz/tx/${txHash}`
      };
    } catch (error) {
      console.error('[Token2022] Mint error:', error);
      throw error;
    }
  }

  /**
   * Burn tokens to incinerator
   */
  async burnTokens(mintAddress, amount, decimals = 9) {
    try {
      if (!this.wallet || !this.publicKey) {
        throw new Error('Wallet not connected');
      }

      const mint = new PublicKey(mintAddress);
      const userTokenAccount = await getAssociatedTokenAddress(
        mint,
        this.publicKey,
        false,
        new PublicKey(TOKEN_2022_PROGRAM_ID),
        new PublicKey(ASSOCIATED_TOKEN_PROGRAM_ID)
      );

      const burnAmount = BigInt(amount * Math.pow(10, decimals));

      const transaction = new Transaction().add(
        createBurnInstruction(
          userTokenAccount,
          mint,
          this.publicKey,
          burnAmount,
          [],
          new PublicKey(TOKEN_2022_PROGRAM_ID)
        )
      );

      transaction.recentBlockhash = (
        await this.connection.getLatestBlockhash()
      ).blockhash;
      transaction.feePayer = this.publicKey;

      const signed = await this.wallet.signTransaction(transaction);
      const txHash = await this.connection.sendRawTransaction(signed.serialize());
      
      await this.connection.confirmTransaction(txHash, 'confirmed');

      console.log('[Token2022] ✅ Burned tokens to incinerator:', {
        amount,
        destination: INCINERATOR_ADDRESS,
        txHash
      });

      return {
        success: true,
        txHash,
        amount,
        destination: INCINERATOR_ADDRESS,
        explorerUrl: `https://explorer.x1.xyz/tx/${txHash}`
      };
    } catch (error) {
      console.error('[Token2022] Burn error:', error);
      throw error;
    }
  }

  /**
   * Lock mint authority permanently
   */
  async lockMintAuthority(mintAddress) {
    try {
      if (!this.wallet || !this.publicKey) {
        throw new Error('Wallet not connected');
      }

      // Check current authority
      const authCheck = await this.checkMintAuthority(mintAddress);
      if (!authCheck.hasAuthority) {
        throw new Error('You are not the current mint authority');
      }

      const mint = new PublicKey(mintAddress);
      const transaction = new Transaction().add(
        createSetAuthorityInstruction(
          mint,
          this.publicKey,
          AuthorityType.MintTokens,
          null, // Set to null = permanent lock
          [],
          new PublicKey(TOKEN_2022_PROGRAM_ID)
        )
      );

      transaction.recentBlockhash = (
        await this.connection.getLatestBlockhash()
      ).blockhash;
      transaction.feePayer = this.publicKey;

      const signed = await this.wallet.signTransaction(transaction);
      const txHash = await this.connection.sendRawTransaction(signed.serialize());
      
      await this.connection.confirmTransaction(txHash, 'confirmed');

      console.log('[Token2022] ✅ Mint authority locked permanently');

      return {
        success: true,
        txHash,
        message: 'Mint authority permanently locked - no more tokens can be minted',
        explorerUrl: `https://explorer.x1.xyz/tx/${txHash}`
      };
    } catch (error) {
      console.error('[Token2022] Lock authority error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const token2022Service = new Token2022Service();
export default token2022Service;
